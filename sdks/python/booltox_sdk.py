"""
BoolTox Backend SDK for Python

This SDK provides a simple way to create JSON-RPC 2.0 based backend services
for BoolTox plugins.

Usage:
    from booltox_sdk import BooltoxBackend

    backend = BooltoxBackend()

    @backend.method("hello")
    async def hello(params):
        name = params.get("name", "World")
        return {"message": f"Hello, {name}!"}

    @backend.method("calculate")
    async def calculate(params):
        # Emit progress events
        backend.emit("progress", {"step": 1, "total": 3})
        result = params.get("a", 0) + params.get("b", 0)
        backend.emit("progress", {"step": 3, "total": 3})
        return {"result": result}

    backend.run()
"""

import sys
import json
import asyncio
import traceback
from typing import Any, Callable, Dict, Optional, List, Union, Awaitable
from functools import wraps
import os

__version__ = "1.0.0"

# JSON-RPC 2.0 Error Codes
class JsonRpcErrorCodes:
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    SERVER_ERROR = -32000
    TIMEOUT_ERROR = -32001
    BACKEND_NOT_READY = -32002
    BACKEND_CRASHED = -32003


class JsonRpcError(Exception):
    """JSON-RPC Error"""
    def __init__(self, code: int, message: str, data: Any = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.data = data

    def to_dict(self) -> Dict[str, Any]:
        error = {"code": self.code, "message": self.message}
        if self.data is not None:
            error["data"] = self.data
        return error


class BooltoxBackend:
    """
    BoolTox Backend SDK main class.

    Provides JSON-RPC 2.0 communication over STDIO with the BoolTox host.
    """

    def __init__(self):
        self._methods: Dict[str, Callable[..., Awaitable[Any]]] = {}
        self._running = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._plugin_id = os.environ.get("BOOLTOX_PLUGIN_ID", "unknown")

        # Register built-in methods
        self._register_builtin_methods()

    def _register_builtin_methods(self):
        """Register built-in RPC methods"""
        @self.method("$ping")
        async def ping(params):
            return {"pong": True}

    def method(self, name: str):
        """
        Decorator to register an RPC method.

        Args:
            name: The method name that will be called via JSON-RPC

        Example:
            @backend.method("greet")
            async def greet(params):
                return {"message": f"Hello, {params.get('name')}!"}
        """
        def decorator(func: Callable[..., Any]):
            # Wrap sync functions to be async
            if not asyncio.iscoroutinefunction(func):
                @wraps(func)
                async def async_wrapper(params):
                    return func(params)
                self._methods[name] = async_wrapper
            else:
                self._methods[name] = func
            return func
        return decorator

    def emit(self, event: str, data: Any = None):
        """
        Emit an event notification to the frontend.

        Args:
            event: Event name
            data: Event data (optional)

        Example:
            backend.emit("progress", {"step": 1, "total": 10})
        """
        notification = {
            "jsonrpc": "2.0",
            "method": "$event",
            "params": {"event": event, "data": data}
        }
        self._write_message(notification)

    def log(self, level: str, message: str):
        """
        Send a log message to the host.

        Args:
            level: Log level ("debug", "info", "warn", "error")
            message: Log message
        """
        notification = {
            "jsonrpc": "2.0",
            "method": "$log",
            "params": {"level": level, "message": message}
        }
        self._write_message(notification)

    def debug(self, message: str):
        """Log a debug message"""
        self.log("debug", message)

    def info(self, message: str):
        """Log an info message"""
        self.log("info", message)

    def warn(self, message: str):
        """Log a warning message"""
        self.log("warn", message)

    def error(self, message: str):
        """Log an error message"""
        self.log("error", message)

    def _write_message(self, message: Dict[str, Any]):
        """Write a JSON message to stdout"""
        try:
            line = json.dumps(message, ensure_ascii=False) + "\n"
            sys.stdout.write(line)
            sys.stdout.flush()
        except Exception as e:
            # Write to stderr if stdout fails
            sys.stderr.write(f"Failed to write message: {e}\n")
            sys.stderr.flush()

    def _send_ready(self):
        """Send ready notification to host"""
        methods = [name for name in self._methods.keys() if not name.startswith("$")]
        notification = {
            "jsonrpc": "2.0",
            "method": "$ready",
            "params": {
                "version": __version__,
                "methods": methods
            }
        }
        self._write_message(notification)

    def _create_response(self, id: Union[str, int], result: Any) -> Dict[str, Any]:
        """Create a success response"""
        return {
            "jsonrpc": "2.0",
            "id": id,
            "result": result
        }

    def _create_error_response(
        self,
        id: Union[str, int, None],
        code: int,
        message: str,
        data: Any = None
    ) -> Dict[str, Any]:
        """Create an error response"""
        error = {"code": code, "message": message}
        if data is not None:
            error["data"] = data
        return {
            "jsonrpc": "2.0",
            "id": id,
            "error": error
        }

    async def _handle_request(self, request: Dict[str, Any]):
        """Handle a JSON-RPC request"""
        # Validate request
        if not isinstance(request, dict):
            return self._create_error_response(
                None,
                JsonRpcErrorCodes.INVALID_REQUEST,
                "Invalid request: not an object"
            )

        if request.get("jsonrpc") != "2.0":
            return self._create_error_response(
                request.get("id"),
                JsonRpcErrorCodes.INVALID_REQUEST,
                "Invalid request: missing or invalid jsonrpc version"
            )

        method = request.get("method")
        if not isinstance(method, str):
            return self._create_error_response(
                request.get("id"),
                JsonRpcErrorCodes.INVALID_REQUEST,
                "Invalid request: method must be a string"
            )

        request_id = request.get("id")
        params = request.get("params", {})

        # Check if this is a notification (no id)
        is_notification = "id" not in request

        # Find and call the method
        handler = self._methods.get(method)
        if handler is None:
            if is_notification:
                return None  # Don't respond to notifications
            return self._create_error_response(
                request_id,
                JsonRpcErrorCodes.METHOD_NOT_FOUND,
                f"Method not found: {method}"
            )

        try:
            result = await handler(params)
            if is_notification:
                return None  # Don't respond to notifications
            return self._create_response(request_id, result)
        except JsonRpcError as e:
            if is_notification:
                return None
            return self._create_error_response(request_id, e.code, e.message, e.data)
        except Exception as e:
            self.error(f"Error in method {method}: {traceback.format_exc()}")
            if is_notification:
                return None
            return self._create_error_response(
                request_id,
                JsonRpcErrorCodes.INTERNAL_ERROR,
                str(e),
                {"traceback": traceback.format_exc()}
            )

    async def _process_line(self, line: str):
        """Process a single line of input"""
        line = line.strip()
        if not line:
            return

        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            response = self._create_error_response(
                None,
                JsonRpcErrorCodes.PARSE_ERROR,
                f"Parse error: {e}"
            )
            self._write_message(response)
            return

        response = await self._handle_request(request)
        if response is not None:
            self._write_message(response)

    async def _read_stdin(self):
        """Read lines from stdin asynchronously"""
        loop = asyncio.get_event_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)

        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        while self._running:
            try:
                line = await reader.readline()
                if not line:
                    # EOF - stdin closed
                    self._running = False
                    break
                await self._process_line(line.decode("utf-8"))
            except Exception as e:
                self.error(f"Error reading stdin: {e}")
                break

    async def _run_async(self):
        """Main async run loop"""
        self._running = True
        self._send_ready()

        try:
            await self._read_stdin()
        except asyncio.CancelledError:
            pass
        finally:
            self._running = False

    def run(self):
        """
        Start the backend event loop.

        This method blocks until the backend is stopped (stdin closes or error).

        Example:
            backend = BooltoxBackend()

            @backend.method("hello")
            async def hello(params):
                return {"message": "Hello!"}

            backend.run()
        """
        try:
            asyncio.run(self._run_async())
        except KeyboardInterrupt:
            pass
        except Exception as e:
            sys.stderr.write(f"Backend error: {e}\n")
            sys.stderr.flush()
            sys.exit(1)

    def stop(self):
        """Stop the backend event loop"""
        self._running = False


# Convenience function for simple scripts
def create_backend() -> BooltoxBackend:
    """Create a new BooltoxBackend instance"""
    return BooltoxBackend()


# Export commonly used items
__all__ = [
    "BooltoxBackend",
    "JsonRpcError",
    "JsonRpcErrorCodes",
    "create_backend",
    "__version__",
]
