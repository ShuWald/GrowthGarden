# Backend

Server and API code for GrowthGarden.

## Setup
(First time only!)

\- Python required
\- pip required (`pip install`)
\- Navigage to backend folder
\- Create virtual environment `python -m venv venv`
\- Bypass Error `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
\- Activate your virtual environment `venv/Scripts/activate`
\- Install packages from `requirements.txt` using `pip install -r requirements.txt`

## Quickstart
To run the server
`uvicorn app.main:app --reload -port: 8000`
