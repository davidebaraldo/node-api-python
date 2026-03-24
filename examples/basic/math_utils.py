"""Example Python module to be called from Node.js."""


def add(x: int, y: int) -> int:
    """Add two numbers."""
    return x + y


def multiply(x: float, y: float) -> float:
    """Multiply two numbers."""
    return x * y


def greet(name: str) -> str:
    """Return a greeting."""
    return f"Hello, {name}!"
