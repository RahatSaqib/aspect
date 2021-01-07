const { createLogger, format, transports } = require('winston')

const { combine, timestamp, label, printf } = format

// Plain text
const myFormat = printf(({ level, message, label, reLabel, timestamp }) => {
  return `${timestamp} [${reLabel || label}] ${level}: ${message}`
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
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
      ),
      level: process.env.minLogLevel || 'info',
    })
  )
}

if (process.env.loggingFilePath) {
  logger.add(
    new transports.File({
      filename: process.env.loggingFilePath,
      level: process.env.minLogLevel || 'info',
    })
  )
}

module.exports = logger
