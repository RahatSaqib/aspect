function* transformResultPayload(context) {
  const { device: { deviceType } } = context
  // FIXME this should be CHAI once merge PR#343
  if (deviceType === 'm2000') {
    return yield* handleChaiResult(context)
  }
  return context.payload
}

function* handleChaiResult(context) {
  console.log('CHAI RESULT!!!!!!')
  return context.payload
}

module.exports = {
  transformResultPayload,
}
