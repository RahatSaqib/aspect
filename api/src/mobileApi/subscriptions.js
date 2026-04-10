const { onFormDataResultLogged } = require('./customFields/linkFormDataOnResultLogged')

const subscriptions = [
  {
    actions: {
      RESULT_LOGGED: onFormDataResultLogged,
    },
  },
]

module.exports = { subscriptions }
