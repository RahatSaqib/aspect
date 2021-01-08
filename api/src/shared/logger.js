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
  if (process.env['log.filterLabel'] && info.reLabel) {
    const regex = new RegExp(process.env['log.filterLabel'].toString(), 'g')
    if (!regex.test(info.reLabel.toString())) {
      // this is a regular expression
      return false
    }
  }
  return info
})

const blacklistLabels = format(info => {
  if (process.env['log.labelsBlackListed'] && info.reLabel) {
    const regex = new RegExp(
      process.env['log.labelsBlackListed'].toString(),
      'g'
    )
    if (regex.test(info.reLabel)) {
      return false
    }
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
      format: combine(
        format.colorize(),
        label({ label: 'Aspect api' }),
        errors({ stack: true }),
        filterLabel(),
        blacklistLabels(),

        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.simple()
      ),
    })
  )
} else {
  logger.add(
    new transports.Console({
      format: combine(
        errors({ stack: true }),
        format.colorize(),
        label({ label: 'Aspect api' }),
        filterLabel(),
        blacklistLabels(),

        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
      ),
      level: process.env['log.logLevel'] || 'info',
    })
  )
}

if (process.env['log.loggingFilePath']) {
  logger.add(
    new transports.File({
      format: combine(
        errors({ stack: true }),
        format.colorize(),
        label({ label: 'Aspect api' }),
        filterLabel(),
        blacklistLabels(),

        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.simple()
      ),
      filename: process.env['log.loggingFilePath'],
      level: process.env['log.fileLogLevel'] || 'info',
    })
  )
}

module.exports = logger
