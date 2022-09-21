const { getConstraints } = require('../auth/constraints')
const { getPartnerByConstraints } = require('./common/db')

module.exports = async function getCurrentPartner({ auth }) {
  const dataConstraints = await getConstraints(auth.credentials)
  return getPartnerByConstraints(dataConstraints)
}
