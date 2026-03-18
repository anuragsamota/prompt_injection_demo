const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8080").replace(/\/$/, "")

export async function getBackendHealthStatus() {
  let response
  try {
    response = await fetch(`${BACKEND_BASE_URL}/health`)
  } catch (error) {
    return {
      backendUp: false,
      details: String(error?.message || error),
    }
  }

  const text = await safeReadText(response)
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    return {
      backendUp: false,
      details: data?.details || data?.error || text || "Backend health check failed",
    }
  }

  return {
    backendUp: true,
    details: "Backend server is reachable",
    model: data?.model,
  }
}

export async function getBackendConnectionStatus() {
  let response
  try {
    response = await fetch(`${BACKEND_BASE_URL}/api/connection`)
  } catch {
    response = null
  }

  if (!response || response.status === 404) {
    const health = await getBackendHealthStatus()
    return {
      connected: health.backendUp,
      modelAvailable: health.backendUp,
      details: health.backendUp ? "Backend reachable (chat-only mode)" : health.details,
      model: health.model,
    }
  }

  const text = await safeReadText(response)

  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    return {
      connected: false,
      modelAvailable: false,
      details: data?.details || text || "Unable to reach backend",
      model: data?.ollama?.model,
    }
  }

  return {
    connected: Boolean(data?.ollama?.connected),
    modelAvailable: Boolean(data?.ollama?.modelAvailable),
    details: data?.details || "Connection check completed",
    model: data?.ollama?.model,
  }
}

export async function streamAssistantReply({
  messages,
  model,
  sessionStart,
  options,
  format,
  tools,
  think,
  keepAlive,
  signal,
  onToken,
  onEvent,
}) {
  onEvent?.({
    type: "logs",
    level: "info",
    source: "backend",
    message: "Connecting to backend proxy",
  })

  const response = await fetch(`${BACKEND_BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model,
      sessionStart,
      options,
      format,
      tools,
      think,
      keep_alive: keepAlive,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const details = await safeReadText(response)
    throw new Error(details || "Backend streaming request failed")
  }

  onEvent?.({
    type: "status",
    level: "info",
    source: "backend",
    message: "Streaming response started",
  })

  let streamedText = ""
  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")
    buffer = events.pop() || ""

    for (const rawEvent of events) {
      const parsedEvent = parseSseEvent(rawEvent)
      if (!parsedEvent) {
        continue
      }

      if (parsedEvent.type === "token") {
        streamedText += parsedEvent.data?.content || ""
        onToken?.(streamedText)
        continue
      }

      if (parsedEvent.type === "done") {
        continue
      }

      if (parsedEvent.type === "error") {
        onEvent?.({
          type: "status",
          level: "error",
          source: "backend",
          message: parsedEvent.data?.message || "Backend error",
        })
      }
    }
  }

  onEvent?.({
    type: "messages",
    level: "success",
    source: "assistant",
    message: "Assistant response completed",
  })

  return streamedText
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split("\n")
  let eventType = "message"
  const dataLines = []

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim()
      continue
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  const dataText = dataLines.join("\n")

  try {
    return {
      type: eventType,
      data: JSON.parse(dataText),
    }
  } catch {
    return {
      type: eventType,
      data: { message: dataText },
    }
  }
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
