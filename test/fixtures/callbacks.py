"""Test fixture for callback and event patterns."""


def call_callback(cb):
    cb(42)
    return "done"


def call_callback_multiple(cb, n):
    for i in range(n):
        cb(i)
    return n


def with_progress(data, on_progress):
    total = len(data)
    for i, item in enumerate(data):
        on_progress(int((i + 1) / total * 100))
    return {"processed": total}


class EventSource:
    def __init__(self):
        self._listeners = {}

    def on(self, event, callback):
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)

    def emit(self, event, *args):
        for cb in self._listeners.get(event, []):
            cb(*args)

    def run(self, count):
        for i in range(count):
            self.emit("data", i)
        self.emit("done", count)


def create_event_source():
    return EventSource()


def generate_items(n):
    for i in range(n):
        yield {"index": i, "value": i * 2}


def callback_with_error(cb):
    """Call callback and let any error propagate."""
    cb("trigger")
    return "should not reach"


def transform_with_callback(items, transform_fn):
    """Apply a JS callback as a transform to each item."""
    return [transform_fn(item) for item in items]
