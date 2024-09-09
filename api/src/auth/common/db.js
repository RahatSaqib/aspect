const { query } = require('../../db')

// Revoke/Grant access to specific user
async function revokeUsersToken(userId, revoke) {
  await query('change revoked state for the specific user in refresh token tables')
    .from('RefreshToken')
    .where({ userId })
    .update({
      revoked: revoke,
    })
}

// Lockedout and grant access to login to specific user.
async function lockedOutUser(userId, lockedOut) {
  await query('change Lockout state for the specific user ').from('User').where({ id: userId }).update({
    lockedOut,
  })
}

module.exports = {
  revokeUsersToken,
  lockedOutUser,
}
