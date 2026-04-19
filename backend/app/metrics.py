from __future__ import annotations

import csv
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from .flexlog import LOG_DIR, log_message
from .model import Model
from .modeltools import PromptPenaltyInput, PromptScoreInput

METRICS_CSV_FILE = LOG_DIR / "metrics.csv"
TOTAL_SCORE_CSV_FILE = LOG_DIR / "total_score.csv"
PENALTY_PREFIX = "penalty__"
SCORE_PREFIX = "score__"
SCORE_TAG_THRESHOLD = 4.0
PENALTY_TAG_THRESHOLD = 1
MAX_RECENT_PROMPTS = 24


@dataclass
class PromptMetricsResult:
    prompt: str
    source: str
    prompt_timestamp: str
    recorded_at: str
    penalties: dict[str, int]
    criteria_scores: dict[str, float]
    final_score: float
    total_score: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def ensure_metrics_storage() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    _ensure_csv_headers(METRICS_CSV_FILE, _base_metrics_headers())
    _ensure_csv_headers(
        TOTAL_SCORE_CSV_FILE,
        _total_score_headers(),
        initial_rows=[
            {
                "updated_at": "",
                "total_score": "0.0",
                "latest_prompt": "",
                "latest_prompt_timestamp": "",
            }
        ],
    )


def score_model_output(
    user_prompt: str,
    source: str = "unknown",
    prompt_timestamp: str | None = None,
) -> PromptMetricsResult:
    model = Model()
    normalized_timestamp = prompt_timestamp or datetime.utcnow().isoformat()

    log_message(
        f"Scoring prompt source={source} timestamp={normalized_timestamp}",
        additional_route="metrics",
    )

    log_message("Invoking penalty model", additional_route="process")

    penalty_response = model.invoke_penalty(
        PromptPenaltyInput(
            prompt=user_prompt,
            source=source,
            timestamp=normalized_timestamp,
        )
    )

    log_message("Invoking score model", additional_route="process")
    score_response = model.invoke_score(
        PromptScoreInput(
            prompt=user_prompt,
            source=source,
            timestamp=normalized_timestamp,
        )
    )

    penalties = penalty_response.penalties
    criteria_scores = score_response.scores
    log_message(
        f"Model outputs received penalties={len(penalties)} scores={len(criteria_scores)}",
        additional_route="metrics",
    )
    average_score = sum(criteria_scores.values()) / max(len(criteria_scores), 1)
    penalty_total = sum(penalties.values())
    final_score = round(average_score - penalty_total, 2)
    log_message(
        f"Computed final_score={final_score} penalty_total={penalty_total}",
        additional_route="metrics",
    )
    total_score = update_total_score(
        latest_score=final_score,
        latest_prompt=user_prompt,
        latest_prompt_timestamp=normalized_timestamp,
    )

    result = PromptMetricsResult(
        prompt=user_prompt,
        source=source,
        prompt_timestamp=normalized_timestamp,
        recorded_at=datetime.utcnow().isoformat(),
        penalties=penalties,
        criteria_scores=criteria_scores,
        final_score=final_score,
        total_score=total_score,
    )
    append_metrics_row(result)
    log_message(
        f"Computed metrics final_score={final_score} total_score={total_score}",
        additional_route="metrics",
    )
    return result


def append_metrics_row(result: PromptMetricsResult) -> None:
    log_message("Appending metrics row", additional_route="metrics")
    row = _flatten_metrics_result(result)
    _append_dynamic_csv_row(METRICS_CSV_FILE, row, _base_metrics_headers())


def update_total_score(
    latest_score: float,
    latest_prompt: str,
    latest_prompt_timestamp: str,
) -> float:
    ensure_metrics_storage()
    new_total = round(get_total_score() + latest_score, 2)
    log_message(f"Updating total score to {new_total}", additional_route="metrics")
    row = {
        "updated_at": datetime.utcnow().isoformat(),
        "total_score": str(new_total),
        "latest_prompt": latest_prompt,
        "latest_prompt_timestamp": latest_prompt_timestamp,
    }
    _overwrite_single_row_csv(TOTAL_SCORE_CSV_FILE, row, _total_score_headers())
    return new_total


def get_total_score() -> float:
    ensure_metrics_storage()
    rows = _read_csv_rows(TOTAL_SCORE_CSV_FILE)
    if not rows:
        return 0.0

    try:
        return float(rows[-1].get("total_score", 0.0) or 0.0)
    except ValueError:
        log_message(
            "Invalid total_score.csv contents detected",
            additional_route="metrics",
        )
        return 0.0


def get_latest_metrics() -> dict[str, Any] | None:
    ensure_metrics_storage()
    rows = _read_csv_rows(METRICS_CSV_FILE)
    if not rows:
        return None
    return _inflate_metrics_row(rows[-1])


def get_frontend_metrics_snapshot() -> dict[str, Any]:
    latest_metrics = get_latest_metrics()
    return {
        "total_score": get_total_score(),
        "latest_prompt_metrics": latest_metrics,
        "latest_prompt_analysis": _build_prompt_analysis(latest_metrics)
        if latest_metrics
        else None,
    }


def get_recent_prompt_analyses(limit: int = 10) -> dict[str, Any]:
    ensure_metrics_storage()
    normalized_limit = max(1, min(limit, MAX_RECENT_PROMPTS))
    rows = _read_csv_rows(METRICS_CSV_FILE)
    recent_rows = rows[-normalized_limit:]
    analyses = []

    for row in reversed(recent_rows):
        metrics = _inflate_metrics_row(row)
        analyses.append(_build_prompt_analysis(metrics))

    return {
        "count": len(analyses),
        "limit": normalized_limit,
        "max_limit": MAX_RECENT_PROMPTS,
        "prompts": analyses,
    }


