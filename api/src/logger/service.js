const { parseDateOrDefault } = require('../shared/date')
const { logCreated } = require('./actions')

const logConsoleDataKeys = {
  request: ['remoteAddress', 'method', 'path', 'statusCode', 'timeElapsed'],
}

function addLoggers(server, queue) {
  server.on('response', request => logRequest(queue, request))
}

function getLoggerSubscriptions() {
  return [
    subscribeOnLogCreated(onLogConsole),
    subscribeOnLogCreated(onLogDatabase),
  ]
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

  const { remoteAddress } = info
  const { path } = url
  const { statusCode } = response

  const userName = auth.isAuthenticated ? auth.credentials.name : ''
  const timeElapsed = info.responded - info.received

  // TODO warn if timeElapsed > some constant?
  const severity = statusCode >= 400 && statusCode <= 599 ? 'error' : 'info'
  const data = {
    method: method.toUpperCase(),
    path,
    statusCode,
    timeElapsed,
    remoteAddress,
  }

  queue.dispatch(logCreated('request', severity, data, userName))
}

function onLogConsole({ logKey, severity, data, userName, createdOn }) {
  const dataKeys = logConsoleDataKeys[logKey] || []
  const message = dataKeys.map(key => data[key] || '').join(' ')
  const logMessage = `${logKey} ${severity} ${message} ${userName ||
    ''} [${createdOn}]`
  console.log(logMessage) // eslint-disable-line no-console
}

async function onLogDatabase(
  { logKey, severity, data, userName, createdOn },
  { messageContext }
) {
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
