const { logCreated } = require('./actions')

function addLoggers(server, queue) {
  server.on('response', request => logRequest(queue, request))
}

function getLoggerSubscriptions() {
  return [
    {
      actions: {
        LOG_CREATED: onLogConsole,
      },
    },
  ]
}

function logRequest(queue, request) {
  const { info, auth, method, url, response } = request

  const { remoteAddress } = info
  const { path } = url
  const { statusCode } = response

  const user = auth.isAuthenticated ? auth.credentials.name : ''
  const time = new Date().toISOString()
  const timeElapsed = info.responded - info.received
  const requestLog = `"${method.toUpperCase()} ${path}" ${statusCode}`
  const message = `${remoteAddress} - ${user} [${time}] ${timeElapsed} ${requestLog}`
  const severity = statusCode >= 400 && statusCode <= 599 ? 'error' : 'info'
  const data = {
    path,
    statusCode,
    timeElapsed,
    remoteAddress,
  }

  queue.dispatch(logCreated('request', severity, message, user, data))
}

function onLogConsole({ message }) {
  console.log(message) // eslint-disable-line no-console
}

module.exports = {
  addLoggers,
  getLoggerSubscriptions,
}
