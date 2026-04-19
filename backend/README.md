# Backend

Server and API code for GrowthGarden.
`.env` contains VERY IMPORTANT api keys, it should NEVER be pushed or shared
`main.py` is reserved for routing logic, please do not modify


## Setup
(First time only!)

\- Python required
\- pip required (`pip install`)
    \- (If applicable, on Windows) Bypass Error `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
\- Navigage to `backend/` folder
\- Create virtual environment `python -m venv venv`
\- Activate your virtual environment `venv/Scripts/activate`
\- Install packages from `requirements.txt` using `pip install -r requirements.txt`


## Quickstart
Run the server from the `backend/` directory:
```bash
uvicorn app.main:app --reload --port 8000
```
This will allow for communication between the frontend and backend


## Route
The route on which the backend is listening

- `GET /api/endpoint` -> returns a default JSON message for now

