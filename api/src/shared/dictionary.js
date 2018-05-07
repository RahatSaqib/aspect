const _ = require('lodash')
const { knex } = require('../db')

let messageStatuses = null
async function messageStatusToId() {
  if (!messageStatuses) {
    messageStatuses = {}

    // read all items from table MessageStatus
    const items = await knex('MessageStatus').select('id', 'externalId')

    // loop all and set id's for needed status tokens
    _.forEach(items, x => {
      messageStatuses[x.externalId] = x.id
    })
  }

  return messageStatuses
}

module.exports = {
  messageStatusToId,
}
