#!/usr/bin/env python3
"""
Simple streaming backend used by the BoolTox Backend Bridge Demo.

Protocol:
  - Receive newline delimited JSON objects from stdin
  - Print JSON objects to stdout (each line one message)
"""

from __future__ import annotations

import json
import sys
import time
from typing import Any, Dict
import os


def send(event: Dict[str, Any]) -> None:
  sys.stdout.write(json.dumps(event, ensure_ascii=False) + "\n")
  sys.stdout.flush()


def handle_message(payload: Dict[str, Any]) -> None:
  command = payload.get("command")

  if command == "ping":
    send({"event": "pong", "echo": payload.get("message", "hello")})
  elif command == "stats":
    send(
      {
        "event": "stats",
        "python": sys.version.split()[0],
        "time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pid": os.getpid(),
      }
    )
  elif command == "sum":
    numbers = payload.get("numbers") or []
    total = 0
    try:
      total = sum(float(value) for value in numbers)
    except Exception as exc:
      send({"event": "error", "message": f"Failed to sum numbers: {exc}"})
      return
    send({"event": "sum", "result": total, "count": len(numbers)})
  else:
    send({"event": "unknown-command", "payload": payload})


def main() -> None:
  send({"event": "backend-ready", "message": "Python backend initialized"})

  for line in sys.stdin:
    line = line.strip()
    if not line:
      continue
    try:
      payload = json.loads(line)
    except json.JSONDecodeError as exc:
      send({"event": "error", "message": f"Invalid JSON: {exc.msg}"})
      continue

    try:
      handle_message(payload)
    except Exception as exc:
      send({"event": "error", "message": f"Backend error: {exc}"})


if __name__ == "__main__":

  try:
    main()
  except KeyboardInterrupt:
    send({"event": "exit", "message": "Interrupted"})
