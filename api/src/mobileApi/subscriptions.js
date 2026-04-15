const { onFormDataResultLogged } = require('./customFields/linkFormDataOnResultLogged')
const { types: resultActionTypes } = require('../result/actions')

const subscriptions = [
  {
    actions: {
      // Truenat-only trigger for now; re-add RESULT_LOGGED here when broader linking is required.
      [resultActionTypes.TRUENAT_RESULT_LOGGED]: onFormDataResultLogged,
    },
  },
]

module.exports = { subscriptions }
