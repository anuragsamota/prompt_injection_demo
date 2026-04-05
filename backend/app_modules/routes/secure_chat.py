"""Secured chat endpoints (with defence layer against prompt injection)."""

import json
from typing import Iterable

import requests
from flask import Response, jsonify, request, stream_with_context

from app_modules.config import OLLAMA_BASE_URL
from app_modules.defence import DefenceLayer
from app_modules.utils import (
    build_chat_payload,
    build_ollama_headers,
    safe_read_text,
    serialize_for_log,
    write_sse,
)
from app_modules.utils.logging import create_trace_id
from prompt_defender import check_prompt


def _get_latest_user_prompt(messages) -> str:
    """Return the latest user message content from a chat message list."""
    for msg in reversed(messages or []):
        if msg.get("role") == "user":
            return msg.get("content", "") or ""
    return ""


def register_secure_chat_routes(app):
    """Register secured chat endpoints with defence layer."""
    defence_layer = DefenceLayer(enabled=True)

    @app.route("/api/chat/secure", methods=["POST"])
    def secure_chat() -> Response:
        """Send a chat message with security checks and get non-streaming response."""
        trace_id = create_trace_id()
        validation = build_chat_payload(request.get_json(silent=True), stream=False)

        if validation.get("error"):
            return jsonify(ok=False, error=validation["error"]), 400

        payload = validation["payload"]
        messages = payload.get("messages", [])
        system_prompt = next(
            (msg.get("content", "") for msg in messages if msg.get("role") == "system"),
            "",
        )
        user_prompt = _get_latest_user_prompt(messages)

        app.logger.info(
            "[secure:%s] route=/api/chat/secure stage=received model=%s message_count=%s",
            trace_id,
            payload.get("model"),
            len(messages),
        )

        app.logger.info("[secure:%s] RL input=%r", trace_id, user_prompt[:120])
        rl_result = check_prompt(user_prompt)
        app.logger.info("[secure:%s] RL result=%s", trace_id, rl_result)

        if rl_result == 1:
            app.logger.warning(
                "[secure:%s] route=/api/chat/secure stage=blocked_by_rl prompt=%s",
                trace_id,
                user_prompt[:100],
            )
            return jsonify(
                ok=False,
                error="Blocked by RL prompt defense",
                traceId=trace_id,
                source="rl_model",
            ), 400

        # Apply defence layer
        defence_result = defence_layer.process_secured_request(messages, system_prompt)

        if not defence_result["passed"]:
            app.logger.warning(
                "[secure:%s] route=/api/chat/secure stage=blocked alerts=%s",
                trace_id,
                len(defence_result["alerts"]),
            )
            return jsonify(
                ok=False,
                error="Request blocked by security checks",
                alerts=defence_result["alerts"],
                traceId=trace_id,
            ), 400

        app.logger.info(
            "[secure:%s] route=/api/chat/secure stage=passed alerts=%s",
            trace_id,
            len(defence_result["alerts"]),
        )

        # Use modified messages from defence layer
        payload["messages"] = defence_result["modified_messages"]

        try:
            app.logger.debug(
                "[secure:%s] route=/api/chat/secure stage=forwarding_to_ollama",
                trace_id,
            )
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
                        traceId=trace_id,
                    ),
                    response.status_code,
                )

            try:
                data = response.json()
            except ValueError as error:
                return (
                    jsonify(
                        ok=False,
                        error="Ollama returned invalid JSON",
                        details=str(error),
                        traceId=trace_id,
                    ),
                    502,
                )

            app.logger.debug(
                "[proxy:%s] <- /api/chat/secure status=%s ok response_summary=%s",
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

            output = jsonify(
                ok=True,
                securityAlerts=defence_result["alerts"],
                traceId=trace_id,
                **data,
            )
            output.headers["X-Proxy-Trace-Id"] = trace_id
            output.headers["X-Secured-Backend"] = "true"
            return output
        except requests.RequestException as error:
            return (
                jsonify(
                    ok=False,
                    error="Failed to reach Ollama",
                    details=str(error),
                    traceId=trace_id,
                ),
                502,
            )

    @app.route("/api/chat/secure/stream", methods=["POST"])
    def secure_chat_stream() -> Response:
        """Send a chat message with security checks and stream response as SSE."""
        trace_id = create_trace_id()
        validation = build_chat_payload(request.get_json(silent=True), stream=True)

        if validation.get("error"):
            return jsonify(ok=False, error=validation["error"]), 400

        payload = validation["payload"]
        messages = payload.get("messages", [])
        system_prompt = next(
            (msg.get("content", "") for msg in messages if msg.get("role") == "system"),
            "",
        )
        user_prompt = _get_latest_user_prompt(messages)

        app.logger.info(
            "[secure:%s] route=/api/chat/secure/stream stage=received model=%s message_count=%s",
            trace_id,
            payload.get("model"),
            len(messages),
        )
        app.logger.debug("[secure:%s] request_body=%s", trace_id, serialize_for_log(payload))

        app.logger.info("[secure:%s] RL input=%r", trace_id, user_prompt[:120])
        rl_result = check_prompt(user_prompt)
        app.logger.info("[secure:%s] RL result=%s", trace_id, rl_result)

        if rl_result == 1:
            app.logger.warning(
                "[secure:%s] route=/api/chat/secure/stream stage=blocked_by_rl prompt=%s",
                trace_id,
                user_prompt[:100],
            )

            def generate_rl_block() -> Iterable[str]:
                yield write_sse("status", {"level": "error", "message": "Request blocked by RL prompt defense"})
                yield write_sse("done", {"reason": "rl_block"})

            response = Response(stream_with_context(generate_rl_block()), mimetype="text/event-stream")
            response.headers["Cache-Control"] = "no-cache"
            response.headers["Connection"] = "keep-alive"
            response.headers["X-Proxy-Trace-Id"] = trace_id
            response.headers["X-Secured-Backend"] = "true"
            return response

        # Apply defence layer
        defence_result = defence_layer.process_secured_request(messages, system_prompt)

        if not defence_result["passed"]:
            app.logger.warning(
                "[secure:%s] route=/api/chat/secure/stream stage=blocked alerts=%s",
                trace_id,
                len(defence_result["alerts"]),
            )

            def generate_error() -> Iterable[str]:
                yield write_sse("status", {"level": "error", "message": "Request blocked by security checks"})
                for alert in defence_result["alerts"]:
                    yield write_sse("alert", alert)
                yield write_sse("done", {"reason": "security_block"})

            response = Response(stream_with_context(generate_error()), mimetype="text/event-stream")
            response.headers["Cache-Control"] = "no-cache"
            response.headers["Connection"] = "keep-alive"
            response.headers["X-Proxy-Trace-Id"] = trace_id
            response.headers["X-Secured-Backend"] = "true"
            return response

        app.logger.info(
            "[secure:%s] route=/api/chat/secure/stream stage=passed alerts=%s",
            trace_id,
            len(defence_result["alerts"]),
        )

        # Use modified messages from defence layer
        payload["messages"] = defence_result["modified_messages"]

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

                app.logger.debug(
                    "[proxy:%s] response_meta status=%s content_type=%s",
                    trace_id,
                    upstream_response.status_code,
                    upstream_response.headers.get("content-type", "unknown"),
                )

                if not upstream_response.ok:
                    details = safe_read_text(upstream_response)
                    app.logger.error(
                        "[proxy:%s] <- /api/chat/secure/stream status=%s stream_error",
                        trace_id,
                        upstream_response.status_code,
                    )
                    yield write_sse("error", {"message": "Ollama streaming request failed", "details": details})
                    yield write_sse("done", {"reason": "error"})
                    return

                # Emit security alerts first
                for alert in defence_result["alerts"]:
                    yield write_sse("alert", alert)

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
                                "securityAlerts": len(defence_result["alerts"]),
                            },
                        )

                app.logger.debug(
                    "[proxy:%s] stream_summary=%s",
                    trace_id,
                    serialize_for_log(
                        {
                            "chunks": chunks,
                            "tokens": tokens,
                            "done": done_meta,
                            "security_alerts": len(defence_result["alerts"]),
                        }
                    ),
                )
            except requests.RequestException as error:
                app.logger.error("[proxy:%s] !! /api/chat/secure/stream stream_failed=%s", trace_id, error)
                yield write_sse("error", {"message": "Streaming connection failed", "details": str(error)})
                yield write_sse("done", {"reason": "error"})
            finally:
                if upstream_response is not None:
                    upstream_response.close()

        response = Response(stream_with_context(generate()), mimetype="text/event-stream")
        response.headers["Cache-Control"] = "no-cache"
        response.headers["Connection"] = "keep-alive"
        response.headers["X-Proxy-Trace-Id"] = trace_id
        response.headers["X-Secured-Backend"] = "true"
        return response

    return app