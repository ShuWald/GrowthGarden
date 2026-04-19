from __future__ import annotations

from datetime import datetime
from typing import Any

from .flexlog import log_message
from .metrics import PromptMetricsResult, score_model_output


class PromptProcessor:
    def process(self, raw_data: dict[str, Any]) -> PromptMetricsResult:
        log_message("Starting prompt processing pipeline", additional_route="process")
        prompt_payload = self._extract_prompt(raw_data)
        log_message(
            f"Prompt extracted from source={prompt_payload['source']}",
            additional_route="process",
        )
        metrics_result = score_model_output(
            user_prompt=prompt_payload["prompt"],
            source=prompt_payload["source"],
            prompt_timestamp=prompt_payload["timestamp"],
        )
        log_message(
            f"Pipeline complete final_score={metrics_result.final_score}",
            additional_route="process",
        )
        return metrics_result

    def _extract_prompt(self, raw_data: dict[str, Any]) -> dict[str, str]:
        prompt_value = raw_data.get("prompt", "")
        if not isinstance(prompt_value, str):
            raise ValueError("Field 'prompt' must be a string.")

        prompt = prompt_value.strip()
        if not prompt:
            raise ValueError("Field 'prompt' must not be empty.")

        source_value = raw_data.get("source", "unknown")
        source = source_value.strip() if isinstance(source_value, str) else "unknown"

        timestamp_value = raw_data.get("timestamp")
        if isinstance(timestamp_value, str) and timestamp_value.strip():
            timestamp = timestamp_value.strip()
        else:
            timestamp = datetime.utcnow().isoformat()

        return {
            "prompt": prompt,
            "source": source or "unknown",
            "timestamp": timestamp,
        }
