// Enforce isolated database usage for all test files.
process.env.MONGO_DB = process.env.MONGO_DB || 'job-tracker-test'

if (process.env.MONGO_DB === 'job-tracker') {
  throw new Error('Refusing to run tests against primary database (job-tracker)')
}
