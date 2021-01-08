const { createLogger, format, transports } = require('winston')

const { combine, timestamp, label, printf, errors } = format

// Plain text
const myFormat = printf(
  ({ level, message, label, reLabel, timestamp, stack }) => {
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 3)
    }
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 3)
    }
    return `${timestamp} [${reLabel || label}] ${level}: ${message}${
      stack ? `\n${stack}` : ''
    }`
  }
)

const filterLabel = format(info => {
  if (
    process.env['log.filterLabel'] &&
    info.reLabel &&
    !info.reLabel.toString().match(process.env['log.filterLabel'])
  ) {
    return false
  }
  return info
})
const logger = createLogger()
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env['log.format'] === 'JSON') {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  )
} else {
  logger.add(
    new transports.Console({
      format: combine(
        format.colorize(),
        label({ label: 'Aspect api' }),
        filterLabel(),
        errors({ stack: true }),

        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
      ),
      level: process.env['log.logLevel'] || 'debug',
    })
  )
}

if (process.env.loggingFilePath) {
  logger.add(
    new transports.File({
      filename: process.env.loggingFilePath,
      level: process.env['log.logLevel'] || 'info',
    })
  )
}

module.exports = logger
