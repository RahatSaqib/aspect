const { onFormDataResultLogged } = require('./customFields/linkFormDataOnResultLogged')
const { types: resultActionTypes } = require('../result/actions')

const subscriptions = [
  {
    actions: {
      // Truenat-only trigger for now; re-add RESULT_LOGGED here when broader linking is required.
      [resultActionTypes.TRUENAT_RESULT_LOGGED]: onFormDataResultLogged,
      // Fired by persistDeploymentChanges after a deployment backfills Result.siteId
      // (NULL -> set), so previously-skipped FormData linking can be retried.
      [resultActionTypes.RESULT_SITE_ASSIGNED]: onFormDataResultLogged,
    },
  },
]

module.exports = { subscriptions }
