from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from .flexlog import ensure_log_directory, log_message
from .metrics import (
    ensure_metrics_storage,
    get_frontend_metrics_snapshot,
    get_recent_prompt_analyses,
    summarize_prompt_result,
)
from .process import PromptProcessor

load_dotenv()
app = FastAPI()
processor = PromptProcessor()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    ensure_log_directory()
    ensure_metrics_storage()
    log_message("Growth Garden backend started", print_log=True)


@app.post("/api/prompts")
async def process_prompt(request: Request):
    data = await request.json()
    log_message("Received prompt payload", print_log=True, additional_route="prompts")

    try:
        result = processor.process(data)
    except ValueError as exc:
        log_message(f"Invalid prompt payload: {exc}", additional_route="prompts")
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    log_message("Finished processing prompt", print_log=True, additional_route="prompts")
    return summarize_prompt_result(result)


@app.get("/api/frontend")
def frontend_metrics():
    log_message("Serving frontend metrics snapshot", additional_route="metrics")
    return get_frontend_metrics_snapshot()


@app.get("/api/prompts/recent")
def recent_prompt_metrics(n: int = Query(default=10, ge=1, lt=25)):
    log_message(f"Serving recent prompt history for n={n}", additional_route="metrics")
    return get_recent_prompt_analyses(limit=n)
