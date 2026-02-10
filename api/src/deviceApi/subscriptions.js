const { onAsyncPayloadToProcess } = require('./result/asyncPayloadProcessor')
const { onResultLogged } = require('./service')

const subscriptions = [
  {
    actions: {
      RESULT_LOGGED: onResultLogged,
      ASYNC_PAYLOAD_RECEIVED: onAsyncPayloadToProcess,
    },
  },
]

module.exports = { subscriptions }
