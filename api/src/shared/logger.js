const { createLogger, format, transports } = require('winston')
const config = require('../config')

const { combine, timestamp, label, printf, errors } = format
// Plain text
const myFormat = printf(info => {
  if (typeof message === 'object') {
    info.message = JSON.stringify(info.message, null, 3)
  }
  if (typeof message === 'object') {
    info.message = JSON.stringify(info.message, null, 3)
  }
  // this is for boom validations errors, it doesn't arrive with message property
  if (!info.message) return JSON.stringify(info, null, '\t')
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}${
    info.stack ? `\n${info.stack}` : ''
  }`
})

const relabel = format(info => {
  if (info.reLabel) info.label = info.reLabel
  return info
})
const labelsWhiteList = format(info => {
  if (config.log.labelsWhiteList) {
    const regex = new RegExp(config.log.labelsWhiteList, 'g')
    if (!regex.test(info.label)) {
      // this is a regular expression
      return false
    }
  }
  return info
})

const blacklistLabels = format(info => {
  if (config.log.labelsBlackList) {
    const regex = new RegExp(config.log.labelsBlackList, 'g')
    if (regex.test(info.label)) {
      return false
    }
  }
  return info
})

const getBaseFormat = extraFormater =>
  combine(
    format.colorize(),
    label({ label: 'Aspect api' }),
    relabel(),
    errors({ stack: true }),
    labelsWhiteList(),
    blacklistLabels(),

    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    extraFormater
  )

const logger = createLogger()
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `

if (config.log.format === 'JSON') {
  logger.add(
    new transports.Console({
      format: getBaseFormat(format.simple()),
      level: config.log.logLevel,
    })
  )
} else {
  logger.add(
    new transports.Console({
      format: getBaseFormat(myFormat),
      level: config.log.logLevel,
    })
  )
}

if (config.log.loggingFilePath) {
  logger.add(
    new transports.File({
      format: getBaseFormat(format.simple()),
      filename: config.log.loggingFilePath,
      level: config.log.fileLogLevel,
    })
  )
}

module.exports = logger
