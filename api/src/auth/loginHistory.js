async function createLoginHistoryEntry(query, userId, userName, success, message) {
  await query('Create Login history entry').from('LoginHistory').insert({
    userId,
    userName,
    action: 'login',
    success,
    message,
    createdOn: new Date(),
  })
}
module.exports = { createLoginHistoryEntry }
