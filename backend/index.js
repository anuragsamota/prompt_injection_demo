const express = require("express")
const path = require("path")
const dotenv = require("dotenv")

dotenv.config({ path: path.resolve(__dirname, ".env") })

const PORT = Number.parseInt(process.env.PORT || "8080", 10)
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "")
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:latest"
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173"

const app = express()

app.use(express.json({ limit: "2mb" }))

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN)
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
	res.setHeader("Access-Control-Max-Age", "86400")

	if (req.method === "OPTIONS") {
		res.status(204).end()
		return
	}

	next()
})

app.get("/health", (_req, res) => {
	res.json({
		ok: true,
		service: "ollama-chat-proxy",
		model: OLLAMA_MODEL,
		ollamaBaseUrl: OLLAMA_BASE_URL,
	})
})

app.post("/api/chat", async (req, res) => {
	const traceId = createTraceId()
	const { payload, error } = buildChatPayload(req.body, false)

	if (error) {
		res.status(400).json({ ok: false, error })
		return
	}

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
			method: "POST",
			headers: buildOllamaHeaders(false),
			body: JSON.stringify(payload),
		})

		if (!response.ok) {
			const details = await safeReadText(response)
			res.status(response.status).json({
				ok: false,
				error: "Ollama chat request failed",
				details,
			})
			return
		}

		const data = await response.json()
		console.log(`[proxy:${traceId}] <- /api/chat status=${response.status} ok`)
		console.log(
			`[proxy:${traceId}] response_summary=${serializeForLog({ model: data.model, done: data.done, done_reason: data.done_reason, eval_count: data.eval_count })}`,
		)

		res.setHeader("X-Proxy-Trace-Id", traceId)
		res.json({ ok: true, ...data })
	} catch (error) {
		console.error(`[proxy:${traceId}] !! /api/chat fetch_failed=${String(error?.message || error)}`)
		res.status(502).json({
			ok: false,
			error: "Failed to reach Ollama",
			details: String(error?.message || error),
		})
	}
})

app.post("/api/chat/stream", async (req, res) => {
	const traceId = createTraceId()
	const { payload, error } = buildChatPayload(req.body, true)

	if (error) {
		res.status(400).json({ ok: false, error })
		return
	}

	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Proxy-Trace-Id", traceId)
	res.flushHeaders?.()

	console.log(`[proxy:${traceId}] -> /api/chat model=${payload.model} stream=true`)
	console.log(`[proxy:${traceId}] request_body=${serializeForLog(payload)}`)

	const abortController = new AbortController()
	let clientClosed = false
	res.on("close", () => {
		clientClosed = true
		abortController.abort()
	})

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
			method: "POST",
			headers: buildOllamaHeaders(true),
			body: JSON.stringify(payload),
			signal: abortController.signal,
		})

		console.log(
			`[proxy:${traceId}] response_meta status=${response.status} content_type=${response.headers.get("content-type") || "unknown"}`,
		)

		if (!response.ok || !response.body) {
			const details = await safeReadText(response)
			console.error(`[proxy:${traceId}] <- /api/chat status=${response.status} stream_error`)
			writeSse(res, "error", { message: "Ollama streaming request failed", details })
			writeSse(res, "done", { reason: "error" })
			res.end()
			return
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder("utf-8")
		let buffer = ""
		let chunks = 0
		let tokens = 0
		let doneMeta = null

		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				console.log(`[proxy:${traceId}] <- /api/chat stream_complete`)
				break
			}

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split("\n")
			buffer = lines.pop() || ""

			for (const rawLine of lines) {
				const line = rawLine.trim()
				if (!line) {
					continue
				}

				let parsed
				try {
					parsed = JSON.parse(line)
				} catch {
					continue
				}

				if (parsed.error) {
					writeSse(res, "error", { message: parsed.error })
					continue
				}

				chunks += 1
				writeSse(res, "chunk", parsed)

				const token = parsed.message?.content || ""
				if (token) {
					tokens += 1
					writeSse(res, "token", { content: token })
				}

				if (parsed.done) {
					doneMeta = {
						done_reason: parsed.done_reason,
						eval_count: parsed.eval_count,
						total_duration: parsed.total_duration,
					}
					writeSse(res, "done", {
						doneReason: parsed.done_reason || "stop",
						totalDuration: parsed.total_duration,
						evalCount: parsed.eval_count,
					})
				}
			}
		}

		console.log(
			`[proxy:${traceId}] stream_summary=${serializeForLog({ chunks, tokens, done: doneMeta })}`,
		)
		res.end()
	} catch (error) {
		if (error?.name === "AbortError" && clientClosed) {
			console.warn(`[proxy:${traceId}] xx /api/chat stream_aborted_by_client`)
			res.end()
			return
		}

		console.error(`[proxy:${traceId}] !! /api/chat stream_failed=${String(error?.message || error)}`)
		writeSse(res, "error", {
			message: "Streaming connection failed",
			details: String(error?.message || error),
		})
		writeSse(res, "done", { reason: "error" })
		res.end()
	}
})

app.use((_req, res) => {
	res.status(404).json({ ok: false, error: "Not found" })
})

app.listen(PORT, () => {
	console.log(`[backend] listening on http://localhost:${PORT}`)
	console.log(`[backend] ollama base: ${OLLAMA_BASE_URL}`)
	console.log(`[backend] default model: ${OLLAMA_MODEL}`)
})

function buildChatPayload(input, stream) {
	const body = input || {}
	const { model, messages, options, format, tools, keep_alive, think } = body

	if (!Array.isArray(messages) || messages.length === 0) {
		return { error: "messages must be a non-empty array" }
	}

	for (const message of messages) {
		if (!message || typeof message !== "object") {
			return { error: "each message must be an object" }
		}

		if (typeof message.role !== "string" || typeof message.content !== "string") {
			return { error: "each message requires string role and string content" }
		}

		const validRoles = new Set(["system", "user", "assistant", "tool"])
		if (!validRoles.has(message.role)) {
			return { error: `invalid message role: ${message.role}` }
		}
	}

	const payload = {
		model: typeof model === "string" && model.trim() ? model : OLLAMA_MODEL,
		messages,
		stream,
	}

	if (options && typeof options === "object") {
		payload.options = options
	}

	if (format !== undefined) {
		payload.format = format
	}

	if (Array.isArray(tools)) {
		payload.tools = tools
	}

	if (keep_alive !== undefined) {
		payload.keep_alive = keep_alive
	}

	if (typeof think === "boolean") {
		payload.think = think
	}

	return { payload }
}

function buildOllamaHeaders(stream) {
	return {
		"Content-Type": "application/json",
		Accept: stream ? "application/x-ndjson" : "application/json",
	}
}

function writeSse(res, event, data) {
	res.write(`event: ${event}\n`)
	res.write(`data: ${JSON.stringify(data)}\n\n`)
}

async function safeReadText(response) {
	if (!response || typeof response.text !== "function") {
		return ""
	}

	try {
		return await response.text()
	} catch {
		return ""
	}
}

function createTraceId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function serializeForLog(value, maxLength = 1200) {
	try {
		const text = JSON.stringify(value)
		if (typeof text !== "string") {
			return String(text)
		}
		if (text.length <= maxLength) {
			return text
		}
		return `${text.slice(0, maxLength)}...(truncated ${text.length - maxLength} chars)`
	} catch {
		return String(value)
	}
}