def summarize_prompt_result(result: PromptMetricsResult) -> dict[str, Any]:
    metrics = result.to_dict()
    analysis = _build_prompt_analysis(metrics)
    return {
        "prompt": result.prompt,
        "final_score": result.final_score,
        "recorded_at": result.recorded_at,
        "tags": analysis["tags"],
        "metrics": {
            "penalties": result.penalties,
            "criteria_scores": result.criteria_scores,
        },
    }


def _build_prompt_analysis(metrics: dict[str, Any]) -> dict[str, Any]:
    penalties = metrics.get("penalties", {})
    criteria_scores = metrics.get("criteria_scores", {})
    tags = compute_prompt_tags(penalties, criteria_scores)
    return {
        "prompt": metrics.get("prompt", ""),
        "source": metrics.get("source", "unknown"),
        "prompt_timestamp": metrics.get("prompt_timestamp", ""),
        "recorded_at": metrics.get("recorded_at", ""),
        "final_score": metrics.get("final_score", 0.0),
        "total_score": metrics.get("total_score", 0.0),
        "tags": tags,
        "penalties": penalties,
        "criteria_scores": criteria_scores,
    }


def compute_prompt_tags(
    penalties: dict[str, int],
    criteria_scores: dict[str, float],
) -> list[str]:
    tags: list[str] = []

    for category, penalty_value in sorted(penalties.items()):
        if penalty_value >= PENALTY_TAG_THRESHOLD:
            tags.append(f"penalty:{category}")

    for category, score_value in sorted(criteria_scores.items()):
        if score_value >= SCORE_TAG_THRESHOLD:
            tags.append(f"strength:{category}")

    return tags


def _inflate_metrics_row(row: dict[str, str]) -> dict[str, Any]:
    penalties = {
        key[len(PENALTY_PREFIX):].replace("__", " "): _safe_int(value)
        for key, value in row.items()
        if key.startswith(PENALTY_PREFIX)
    }
    criteria_scores = {
        key[len(SCORE_PREFIX):].replace("__", " "): _safe_float(value)
        for key, value in row.items()
        if key.startswith(SCORE_PREFIX)
    }
    return {
        "prompt": row.get("prompt", ""),
        "source": row.get("source", "unknown"),
        "prompt_timestamp": row.get("prompt_timestamp", ""),
        "recorded_at": row.get("recorded_at", ""),
        "final_score": _safe_float(row.get("final_score")),
        "total_score": _safe_float(row.get("total_score")),
        "penalties": penalties,
        "criteria_scores": criteria_scores,
    }


def _flatten_metrics_result(result: PromptMetricsResult) -> dict[str, str]:
    row = {
        "recorded_at": result.recorded_at,
        "prompt_timestamp": result.prompt_timestamp,
        "source": result.source,
        "prompt": result.prompt,
        "final_score": str(result.final_score),
        "total_score": str(result.total_score),
    }
    row.update(
        {
            f"{PENALTY_PREFIX}{_slugify_metric_name(name)}": str(value)
            for name, value in sorted(result.penalties.items())
        }
    )
    row.update(
        {
            f"{SCORE_PREFIX}{_slugify_metric_name(name)}": str(value)
            for name, value in sorted(result.criteria_scores.items())
        }
    )
    return row


def _base_metrics_headers() -> list[str]:
    return [
        "recorded_at",
        "prompt_timestamp",
        "source",
        "prompt",
        "final_score",
        "total_score",
    ]


def _total_score_headers() -> list[str]:
    return ["updated_at", "total_score", "latest_prompt", "latest_prompt_timestamp"]


def _slugify_metric_name(name: str) -> str:
    return name.strip().lower().replace(" ", "__")


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def _ensure_csv_headers(
    path: Path,
    headers: list[str],
    initial_rows: list[dict[str, str]] | None = None,
) -> None:
    if path.exists():
        existing_rows = _read_csv_rows(path)
        existing_headers = list(existing_rows[0].keys()) if existing_rows else headers
        merged_headers = _merge_headers(existing_headers, headers)
        if merged_headers != existing_headers:
            _rewrite_csv(path, merged_headers, existing_rows)
        return

    _rewrite_csv(path, headers, initial_rows or [])


def _append_dynamic_csv_row(
    path: Path,
    row: dict[str, str],
    base_headers: list[str],
) -> None:
    ensure_metrics_storage()
    existing_rows = _read_csv_rows(path)
    existing_headers = list(existing_rows[0].keys()) if existing_rows else base_headers
    merged_headers = _merge_headers(existing_headers, list(row.keys()))

    if merged_headers != existing_headers:
        _rewrite_csv(path, merged_headers, existing_rows)

    with path.open("a", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=merged_headers)
        writer.writerow({header: row.get(header, "") for header in merged_headers})


def _overwrite_single_row_csv(
    path: Path,
    row: dict[str, str],
    headers: list[str],
) -> None:
    merged_headers = _merge_headers(headers, list(row.keys()))
    _rewrite_csv(path, merged_headers, [row])


def _rewrite_csv(
    path: Path,
    headers: list[str],
    rows: list[dict[str, str]],
) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({header: row.get(header, "") for header in headers})


def _merge_headers(existing_headers: list[str], candidate_headers: list[str]) -> list[str]:
    merged = list(existing_headers)
    for header in candidate_headers:
        if header not in merged:
            merged.append(header)
    return merged


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _safe_int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0
