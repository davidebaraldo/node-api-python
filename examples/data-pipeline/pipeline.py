"""Data pipeline module — pandas/numpy processing called from Node.js.

Works with or without pandas/numpy installed.
Falls back to pure Python if they're not available.
"""

from __future__ import annotations

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def summarize_sales(data: list[dict]) -> dict:
    """Summarize sales data by product.

    Args:
        data: List of dicts with keys: date, product, quantity, price

    Returns:
        Dict with total_revenue, by_product breakdown, top_product
    """
    if HAS_PANDAS:
        df = pd.DataFrame(data)
        df["revenue"] = df["quantity"] * df["price"]
        by_product = df.groupby("product").agg(
            total_quantity=("quantity", "sum"),
            total_revenue=("revenue", "sum"),
            avg_price=("price", "mean"),
        ).round(2)

        result = by_product.to_dict(orient="index")
        total = float(df["revenue"].sum())
        top = df.groupby("product")["revenue"].sum().idxmax()
    else:
        # Pure Python fallback
        products: dict[str, dict] = {}
        for row in data:
            name = row["product"]
            revenue = row["quantity"] * row["price"]
            if name not in products:
                products[name] = {"total_quantity": 0, "total_revenue": 0.0, "prices": []}
            products[name]["total_quantity"] += row["quantity"]
            products[name]["total_revenue"] += revenue
            products[name]["prices"].append(row["price"])

        result = {}
        for name, info in products.items():
            result[name] = {
                "total_quantity": info["total_quantity"],
                "total_revenue": round(info["total_revenue"], 2),
                "avg_price": round(sum(info["prices"]) / len(info["prices"]), 2),
            }

        total = sum(p["total_revenue"] for p in result.values())
        top = max(result, key=lambda k: result[k]["total_revenue"])

    return {
        "total_revenue": round(total, 2),
        "by_product": result,
        "top_product": top,
    }


def compute_statistics(values: list[float]) -> dict[str, float]:
    """Compute descriptive statistics for a list of numbers."""
    if HAS_NUMPY:
        arr = np.array(values, dtype=float)
        return {
            "mean": round(float(arr.mean()), 2),
            "median": round(float(np.median(arr)), 2),
            "std": round(float(arr.std()), 2),
            "min": float(arr.min()),
            "max": float(arr.max()),
            "count": len(values),
        }

    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mean = sum(values) / n
    median = sorted_vals[n // 2] if n % 2 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2
    variance = sum((x - mean) ** 2 for x in values) / n

    return {
        "mean": round(mean, 2),
        "median": round(float(median), 2),
        "std": round(variance ** 0.5, 2),
        "min": float(min(values)),
        "max": float(max(values)),
        "count": n,
    }


def process_array(data: list[float]) -> dict[str, float]:
    """Process a large numeric array (demonstrates zero-copy potential)."""
    if HAS_NUMPY:
        arr = np.array(data)
        return {
            "sum": round(float(arr.sum()), 2),
            "mean": round(float(arr.mean()), 2),
            "std": round(float(arr.std()), 2),
            "above_50": int((arr > 50).sum()),
            "below_50": int((arr <= 50).sum()),
            "count": len(data),
        }

    above = sum(1 for x in data if x > 50)
    total = sum(data)
    mean = total / len(data)
    variance = sum((x - mean) ** 2 for x in data) / len(data)

    return {
        "sum": round(total, 2),
        "mean": round(mean, 2),
        "std": round(variance ** 0.5, 2),
        "above_50": above,
        "below_50": len(data) - above,
        "count": len(data),
    }
