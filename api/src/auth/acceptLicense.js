const { getUser, refreshToken } = require('./service')
const { getRemoteAddress } = require('../shared/request')
const { query } = require('../db')

async function acceptLicense(request) {
  const {
    payload: { licenseId },
  } = request

  const loggedInUser = await getUser(request.auth.credentials.name)

  const licenseUpdates = {
    acceptedOn: new Date(),
    ip: getRemoteAddress(request),
  }

  await query('Insert or update accepted license for user').raw(
    'INSERT INTO LicensePerson set ? ON DUPLICATE KEY UPDATE ?',
    [
      {
        licenseId,
        personId: loggedInUser.personId,
        ...licenseUpdates,
      },
      licenseUpdates,
    ]
  )

  // need to return a new JWT, now without hasToAcceptLicenseId
  return refreshToken(request)
}

module.exports = {
  acceptLicense,
}
