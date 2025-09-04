const { onAsyncPayloadToProcess } = require('./asyncPayloadProcessor')
const { onResultUpdated, onResultLogged } = require('./service')

const subscriptions = [
  {
    actions: {
      RESULT_UPDATED: onResultUpdated,
      RESULT_LOGGED: onResultLogged,
      ASYNC_PAYLOAD_RECEIVED: onAsyncPayloadToProcess,
    },
  },
]

module.exports = { subscriptions }
