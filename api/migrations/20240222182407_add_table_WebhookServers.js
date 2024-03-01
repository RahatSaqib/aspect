const { addTimestamps } = require('./utils/index')

exports.up = async function (knex) {
  await knex.schema.createTable('WebhookServer', tbl => {
    tbl.increments('id')
    tbl.string('externalId').unique().notNullable()
    /**
     * headers for login and refreshToken requests:
     * headers = {
     *    toLogin: {
     *      'Header-Name': 'headerValue',
     *      Authorization: 'Basic <BASE64(client_id:client_serial)>',
     *      ...
     *    },
     *    toRefreshToken: {
     *      'Header-Name': 'headerValue',
     *      ...
     *    }
     * }
     */
    tbl.specificType('headers', 'JSON').notNullable()
    /**
     * params for login and refreshToken requests:
     * params = {
     *    toLogin: {
     *      username: 'admin',
     *      password: 'good',
     *      client_id: 'client_id',
     *      ...
     *    },
     *    toRefreshToken: {
     *      client_id: 'client_id',
     *      'token': '{{accessToken}}',
     *      ...
     *    }
     * }
     */
    tbl.specificType('params', 'JSON').notNullable()
    tbl.string('accessToken', 4096)
    tbl.string('refreshToken', 512)
    tbl.boolean('isValid').notNullable().defaultTo(0)
    tbl.dateTime('expiresOn')

    addTimestamps(tbl, { by: { nullable: true } })
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('WebhookServer')
}
