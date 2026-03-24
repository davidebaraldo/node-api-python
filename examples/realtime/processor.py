"""Realtime processor — demonstrates callbacks, events, and streaming.

Shows how Python can call back into JavaScript for:
  - Progress reporting during long tasks
  - Event emission (like a system monitor)
  - Streaming/yielding results incrementally
"""

from __future__ import annotations
import time
import random
from typing import Callable, Generator


def long_task(total_items: int, on_progress: Callable[[int, str], None]) -> dict[str, int]:
    """Process items and report progress via callback.

    Args:
        total_items: Number of items to process
        on_progress: Callback(percentage, message) called during processing
    """
    processed = 0
    for i in range(total_items):
        # Simulate work
        time.sleep(0.01)
        processed += 1
        pct = int((processed / total_items) * 100)
        on_progress(pct, f"Processing item {processed}/{total_items}")

    return {"processed": processed, "status": "done"}


class Monitor:
    """System monitor that emits events to JavaScript."""

    def __init__(self):
        self._listeners: dict[str, list[Callable]] = {}

    def on(self, event: str, callback: Callable) -> None:
        """Register an event listener."""
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)

    def _emit(self, event: str, *args) -> None:
        """Emit an event to all registered listeners."""
        for cb in self._listeners.get(event, []):
            cb(*args)

    def start(self, num_samples: int = 10) -> None:
        """Start monitoring and emit events."""
        for _ in range(num_samples):
            cpu = round(random.uniform(10, 95), 1)
            memory = round(random.uniform(30, 85), 1)

            self._emit("cpu", cpu)
            self._emit("memory", memory)

            if cpu > 80:
                self._emit("alert", f"High CPU usage: {cpu}%")
            if memory > 75:
                self._emit("alert", f"High memory usage: {memory}%")

            time.sleep(0.1)


def create_monitor() -> Monitor:
    """Create a new system monitor instance."""
    return Monitor()


def stream_results(count: int) -> Generator[dict[str, float], None, None]:
    """Yield results one at a time (becomes an async iterator in JS).

    Args:
        count: Number of results to generate
    """
    for i in range(count):
        time.sleep(0.05)
        yield {
            "id": i,
            "value": round(random.random() * 100, 2),
            "timestamp": time.time(),
        }
