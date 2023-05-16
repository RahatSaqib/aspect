const { modifyInventoryOnHand } = require('./common/logic')

module.exports = async function (request) {
  return modifyInventoryOnHand(request)
}
