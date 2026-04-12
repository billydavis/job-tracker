/**
 * Seed script: inserts 40 sample jobs for the first user in the database.
 * Run with: bun run seed.ts
 *
 * Safe to run multiple times — it checks for an existing seed marker
 * and skips if seed data is already present.
 */

import { connect } from './db'
import { ObjectId } from 'mongodb'

const STATUSES = ['waiting', 'applied', 'interview', 'offer', 'negotiation', 'rejected', 'ghosted'] as const
const LOCATIONS = ['remote', 'on-site', 'hybrid', undefined] as const

const JOB_TITLES = [
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'Staff Engineer',
  'Principal Engineer',
  'DevOps Engineer',
  'Platform Engineer',
  'Software Architect',
  'Engineering Manager',
  'React Developer',
  'Node.js Engineer',
  'TypeScript Developer',
  'Cloud Engineer',
  'Site Reliability Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'Mobile Developer',
  'iOS Engineer',
  'Android Developer',
  'API Developer',
  'Systems Engineer',
  'Solutions Architect',
  'Technical Lead',
  'Product Engineer',
  'Infrastructure Engineer',
  'Security Engineer',
  'Embedded Systems Engineer',
  'Game Developer',
  'Graphics Engineer',
  'Compiler Engineer',
  'Distributed Systems Engineer',
  'Database Engineer',
  'Search Engineer',
  'Payments Engineer',
  'Growth Engineer',
  'Developer Advocate',
  'Software Engineer II',
  'Software Engineer III',
  'Senior Frontend Engineer',
]

const COMPANIES = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Umbrella Inc',
  'Hooli',
  'Pied Piper',
  'Dunder Mifflin Tech',
  'Veridian Dynamics',
  'Massive Dynamic',
  'Soylent Corp',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString().split('T')[0]
}

async function main() {
  const db = await connect()
  const usersCol = db.collection('users')
  const jobsCol = db.collection('jobs')
  const companiesCol = db.collection('companies')

  const user = await usersCol.findOne({})
  if (!user) {
    console.error('No users found. Register an account first, then run the seed.')
    process.exit(1)
  }

  const existing = await jobsCol.countDocuments({ userId: user._id, _seedData: true })
  if (existing > 0) {
    console.log(`Seed data already present (${existing} records). Delete them first if you want to re-seed.`)
    process.exit(0)
  }

  // Upsert companies for this user
  const companyIds: Record<string, ObjectId> = {}
  for (const name of COMPANIES) {
    const existing = await companiesCol.findOne({ userId: user._id, name })
    if (existing) {
      companyIds[name] = existing._id as ObjectId
    } else {
      const res = await companiesCol.insertOne({ userId: user._id, name, createdAt: new Date().toISOString() })
      companyIds[name] = res.insertedId
    }
  }

  const now = new Date().toISOString()
  const jobs = JOB_TITLES.slice(0, 40).map(title => ({
    userId: user._id,
    companyId: companyIds[pick(COMPANIES)],
    title,
    status: pick(STATUSES),
    location: pick(LOCATIONS),
    salaryRange:
      Math.random() > 0.4
        ? (() => {
            const low = Math.round(80 + Math.random() * 50) * 1000
            const high = low + Math.round(10 + Math.random() * 50) * 1000
            return { lowEnd: low, highEnd: high, period: 'yearly' as const }
          })()
        : undefined,
    dateApplied: Math.random() > 0.2 ? randomDate(120) : undefined,
    createdAt: now,
    _seedData: true,
  }))

  const result = await jobsCol.insertMany(jobs as any)
  console.log(`Inserted ${result.insertedCount} seed jobs for user "${user.email}".`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
