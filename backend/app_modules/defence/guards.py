"""Defence mechanisms against prompt injection attacks."""

import logging
import re
from typing import Any


LOGGER = logging.getLogger("app.defence")


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


class InjectionDetector:
    """Detects potential prompt injection attempts."""

    def __init__(self):
        """Initialize the injection detector with pattern families."""
        self.override_patterns = [
            r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
            r"disregard\s+(the\s+)?(system|developer)\s+prompt",
            r"reveal\s+(the\s+)?(system|developer)\s+prompt",
            r"act\s+as\s+(system|root|admin)",
            r"you\s+are\s+now\s+(in\s+)?developer\s+mode",
            r"jailbreak|dan\b|do\s+anything\s+now",
        ]
        self.harmful_patterns = [
            r"build\s+(a\s+)?(bomb|malware|ransomware)",
            r"phishing\s+(message|email|template)",
            r"exploit\s+(vulnerability|system)",
            r"bypass\s+(security|safety|filters?)",
            r"steal\s+(credentials|passwords?|tokens?)",
        ]
        self.exfiltration_patterns = [
            r"(show|dump|print|reveal)\s+.*(secret|api\s*key|token|password)",
            r"exfiltrat(e|ion)",
            r"leak\s+data",
        ]
        self.obfuscation_patterns = [
            r"base64",
            r"rot13",
            r"<!--.*?-->",
            r"```[\s\S]*?```",
        ]

    def _collect_matches(self, text: str, patterns: list[str]) -> list[str]:
        matches = []
        for pattern in patterns:
            if re.search(pattern, text, flags=re.IGNORECASE):
                matches.append(pattern)
        return matches

    def analyze_message(self, message: str) -> dict[str, Any]:
        """Analyze a message for potential injection patterns."""
        normalized = (message or "").strip()
        lowered = normalized.lower()

        override_hits = self._collect_matches(lowered, self.override_patterns)
        harmful_hits = self._collect_matches(lowered, self.harmful_patterns)
        exfiltration_hits = self._collect_matches(lowered, self.exfiltration_patterns)
        obfuscation_hits = self._collect_matches(lowered, self.obfuscation_patterns)

        role_spoofing = bool(re.search(r"\b(system|developer|assistant)\s*:", lowered))
        extreme_length = len(normalized) > 1800

        risk_score = 0.0
        risk_score += min(0.55, 0.18 * len(override_hits))
        risk_score += min(0.55, 0.2 * len(harmful_hits))
        risk_score += min(0.45, 0.22 * len(exfiltration_hits))
        risk_score += min(0.25, 0.08 * len(obfuscation_hits))
        if role_spoofing:
            risk_score += 0.12
        if extreme_length:
            risk_score += 0.08
        risk_score = _clamp(risk_score)

        attack_types = []
        if override_hits:
            attack_types.append("instruction_override")
        if harmful_hits:
            attack_types.append("harmful_request")
        if exfiltration_hits:
            attack_types.append("data_exfiltration")
        if obfuscation_hits:
            attack_types.append("obfuscation")
        if role_spoofing:
            attack_types.append("role_spoofing")

        if risk_score >= 0.75:
            risk_level = "high"
        elif risk_score >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"

        reasons = []
        if override_hits:
            reasons.append("Detected instruction override attempt")
        if harmful_hits:
            reasons.append("Detected harmful or abuse-oriented intent")
        if exfiltration_hits:
            reasons.append("Detected attempts to retrieve secrets or sensitive data")
        if obfuscation_hits:
            reasons.append("Detected obfuscation that may hide malicious instructions")
        if role_spoofing:
            reasons.append("Detected role spoofing pattern")

        recommendations = [
            "Keep system/developer instructions immutable",
            "Reject or sanitize high-risk user content",
        ]
        if risk_level != "low":
            recommendations.append("Route this request through secured mode only")

        return {
            "is_suspicious": risk_level != "low",
            "risk_level": risk_level,
            "risk_score": round(risk_score, 4),
            "attack_types": attack_types,
            "matched_patterns": {
                "override": override_hits,
                "harmful": harmful_hits,
                "exfiltration": exfiltration_hits,
                "obfuscation": obfuscation_hits,
            },
            "reasons": reasons,
            "recommendations": recommendations,
        }

    def sanitize_content(self, content: str) -> str:
        """Sanitize message content to reduce injection risk."""
        sanitized = content

        for pattern in self.override_patterns + self.exfiltration_patterns:
            sanitized = re.sub(pattern, "[FILTERED_PROMPT_INJECTION_PATTERN]", sanitized, flags=re.IGNORECASE)

        # Remove explicit role-forcing prefixes.
        sanitized = re.sub(r"\b(system|developer|assistant)\s*:", "[FILTERED_ROLE]:", sanitized, flags=re.IGNORECASE)
        return sanitized

    def extract_guardrails(self, system_prompt: str) -> list[str]:
        """Extract key guardrails from the system prompt."""
        if not system_prompt:
            return []

        guardrails = []
        for line in system_prompt.splitlines():
            text = line.strip()
            if not text:
                continue
            lowered = text.lower()
            if any(token in lowered for token in ("must", "never", "do not", "only", "cannot")):
                guardrails.append(text)
        return guardrails


