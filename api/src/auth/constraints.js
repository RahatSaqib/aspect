const { getUser, getUserByUserId, getPersonByPersonId } = require('./service')
const {
  getConstraintsForUser,
  getJobConstraints,
  canView,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
  canEdit,
  canEditInventories,
  addPartnerQueryConstraints,
  getContext,
  getConstraintsByDeviceAPIKey,
} = require('../shared/constraints')

async function getConstraints(credentials) {
  const user = await getUserFromCredentials(credentials)
  return getConstraintsForUser(user)
}

async function getUserFromCredentials(credentials) {
  return credentials.name
    ? getUser(credentials.name)
    : credentials.userId
    ? getUserByUserId(credentials.userId)
    : credentials.personId
    ? getPersonByPersonId(credentials.personId)
    : null
}

module.exports = {
  getConstraints,
  getJobConstraints,
  canView,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
  canEdit,
  canEditInventories,
  addPartnerQueryConstraints,
  getContext,
  getConstraintsByDeviceAPIKey,
  getUserFromCredentials,
}
