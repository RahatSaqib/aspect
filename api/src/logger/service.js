function logRequest(request) {
  const { info, auth, method, url, response } = request
  const { remoteAddress } = info
  const { path } = url
  const { statusCode } = response

  const user = auth.isAuthenticated ? auth.credentials.name : ''
  const time = new Date().toISOString()
  const timeElapsed = info.responded - info.received
  const requestLog = `"${method.toUpperCase()} ${path}" ${statusCode}`
  const message = `${remoteAddress} - ${user} [${time}] ${timeElapsed} ${requestLog}`
  console.log(message) // eslint-disable-line no-console
}

module.exports = {
  logRequest,
}
