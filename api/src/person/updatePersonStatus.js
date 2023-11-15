const { knex } = require('../db')
const userService = require('../auth/service')

async function updatePersonStatus(request) {
  const {
    auth: { credentials },
    params: { personId },
    method,
  } = request
  const { id: disabledBy } = await userService.getUser(credentials.name)
  const person = await knex('Person')
    .where('id', personId)
    .update(
      method === 'delete'
        ? {
            disabled: true,
            disabledOn: new Date(),
            disabledBy,
          }
        : { disabled: false, disabledOn: null, disabledBy: null }
    )
  return { ok: true, data: person }
}

module.exports = {
  updatePersonStatus,
}
