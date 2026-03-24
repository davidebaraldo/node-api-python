# Example: Fullstack TypeScript

Full type safety from Python to TypeScript with auto-generated `.d.ts`.

## Run

```bash
npm install tsx
npx tsx examples/fullstack/server.ts
```

## Generate types

```bash
npx node-api-python generate-types ./examples/fullstack/analytics.py -o ./examples/fullstack/types/
```

## What this shows

- Python `TypedDict` and `@dataclass` become TypeScript `interface`
- Python type hints map to TypeScript types automatically
- IDE autocomplete works across the JS/Python boundary
- Docstrings become JSDoc comments in the generated `.d.ts`

## Type mapping example

```python
# Python
class UserEvent(TypedDict):
    user_id: str
    action: str
    page: str
    timestamp: float

def generate_report(events: list[UserEvent]) -> AnalyticsReport: ...
```

```typescript
// Generated TypeScript
interface UserEvent {
  user_id: string
  action: string
  page: string
  timestamp: number
}

function generate_report(events: UserEvent[]): Promise<AnalyticsReport>
```
