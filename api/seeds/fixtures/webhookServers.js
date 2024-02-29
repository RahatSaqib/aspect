const { WEBHOOK_SERVERS } = require('../../src/shared/constants')

const srvCepheidC360 = {
  externalId: WEBHOOK_SERVERS.CepheidC360,
  headers: {
    toLogin: {
      /**
       * this is a Basic<BASE64(CLIENT_ID:CLIENT_SECRET) OAuth 2.0 type.
       * to get this value - run btoa('client_id:client_secret') in browser console.
       * See client_id and client_secret in LastPass > Shared-SystemOne IT > Cepheid C360
       */
      Authorization:
        'Basic NTN1MjBlbWVrdTJqZm5jbG9sMTJ1NTRjanI6Z2oyNjM4YWxuOTE4cTB2dWpiOWQ3djRmbGZhZjQ1N2M1cWIzYmlvNmgwM3IwaDVnaW9z',
    },
    toRefreshToken: {
      Authorization:
        'Basic NTN1MjBlbWVrdTJqZm5jbG9sMTJ1NTRjanI6Z2oyNjM4YWxuOTE4cTB2dWpiOWQ3djRmbGZhZjQ1N2M1cWIzYmlvNmgwM3IwaDVnaW9z',
    },
  },
  params: {
    toLogin: {
      method: 'POST',
      url: 'https://auth-datareceiver-dev.stg.c360.cepheid.com/oauth2/token',
      payload: {
        grant_type: 'client_credentials',
        client_id: '53u20emeku2jfnclol12u54cjr',
      },
    },
    toRefreshToken: {
      method: 'POST',
      url: 'https://auth-datareceiver-dev.stg.c360.cepheid.com/oauth2/token',
      payload: {
        grant_type: 'client_credentials',
        client_id: '53u20emeku2jfnclol12u54cjr',
      },
    },
  },
}

module.exports = [srvCepheidC360]
