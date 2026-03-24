/**
 * Example: Fullstack — TypeScript + Python with auto-generated types
 *
 * Run:   npx tsx examples/fullstack/server.ts
 * Shows: full type safety from Python type hints to TypeScript,
 *        auto-generated .d.ts, IDE autocomplete
 *
 * Requires: npm install tsx
 */

import python from 'node-api-python'

// These types are auto-generated from Python type hints:
// npx node-api-python generate-types ./examples/fullstack/analytics.py -o ./examples/fullstack/types/
import type { UserEvent, AnalyticsReport } from './types/analytics'

const analytics = python.import('./examples/fullstack/analytics')

async function main() {
  // Full type safety — IDE knows the argument and return types
  const events: UserEvent[] = [
    { user_id: 'u1', action: 'click', page: '/home', timestamp: Date.now() },
    { user_id: 'u1', action: 'scroll', page: '/home', timestamp: Date.now() + 1000 },
    { user_id: 'u2', action: 'click', page: '/about', timestamp: Date.now() + 2000 },
    { user_id: 'u1', action: 'click', page: '/pricing', timestamp: Date.now() + 3000 },
  ]

  // TypeScript knows this returns AnalyticsReport
  const report: AnalyticsReport = await analytics.generate_report(events)

  console.log('Analytics Report:')
  console.log(`  Unique users: ${report.unique_users}`)
  console.log(`  Total events: ${report.total_events}`)
  console.log(`  Top page: ${report.top_page}`)
  console.log(`  Events by action:`, report.by_action)
}

main().catch(console.error)
