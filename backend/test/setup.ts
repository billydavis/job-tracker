// Tests always use an isolated DB so .env cannot point Vitest at your dev data.
// Set TEST_USE_CUSTOM_MONGO_DB=1 only if you intentionally use another non-production name.
const allowCustom = process.env.TEST_USE_CUSTOM_MONGO_DB === '1'
if (!allowCustom) {
  process.env.MONGO_DB = 'job-tracker-test'
} else {
  process.env.MONGO_DB = process.env.MONGO_DB || 'job-tracker-test'
  if (process.env.MONGO_DB === 'job-tracker') {
    throw new Error('Refusing to run tests against primary database (job-tracker)')
  }
}
