const { createLogger, format, transports } = require('winston')
const config = require('../config')

const { combine, timestamp, label, printf, errors } = format
// Plain text
const plainTextFormat = printf(info => {
  // console.log(info)
  // this is for boom validations errors, it doesn't arrive with message property
  if (!info.message) return JSON.stringify(info, null, 3)
  if (typeof info.message === 'object') {
    info.message = JSON.stringify(info.message, null, 3)
  }

  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}${
    info.stack ? `\n${info.stack}` : ''
  }`
})

const relabel = format(info => {
  if (info.reLabel) info.label = info.reLabel
  return info
})
const whiteListLabels = format((info, { labelsWhiteList }) => {
  if (config.log.labelsWhiteList) {
    const regex = new RegExp(labelsWhiteList, 'g')
    if (!regex.test(info.label)) {
      return false
    }
  }
  return info
})

const blacklistLabels = format((info, { labelsBlackList }) => {
  if (config.log.labelsBlackList) {
    const regex = new RegExp(labelsBlackList, 'g')
    if (regex.test(info.label)) {
      return false
    }
  }
  return info
})

const getBaseFormat = (extraFormater, { labelsBlackList, labelsWhiteList }) =>
  combine(
    format.colorize(),
    label({ label: 'aspect:api' }),
    relabel(),
    errors({ stack: true }),
    whiteListLabels({ labelsWhiteList }),
    blacklistLabels({ labelsBlackList }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    extraFormater
  )

const consoleLogger =
  config.log.format === 'JSON' ? format.simple() : plainTextFormat
const logger = createLogger({
  format: getBaseFormat(consoleLogger, config.log),
  level: config.log.logLevel,
  transports: [new transports.Console()],
})

if (config.log.file.path) {
  logger.add(
    new transports.File({
      format: getBaseFormat(
        config.log.file.format === 'JSON' ? format.simple() : plainTextFormat,
        config.log.file
      ),
      filename: config.log.file.path,
      level: config.log.fileLogLevel,
    })
  )
}

module.exports = logger
