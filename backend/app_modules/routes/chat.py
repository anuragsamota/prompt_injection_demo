"""Unsecured chat endpoints (no defence layer)."""

import json
from typing import Iterable

import requests
from flask import Response, jsonify, request, stream_with_context

from app_modules.config import OLLAMA_BASE_URL
from app_modules.utils import (
    build_chat_payload,
    build_ollama_headers,
    safe_read_text,
    serialize_for_log,
    write_sse,
)
from app_modules.utils.logging import create_trace_id


def register_chat_routes(app):
    """Register unsecured chat endpoints."""

    @app.route("/api/chat", methods=["POST"])
    def chat() -> Response:
        """Send a chat message and get a non-streaming response."""
        trace_id = create_trace_id()
        validation = build_chat_payload(request.get_json(silent=True), stream=False)

        if validation.get("error"):
            return jsonify(ok=False, error=validation["error"]), 400

        payload = validation["payload"]

        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                headers=build_ollama_headers(stream=False),
                json=payload,
                timeout=120,
            )

            if not response.ok:
                return (
                    jsonify(
                        ok=False,
                        error="Ollama chat request failed",
                        details=safe_read_text(response),
                    ),
                    response.status_code,
                )

            try:
                data = response.json()
            except ValueError as error:
                return (
                    jsonify(ok=False, error="Ollama returned invalid JSON", details=str(error)),
                    502,
                )

            app.logger.info(
                "[proxy:%s] <- /api/chat status=%s ok response_summary=%s",
                trace_id,
                response.status_code,
                serialize_for_log(
                    {
                        "model": data.get("model"),
                        "done": data.get("done"),
                        "done_reason": data.get("done_reason"),
                        "eval_count": data.get("eval_count"),
                    }
                ),
            )

            output = jsonify(ok=True, **data)
            output.headers["X-Proxy-Trace-Id"] = trace_id
            return output
        except requests.RequestException as error:
            return (
                jsonify(ok=False, error="Failed to reach Ollama", details=str(error)),
                502,
            )

    @app.route("/api/chat/stream", methods=["POST"])
    def chat_stream() -> Response:
        """Send a chat message and stream the response as SSE."""
        trace_id = create_trace_id()
        validation = build_chat_payload(request.get_json(silent=True), stream=True)

        if validation.get("error"):
            return jsonify(ok=False, error=validation["error"]), 400

        payload = validation["payload"]
        app.logger.info("[proxy:%s] -> /api/chat model=%s stream=true", trace_id, payload["model"])
        app.logger.info("[proxy:%s] request_body=%s", trace_id, serialize_for_log(payload))

        def generate() -> Iterable[str]:
            upstream_response = None
            try:
                upstream_response = requests.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    headers=build_ollama_headers(stream=True),
                    json=payload,
                    stream=True,
                    timeout=(10, None),
                )

                app.logger.info(
                    "[proxy:%s] response_meta status=%s content_type=%s",
                    trace_id,
                    upstream_response.status_code,
                    upstream_response.headers.get("content-type", "unknown"),
                )

                if not upstream_response.ok:
                    details = safe_read_text(upstream_response)
                    app.logger.error(
                        "[proxy:%s] <- /api/chat status=%s stream_error",
                        trace_id,
                        upstream_response.status_code,
                    )
                    yield write_sse("error", {"message": "Ollama streaming request failed", "details": details})
                    yield write_sse("done", {"reason": "error"})
                    return

                chunks = 0
                tokens = 0
                done_meta = None

                for raw_line in upstream_response.iter_lines(decode_unicode=True):
                    if not raw_line:
                        continue

                    line = raw_line.strip()
                    if not line:
                        continue

                    try:
                        parsed = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if parsed.get("error"):
                        yield write_sse("error", {"message": parsed.get("error")})
                        continue

                    chunks += 1
                    yield write_sse("chunk", parsed)

                    token = (parsed.get("message") or {}).get("content") or ""
                    if token:
                        tokens += 1
                        yield write_sse("token", {"content": token})

                    if parsed.get("done"):
                        done_meta = {
                            "done_reason": parsed.get("done_reason"),
                            "eval_count": parsed.get("eval_count"),
                            "total_duration": parsed.get("total_duration"),
                        }
                        yield write_sse(
                            "done",
                            {
                                "doneReason": parsed.get("done_reason") or "stop",
                                "totalDuration": parsed.get("total_duration"),
                                "evalCount": parsed.get("eval_count"),
                            },
                        )

                app.logger.info(
                    "[proxy:%s] stream_summary=%s",
                    trace_id,
                    serialize_for_log({"chunks": chunks, "tokens": tokens, "done": done_meta}),
                )
            except requests.RequestException as error:
                app.logger.error("[proxy:%s] !! /api/chat stream_failed=%s", trace_id, error)
                yield write_sse("error", {"message": "Streaming connection failed", "details": str(error)})
                yield write_sse("done", {"reason": "error"})
            finally:
                if upstream_response is not None:
                    upstream_response.close()

        response = Response(stream_with_context(generate()), mimetype="text/event-stream")
        response.headers["Cache-Control"] = "no-cache"
        response.headers["Connection"] = "keep-alive"
        response.headers["X-Proxy-Trace-Id"] = trace_id
        return response

    return app
