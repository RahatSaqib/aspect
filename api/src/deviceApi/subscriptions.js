const { onResultUpdated, onResultLogged } = require('./service')

const subscriptions = [
  {
    actions: {
      RESULT_UPDATED: onResultUpdated,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
