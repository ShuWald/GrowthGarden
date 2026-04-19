# Logging

from __future__ import annotations
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "Log"
MAIN_LOG_FILE = LOG_DIR / "main.log"
INFO_LOG_FILE = LOG_DIR / "info.log"


# Create Log directory and main log files
def ensure_log_directory() -> None:
	LOG_DIR.mkdir(parents=True, exist_ok=True)
	# Reset all existing log files at startup so each run starts clean.
	for existing_log in LOG_DIR.glob("*.log"):
		existing_log.write_text("", encoding="utf-8")
	# Ensure base log files exist even on first run.
	MAIN_LOG_FILE.touch(exist_ok=True)
	INFO_LOG_FILE.touch(exist_ok=True)


# Writes a log to main, optionally printing and/or logging to additional route
def log_message(message: str, print_log: bool = False, additional_route: str | None = None) -> None:
	
	# Log entry with timestamp
	timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	entry = f"[{timestamp}] {message}\n"
	
	try:
		# Write to main log file (append mode)
		with MAIN_LOG_FILE.open("a", encoding="utf-8") as log_file:
			log_file.write(entry)
		
		if additional_route:
			route_file = LOG_DIR / f"{additional_route}.log"
			try:
				# Write to additional route log (append mode)
				with route_file.open("a", encoding="utf-8") as log_file:
					log_file.write(entry)
			except (FileNotFoundError, IsADirectoryError, PermissionError) as e:
				# If route file write fails, try cleaning the route name (strip/replace invalid chars). Log as well
				log_message(f"ERROR writing to route '{additional_route}', attempting cleaning: {type(e).__name__}: {e}", print_log=True)
				cleaned_name = additional_route.strip().replace("\\", "/").replace("/", "_").replace(" ", "_") or "additional"
				route_file = LOG_DIR / f"{cleaned_name}.log"
				try:
					route_file.parent.mkdir(parents=True, exist_ok=True)
					with route_file.open("a", encoding="utf-8") as log_file:
						log_file.write(entry)
				except Exception as err:
					# Log the error to main log with full traceback
					error_msg = f"ERROR writing to route '{additional_route}' (cleaned: '{cleaned_name}'): {type(err).__name__}: {err}"
					error_entry = f"[{timestamp}] {error_msg}\n"
					with MAIN_LOG_FILE.open("a", encoding="utf-8") as log_file:
						log_file.write(error_entry)
		
		if print_log:
			print(entry, end="")
	
	except Exception as e:
		# Main log write failed, could try resetting main log path, but just print to console
		timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
		print(f"[{timestamp}] CRITICAL LOGGING FAILURE: {type(e).__name__}: {e}")
