const _ = require('lodash')
const { differenceInMinutes } = require('date-fns')
const Promise = require('bluebird')
const allWebhookServers = require('./servers')

async function onWebHookServerCheckTokens(action, context) {
  return context.messageContext.run(async knex => {
    /**
     * get list of all registered webhook servers
     */
    const webhookServers = await knex('WebhookServer').select('*')
    /**
     *
     */
    await Promise.each(webhookServers, async srv => {
      const { id, externalId, expiresOn } = srv
      const server = allWebhookServers[externalId]
      if (!server) return

      srv.params = JSON.parse(srv.params || '{}')
      srv.headers = JSON.parse(srv.headers || '{}')

      /**
       * make sure that 10 mins before expiration we re-fetch access token.
       * If it fails now - then we'll have 2 more attempts because scheduler job is
       * running every 5 mins (see /scheduler/scheduler.js)
       */
      const MINS_UNTIL_EXPIRES = 10

      const now = new Date()
      let headers
      let params
      if (!expiresOn) {
        headers = srv.headers.toLogin || {}
        params = srv.params.toLogin || {}
      } else if (differenceInMinutes(new Date(expiresOn), now) <= MINS_UNTIL_EXPIRES) {
        headers = srv.headers.toRefreshToken || {}
        params = srv.params.toRefreshToken || {}
      }

      if (headers) {
        const data = await server.getToken(headers, params)

        // eslint-disable-next-line no-console
        console.log('_________________ getToken', data)

        /**
         * update db with received accessToken et la
         */
        const { isValid = 0, accessToken, refreshToken = null, expiresOn = null } = data
        await knex('WebhookServer')
          .update({
            params: JSON.stringify(_.merge(srv.params, data.params || {})),
            headers: JSON.stringify(_.merge(srv.headers, data.headers || {})),
            isValid,
            accessToken,
            refreshToken,
            expiresOn,
          })
          .where('id', id)
      }
    })
  })
}

module.exports = onWebHookServerCheckTokens
