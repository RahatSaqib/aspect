const Boom = require('@hapi/boom')
const { removeInventory } = require('./common/logic')

module.exports = async function (request) {
  const res = await removeInventory(request)
  if (Boom.isBoom(res)) return res
  return {
    ok: true,
    data: res, // see corresponding handler func for details about it's response
  }
}
