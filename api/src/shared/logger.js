const SentryTransport = require('winston-transport-sentry-node').default

const { createLogger, format, transports, config: winstonConfig } = require('winston')
const { Mail } = require('winston-mail')
const { Sentry } = require('./sentry')

const config = require('../config')

const { combine, timestamp, label, printf, errors } = format
// Plain text
const plainTextFormat = printf(info => {
  // this is for boom validations errors, it doesn't arrive with message property
  if (!info.message) return JSON.stringify(info, null, 3)
  if (typeof info.message === 'object') {
    info.message = JSON.stringify(info.message, null, 3)
  }

  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
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

const consoleLogger = config.log.format === 'JSON' ? format.simple() : plainTextFormat
const logger = createLogger({
  levels: winstonConfig.syslog.levels,
  format: getBaseFormat(consoleLogger, config.log),
  level: config.log.logLevel,
  transports: [new transports.Console()],
})

if (config.log.file.path) {
  logger.add(
    new transports.File({
      format: getBaseFormat(config.log.file.format === 'JSON' ? format.simple() : plainTextFormat, config.log.file),
      filename: config.log.file.path,
      level: config.log.file.logLevel,
    })
  )
}

if (config.log.mail.logLevel) {
  logger.add(
    new Mail({
      to: config.admin.email,
      from: config.email.fromEmail,
      host: config.email.host,
      port: config.email.port,
      username: config.email.user,
      password: config.email.password,
      subject: `Aspect Error in ${config.countryName}: "{{msg}}"`,
      level: config.log.mail.logLevel,
    })
  )
}

if (config.sentry?.dsn && !config.isDevelopment && config.sentry?.logLevel) {
  const options = {
    sentry: Sentry,
    level: config.sentry.logLevel,
    format: combine(format.timestamp(), format.errors({ stack: true }), format.metadata(), format.json()),
    filterDataKeys: config.sentry.sanitizeKeys || [],
    ignoreErrors: config.sentry.ignoreErrors || [],
    tags: {
      country: config.countryName,
      version: require('../../package.json').version,
    },
  }

  logger.add(new SentryTransport(options))
}

module.exports = logger