class RLPolicyAgent:
    """Lightweight RL-style policy layer for defence decisions.

    This approximates learned Q-values using feature-weighted action scoring.
    """

    ACTION_ALLOW = "allow"
    ACTION_BLOCK = "block"
    ACTION_SANITIZE = "sanitize"
    ACTION_ASK = "ask_confirmation"

    def __init__(self):
        self.actions = [self.ACTION_ALLOW, self.ACTION_BLOCK, self.ACTION_SANITIZE, self.ACTION_ASK]

        # Hand-tuned policy weights that mimic a trained policy baseline.
        self.weights = {
            self.ACTION_ALLOW: {
                "bias": 0.35,
                "risk_score": -1.2,
                "has_override": -0.8,
                "has_harmful": -1.0,
                "has_exfiltration": -1.0,
                "has_obfuscation": -0.35,
                "guardrail_conflict": -0.45,
            },
            self.ACTION_BLOCK: {
                "bias": -0.15,
                "risk_score": 1.3,
                "has_override": 0.7,
                "has_harmful": 1.05,
                "has_exfiltration": 1.15,
                "has_obfuscation": 0.2,
                "guardrail_conflict": 0.5,
            },
            self.ACTION_SANITIZE: {
                "bias": 0.05,
                "risk_score": 0.75,
                "has_override": 0.85,
                "has_harmful": 0.2,
                "has_exfiltration": 0.55,
                "has_obfuscation": 0.45,
                "guardrail_conflict": 0.35,
            },
            self.ACTION_ASK: {
                "bias": 0.0,
                "risk_score": 0.55,
                "has_override": 0.4,
                "has_harmful": 0.25,
                "has_exfiltration": 0.45,
                "has_obfuscation": 0.45,
                "guardrail_conflict": 0.55,
            },
        }

    def _to_features(self, analysis: dict[str, Any], guardrails: list[str]) -> dict[str, float]:
        attack_types = set(analysis.get("attack_types") or [])
        return {
            "risk_score": float(analysis.get("risk_score", 0.0)),
            "has_override": 1.0 if "instruction_override" in attack_types else 0.0,
            "has_harmful": 1.0 if "harmful_request" in attack_types else 0.0,
            "has_exfiltration": 1.0 if "data_exfiltration" in attack_types else 0.0,
            "has_obfuscation": 1.0 if "obfuscation" in attack_types else 0.0,
            "guardrail_conflict": 1.0 if guardrails and "instruction_override" in attack_types else 0.0,
        }

    def _q_value(self, action: str, features: dict[str, float]) -> float:
        action_weights = self.weights[action]
        score = action_weights.get("bias", 0.0)
        for key, value in features.items():
            score += action_weights.get(key, 0.0) * value
        return score

    def decide(self, analysis: dict[str, Any], guardrails: list[str]) -> dict[str, Any]:
        features = self._to_features(analysis, guardrails)

        q_values = {action: self._q_value(action, features) for action in self.actions}
        action = max(q_values, key=q_values.get)

        # Safety guardrails: enforce conservative behavior on high-risk patterns.
        if analysis.get("risk_score", 0) >= 0.85:
            action = self.ACTION_BLOCK
        elif analysis.get("risk_score", 0) >= 0.55 and action == self.ACTION_ALLOW:
            action = self.ACTION_SANITIZE

        return {
            "action": action,
            "q_values": q_values,
            "features": features,
        }


class DefenceLayer:
    """Main defence layer for secured endpoint."""

    def __init__(self, enabled: bool = True):
        """Initialize the defence layer."""
        self.enabled = enabled
        self.detector = InjectionDetector()
        self.policy = RLPolicyAgent()

    def process_secured_request(self, messages: list[dict], system_prompt: str) -> dict[str, Any]:
        """Process a chat request with RL-based security checks."""
        if not self.enabled:
            LOGGER.info("[detector] enabled=false decision=allow reason=defence_disabled")
            return {"passed": True, "alerts": [], "modified_messages": messages}

        guardrails = self.detector.extract_guardrails(system_prompt)
        alerts = []
        modified_messages = []
        blocked = False

        LOGGER.info(
            "[detector] enabled=true message_count=%s guardrail_count=%s",
            len(messages),
            len(guardrails),
        )

        for index, msg in enumerate(messages):
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Analyze only user/tool content as attack surface.
            if role not in {"user", "tool"}:
                modified_messages.append(msg)
                continue

            analysis = self.detector.analyze_message(content)
            policy_result = self.policy.decide(analysis, guardrails)
            action = policy_result["action"]

            preview = " ".join(content.strip().split())[:120]
            LOGGER.info(
                "[detector] index=%s role=%s action=%s risk_level=%s risk_score=%.2f attacks=%s preview=%s",
                index,
                role,
                action,
                analysis["risk_level"],
                analysis["risk_score"],
                analysis["attack_types"],
                preview,
            )

            next_message = dict(msg)
            if action == RLPolicyAgent.ACTION_SANITIZE:
                next_message["content"] = self.detector.sanitize_content(content)

            if action in {RLPolicyAgent.ACTION_BLOCK, RLPolicyAgent.ACTION_SANITIZE, RLPolicyAgent.ACTION_ASK}:
                alerts.append(
                    {
                        "message_index": index,
                        "message_role": role,
                        "decision": action,
                        "risk_level": analysis["risk_level"],
                        "risk_score": analysis["risk_score"],
                        "attack_types": analysis["attack_types"],
                        "reasons": analysis["reasons"],
                        "recommendations": analysis["recommendations"],
                        "rl_features": policy_result["features"],
                        "rl_q_values": policy_result["q_values"],
                    }
                )

            if action in {RLPolicyAgent.ACTION_BLOCK, RLPolicyAgent.ACTION_ASK}:
                blocked = True

            modified_messages.append(next_message)

        return {
            "passed": not blocked,
            "alerts": alerts,
            "modified_messages": modified_messages,
        }
