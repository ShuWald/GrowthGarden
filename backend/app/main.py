from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .flexlog import log_message, ensure_log_directory

load_dotenv()
app = FastAPI()

# Enable CORS for the extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize logging on startup
@app.on_event("startup")
def startup():
    ensure_log_directory()
    log_message("Growth Garden backend started", print_log=True)

# Accept any JSON data from the extension, validate later
@app.post("/api/prompts")
async def process_prompt(request: Request):
    # Accept raw JSON without schema validation
    data = await request.json()
    log_message(f"Received prompt: {data}", print_log=True, additional_route="prompts")
    
    # TODO:
    # - Extract/validate fields as needed (prompt, source, timestamp, etc.)
    # - Function to trigger the AI model to process prompt 
    # - Backend stores/processes prompt with its own logic
    # - Optional, return a score indicator
    
    log_message("Finished processing prompt (placeholder)", print_log=True, additional_route="prompts")

    return {
        "received": data,
        "response": "Model processing placeholder - add your AI logic here",
    }


@app.get("/api/test")
def get_endpoint():
    log_message("Received GET request at /api/test", print_log=True, additional_route="test")
    return {"message": "Default response"}
