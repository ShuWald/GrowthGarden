from __future__ import annotations

import json

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

BEDROCK_REGION = "us-west-2"
BEDROCK_MODEL_ID = (
    "arn:aws:bedrock:us-west-2:759967343613:inference-profile/"
    "us.anthropic.claude-opus-4-6-v1"
)
ANTHROPIC_VERSION = "bedrock-2023-05-31"
MAX_TOKENS = 32000
JSON_ONLY_SYSTEM_PROMPT = (
    "You are a scoring service. Reply with exactly one valid JSON object and no "
    "other text, no markdown, and no code fences."
)


class Model:
    """Interface for running Bedrock model inference."""

    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is None:
            import boto3

            self._client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        return self._client

    def invoke_model(self, message: str) -> str:
        log_message("Invoking Bedrock model", additional_route="model")
        response = self._get_client().invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(
                {
                    "anthropic_version": ANTHROPIC_VERSION,
                    "max_tokens": MAX_TOKENS,
                    "system": JSON_ONLY_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": message}],
                }
            ),
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]

    def invoke_penalty(self, penalty_input: PromptPenaltyInput) -> PromptPenaltyResponse:
        raw_output = self.invoke_model(build_penalty_message(penalty_input))
        return parse_penalty_output(raw_output)

    def invoke_score(self, score_input: PromptScoreInput) -> PromptScoreResponse:
        raw_output = self.invoke_model(build_score_message(score_input))
        return parse_score_output(raw_output)
