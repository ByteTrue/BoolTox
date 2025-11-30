import asyncio
import json
import sys


def write_message(payload: dict):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def emit(event: str, data=None):
    write_message({"jsonrpc": "2.0", "method": "$event", "params": {"event": event, "data": data}})


def send_ready(methods):
    write_message({"jsonrpc": "2.0", "method": "$ready", "params": {"methods": methods}})

async def handle_request(request: dict):
    if request.get("method") == "hello":
        name = request.get("params", {}).get("name", "world")
        emit("progress", {"step": "processing"})
        await asyncio.sleep(0.1)
        return {"id": request.get("id"), "result": {"message": f"Hello, {name}!"}}
    return {"id": request.get("id"), "error": {"code": -32601, "message": "Method not found"}}

async def main():
    send_ready(["hello"])
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        response = await handle_request(payload)
        if response:
            if "result" in response:
                write_message({"jsonrpc": "2.0", "id": response.get("id"), "result": response.get("result")})
            else:
                write_message({"jsonrpc": "2.0", "id": response.get("id"), "error": response.get("error")})

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
