from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError, PartialCredentialsError

from .flexlog import log_message

penalties = {
    "spam": "Does the prompt contain irrelevant or promotional content that detracts from meaningful interactions? Is it overly short, badly structured, or lacking in substance?",
    "personal information": "Does the prompt contain personally identifiable information (PII) or sensitive data that could compromise user privacy or security?",
}
criteria = {
    "insightfulness": "Does the prompt demonstrate deep thinking, novel insights, and/or problem solving on the user end?",
    "context": "Does the prompt provide enough context and information for the model to generate a meaningful response? Is it clear and specific?",
    "responsibility": "Does the prompt adhere to responsible AI usage practices, avoiding harmful, biased, or inappropriate content?",
}

PENALTY_JSON_SCHEMA = {
    key: "integer penalty score" for key in penalties.keys()
}
SCORE_JSON_SCHEMA = {
    key: "float quality score" for key in criteria.keys()
}

model_penalties = (
    "Evaluate the user prompt for the following penalty categories and return ONLY "
    "one valid JSON object. Do not include markdown, prose, or code fences. "
    "Each key must appear exactly once and every value must be an integer. "
    f"Categories: {penalties}. "
    f"Required JSON shape: {PENALTY_JSON_SCHEMA}."
)
score_prompt = (
    "Evaluate the user prompt for the following scoring categories and return ONLY "
    "one valid JSON object. Do not include markdown, prose, or code fences. "
    "Each key must appear exactly once and every value must be a float. "
    f"Categories: {criteria}. "
    f"Required JSON shape: {SCORE_JSON_SCHEMA}."
)


@dataclass
class ModelInput:
    prompt: str
    source: str = "unknown"
    timestamp: str = ""


@dataclass
class PromptPenaltyInput(ModelInput):
    pass


@dataclass
class PromptScoreInput(ModelInput):
    pass


@dataclass
class PromptPenaltyResponse:
    penalties: dict[str, int]
    raw_output: str = ""


@dataclass
class PromptScoreResponse:
    scores: dict[str, float]
    raw_output: str = ""


DEFAULT_BEDROCK_MODEL_ID = os.getenv(
    "GROWTH_GARDEN_BEDROCK_MODEL_ID",
    "arn:aws:bedrock:us-west-2:759967343613:inference-profile/us.anthropic.claude-opus-4-6-v1",
)
DEFAULT_BEDROCK_REGION = os.getenv("AWS_REGION", "us-west-2")


def invoke_penalty_model(penalty_input: PromptPenaltyInput) -> PromptPenaltyResponse:
    return _invoke_bedrock_model(
        penalty_input=penalty_input,
        score_input=None,
        parse_response=parse_penalty_output,
        request_label="penalty",
    )


def invoke_score_model(score_input: PromptScoreInput) -> PromptScoreResponse:
    return _invoke_bedrock_model(
        penalty_input=None,
        score_input=score_input,
        parse_response=parse_score_output,
        request_label="score",
    )


def parse_penalty_output(raw_output: str) -> PromptPenaltyResponse:
    parsed = _extract_json_object(raw_output)
    penalties_map = {
        key: _coerce_int(parsed.get(key, 0)) for key in penalties.keys()
    }
    return PromptPenaltyResponse(penalties=penalties_map, raw_output=raw_output)


def parse_score_output(raw_output: str) -> PromptScoreResponse:
    parsed = _extract_json_object(raw_output)
    scores_map = {
        key: _coerce_float(parsed.get(key, 0.0)) for key in criteria.keys()
    }
    return PromptScoreResponse(scores=scores_map, raw_output=raw_output)


def build_penalty_message(model_input: ModelInput) -> str:
    return (
        f"{model_penalties}\n\n"
        f"Prompt source: {model_input.source}\n"
        f"Prompt timestamp: {model_input.timestamp}\n"
        f'User prompt: "{model_input.prompt}"'
    )


def build_score_message(model_input: ModelInput) -> str:
    return (
        f"{score_prompt}\n\n"
        f"Prompt source: {model_input.source}\n"
        f"Prompt timestamp: {model_input.timestamp}\n"
        f'User prompt: "{model_input.prompt}"'
    )


def _extract_json_object(raw_output: str) -> dict:
    if not raw_output.strip():
        return {}

    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_output, re.DOTALL)
        if not match:
            log_message("Failed to find JSON in model output", additional_route="model")
            return {}
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            log_message("Failed to parse model output JSON", additional_route="model")
            return {}


def _coerce_int(value: object) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _coerce_float(value: object) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _invoke_bedrock_model(
    penalty_input: PromptPenaltyInput | None,
    score_input: PromptScoreInput | None,
    parse_response,
    request_label: str,
):
    model_input = penalty_input or score_input
    if model_input is None:
        raise ValueError("model input is required")

    log_message(f"Invoking {request_label} model", additional_route="model")

    try:
        client = boto3.client("bedrock-runtime", region_name=DEFAULT_BEDROCK_REGION)
        message = (
            build_penalty_message(model_input)
            if request_label == "penalty"
            else build_score_message(model_input)
        )
        response = client.invoke_model(
            modelId=DEFAULT_BEDROCK_MODEL_ID,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": message}],
                }
            ),
        )
        raw_body = response["body"].read()
        raw_output = raw_body.decode("utf-8") if isinstance(raw_body, bytes) else str(raw_body)
        log_message(f"{request_label.title()} model response received", additional_route="model")
        return parse_response(raw_output)
    except (NoCredentialsError, PartialCredentialsError) as exc:
        log_message(
            f"{request_label.title()} model unavailable: missing AWS credentials ({exc})",
            additional_route="model",
        )
    except (ClientError, BotoCoreError, OSError, ValueError) as exc:
        log_message(
            f"{request_label.title()} model failed, using fallback response: {type(exc).__name__}: {exc}",
            additional_route="model",
        )

    return parse_response("{}")
