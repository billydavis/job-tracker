/**
 * Append sample jobs with dateApplied in the current UTC week (and a few in the prior week)
 * so dashboard weekly stats are non-zero. Does not remove existing documents.
 *
 * Uses the same Sunday-based UTC week as GET /api/jobs/stats.
 *
 *   cd backend && bun run seed:week
 *
 * Target the test DB:
 *   MONGO_DB=job-tracker-test bun run seed:week
 *
 * Pick a user when several exist:
 *   SEED_USER_EMAIL=you@example.com bun run seed:week
 */

import { connect } from './db'
import { ObjectId } from 'mongodb'

const STATUSES = ['waiting', 'applied', 'interview', 'offer', 'negotiation', 'rejected', 'ghosted'] as const
const LOCATIONS = ['remote', 'on-site', 'hybrid', undefined] as const

const EXTRA_TITLES = [
  'Platform Engineer (fresh)',
  'Staff SRE',
  'Senior TypeScript Engineer',
  'Backend Lead',
  'Product Software Engineer',
  'Infrastructure Engineer II',
  'Full Stack — recent',
  'API Platform Developer',
  'Engineering Manager, Platform',
  'Senior React Engineer',
  'Cloud Security Engineer',
  'Developer Experience Engineer',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Match backend/routes/jobs.ts week boundaries (UTC, week starts Sunday). */
function getUtcWeekRange(weekOffset = 0): { start: Date; end: Date; startStr: string; endStr: string } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - dayOfWeek + weekOffset * 7)
  weekStart.setUTCHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  weekEnd.setUTCHours(23, 59, 59, 999)
  return {
    start: weekStart,
    end: weekEnd,
    startStr: weekStart.toISOString().slice(0, 10),
    endStr: weekEnd.toISOString().slice(0, 10),
  }
}

function randomYmdInWeek(weekStart: Date): string {
  const dayOffset = Math.floor(Math.random() * 7)
  const d = new Date(weekStart)
  d.setUTCDate(weekStart.getUTCDate() + dayOffset)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const db = await connect()
  const usersCol = db.collection('users')
  const jobsCol = db.collection('jobs')
  const companiesCol = db.collection('companies')

  const email = process.env.SEED_USER_EMAIL?.trim()
  const user = email ? await usersCol.findOne({ email }) : await usersCol.findOne({})
  if (!user) {
    console.error(email ? `No user with email "${email}".` : 'No users found. Register an account first.')
    process.exit(1)
  }

  let companyId = (await companiesCol.findOne({ userId: user._id }))?._id as ObjectId | undefined
  if (!companyId) {
    const res = await companiesCol.insertOne({
      userId: user._id,
      name: 'Seed Week Co',
      createdAt: new Date().toISOString(),
    })
    companyId = res.insertedId
  }

  const thisWeek = getUtcWeekRange(0)
  const prevWeek = getUtcWeekRange(-1)
  const now = new Date().toISOString()

  const currentWeekJobs = 10
  const prevWeekJobs = 4

  const jobs = [
    ...Array.from({ length: currentWeekJobs }, (_, i) => ({
      userId: user._id,
      companyId,
      title: EXTRA_TITLES[i % EXTRA_TITLES.length],
      status: pick(STATUSES),
      location: pick(LOCATIONS),
      dateApplied: randomYmdInWeek(thisWeek.start),
      createdAt: now,
      _seedRecentWeek: true,
    })),
    ...Array.from({ length: prevWeekJobs }, (_, i) => ({
      userId: user._id,
      companyId,
      title: `Prior week — ${EXTRA_TITLES[i % EXTRA_TITLES.length]}`,
      status: pick(STATUSES),
      location: pick(LOCATIONS),
      dateApplied: randomYmdInWeek(prevWeek.start),
      createdAt: now,
      _seedRecentWeek: true,
    })),
  ]

  const result = await jobsCol.insertMany(jobs as any)
  console.log(
    `Inserted ${result.insertedCount} jobs for "${user.email}" ` +
      `(${currentWeekJobs} with dateApplied in ${thisWeek.startStr}…${thisWeek.endStr}, ` +
      `${prevWeekJobs} in ${prevWeek.startStr}…${prevWeek.endStr}).`,
  )
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
