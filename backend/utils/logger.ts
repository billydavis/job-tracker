type Level = 'debug' | 'info' | 'warn' | 'error'
type Fields = Record<string, unknown>

const IS_PROD = process.env.NODE_ENV === 'production'

const COLORS: Record<Level, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
}
const RESET = '\x1b[0m'

function log(level: Level, msg: string, fields?: Fields): void {
  const time = new Date().toISOString()
  if (IS_PROD) {
    const entry = JSON.stringify({ level, time, msg, ...fields })
    if (level === 'error' || level === 'warn') {
      process.stderr.write(entry + '\n')
    } else {
      process.stdout.write(entry + '\n')
    }
  } else {
    const color = COLORS[level]
    const prefix = `${color}[${level.toUpperCase().padEnd(5)}]${RESET}`
    const fieldStr = fields && Object.keys(fields).length > 0
      ? ' ' + JSON.stringify(fields)
      : ''
    // eslint-disable-next-line no-console
    console.log(`${time} ${prefix} ${msg}${fieldStr}`)
  }
}

export const logger = {
  /** Only emitted outside production. */
  debug(msg: string, fields?: Fields): void {
    if (!IS_PROD) log('debug', msg, fields)
  },
  info(msg: string, fields?: Fields): void {
    log('info', msg, fields)
  },
  warn(msg: string, fields?: Fields): void {
    log('warn', msg, fields)
  },
  error(msg: string, fields?: Fields): void {
    log('error', msg, fields)
  },
}
