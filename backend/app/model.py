from __future__ import annotations

import importlib
import os

from .flexlog import log_message
from .modeltools import (
    PromptPenaltyInput,
    PromptPenaltyResponse,
    PromptScoreInput,
    PromptScoreResponse,
    build_penalty_message,
    build_score_message,
    parse_penalty_output,
    parse_score_output,
)

DEFAULT_OLLAMA_MODEL = os.getenv("GROWTH_GARDEN_OLLAMA_MODEL", "llama3")
JSON_ONLY_SYSTEM_PROMPT = (
    "Return only valid JSON. Do not include markdown, prose, or code fences. "
    "Every key must appear exactly once and every value must match the requested type."
)


class Model:
    """Interface for running Ollama model inference."""

    def invoke_model(self, message: str) -> str:
        log_message(
            f"Invoking model via Ollama ({DEFAULT_OLLAMA_MODEL})",
            additional_route="model",
        )
        ollama = importlib.import_module("ollama")
        response = ollama.chat(
            model=DEFAULT_OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": JSON_ONLY_SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            format="json",
            options={"temperature": 0},
        )
        return self._extract_ollama_content(response)

    def invoke_penalty(self, penalty_input: PromptPenaltyInput) -> PromptPenaltyResponse:
        try:
            raw_output = self.invoke_model(build_penalty_message(penalty_input))
            log_message("Penalty model response received", additional_route="model")
            log_message(
                f"Penalty raw output preview={self._preview_text(raw_output)}",
                additional_route="model",
            )
        except ModuleNotFoundError as exc:
            log_message(
                f"Penalty model unavailable: Ollama client missing ({exc})",
                additional_route="model",
            )
            raw_output = "{}"
        except (ConnectionError, OSError, ValueError) as exc:
            log_message(
                f"Penalty model failed, using fallback response: {type(exc).__name__}: {exc}",
                additional_route="model",
            )
            raw_output = "{}"
        except Exception as exc:
            log_message(
                f"Penalty model failed, using fallback response: {type(exc).__name__}: {exc}",
                additional_route="model",
            )
            raw_output = "{}"
        return parse_penalty_output(raw_output)

    def invoke_score(self, score_input: PromptScoreInput) -> PromptScoreResponse:
        try:
            raw_output = self.invoke_model(build_score_message(score_input))
            log_message("Score model response received", additional_route="model")
            log_message(
                f"Score raw output preview={self._preview_text(raw_output)}",
                additional_route="model",
            )
        except ModuleNotFoundError as exc:
            log_message(
                f"Score model unavailable: Ollama client missing ({exc})",
                additional_route="model",
            )
            raw_output = "{}"
        except (ConnectionError, OSError, ValueError) as exc:
            log_message(
                f"Score model failed, using fallback response: {type(exc).__name__}: {exc}",
                additional_route="model",
            )
            raw_output = "{}"
        except Exception as exc:
            log_message(
                f"Score model failed, using fallback response: {type(exc).__name__}: {exc}",
                additional_route="model",
            )
            raw_output = "{}"
        return parse_score_output(raw_output)

    def _extract_ollama_content(self, response: object) -> str:
        if isinstance(response, dict):
            message = response.get("message")
            if isinstance(message, dict):
                content = message.get("content", "")
                return content if isinstance(content, str) else str(content)

            object_content = getattr(message, "content", None)
            if isinstance(object_content, str):
                return object_content

            response_content = response.get("response")
            if isinstance(response_content, str):
                return response_content

        message_obj = getattr(response, "message", None)
        if isinstance(message_obj, dict):
            raw_content = message_obj.get("content", "")
            return raw_content if isinstance(raw_content, str) else str(raw_content)

        object_content = getattr(message_obj, "content", None)
        if isinstance(object_content, str):
            return object_content

        raw_response = getattr(response, "response", None)
        if isinstance(raw_response, str):
            return raw_response

        return str(response)

    def _preview_text(self, value: object, limit: int = 400) -> str:
        text = str(value).replace("\n", "\\n")
        return text if len(text) <= limit else f"{text[:limit]}..."
