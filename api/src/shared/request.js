function getRemoteAddress(request) {
  if (!request) return ''

  const forwardedFor = request.headers ? request.headers['x-forwarded-for'] : ''

  return forwardedFor ? forwardedFor.split(',')[0] : request.info ? request.info.remoteAddress : ''
}

module.exports = {
  getRemoteAddress,
}
