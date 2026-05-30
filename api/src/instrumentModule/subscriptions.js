const { onResultLogged } = require('./service')

const subscriptions = [
  {
    actions: {
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
