const config = require('../config')
const { parseDateOrDefault } = require('../shared/date')
const { logCreated } = require('./actions')
const { getRemoteAddress } = require('../shared/request')
const logger = require('../shared/logger')

const logConsoleDataKeys = {
  request: ['remoteAddress', 'method', 'path', 'statusCode', 'timeElapsed'],
}

function addLoggers(server, queue) {
  server.events.on('response', request => logRequest(queue, request))
}

function getLoggerSubscriptions() {
  const subscriptions = []
  if (config.log.db.enabled) {
    subscriptions.push(subscribeOnLogCreated(onLogDatabase))
  }
  return subscriptions
}

function subscribeOnLogCreated(handler) {
  return {
    actions: {
      LOG_CREATED: handler,
    },
  }
}

function logRequest(queue, request) {
  const { info, auth, method, url, response } = request

  const { statusCode } = response

  const userName = auth.isAuthenticated ? auth.credentials.name : ''
  const timeElapsed = info.responded - info.received

  // TODO warn if timeElapsed > some constant?
  const severity = statusCode >= 400 && statusCode <= 599 ? 'error' : 'info'
  const data = {
    method: method.toUpperCase(),
    path: url.pathname,
    statusCode,
    timeElapsed,
    remoteAddress: getRemoteAddress(request),
  }

  logAction(logCreated('request', severity, data, userName), queue)
}

function logAction(action, dispatcher = null) {
  logConsole(action)
  if (dispatcher != null) {
    dispatcher.dispatch(action)
  }
}

function logConsole({ logKey, severity, data, userName, createdOn }) {
  const dataKeys = logConsoleDataKeys[logKey] || []
  const message = dataKeys.map(key => data[key] || '').join(' ')
  const logMessage = `${data.timeElapsed}ms ${message} ${userName || ''} [${createdOn}]`
  logger[severity](logMessage, { reLabel: `aspect:api:${logKey}` })
}

async function onLogDatabase({ logKey, severity, data, userName, createdOn }, { messageContext }) {
  return messageContext.run(knex =>
    knex('AuditLog').insert({
      logKey,
      severity,
      data: JSON.stringify(data),
      userName,
      createdOn: parseDateOrDefault(createdOn, new Date()),
    })
  )
}

module.exports = {
  addLoggers,
  getLoggerSubscriptions,
}
