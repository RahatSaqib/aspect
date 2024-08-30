const { getUser } = require('./service')
const { query } = require('../db')

async function getJobFunctions(id, partnerId) {
  return query('Get job functions for user and partner')
    .from('Person as p')
    .innerJoin('JobContext as jc', 'p.id', 'jc.personId') // 'jc.jobFunctionId', 'jf.id')
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .where({ 'p.userId': id, 'jf.partnerId': partnerId })
    .orderBy(['jf.name'])
    .distinct('jf.name')
    .pluck('jf.name')
}

async function getUserJobFunctions(request) {
  const { auth } = request
  const { id, partnerId } = await getUser(auth.credentials.name)
  const jobFunctions = await getJobFunctions(id, partnerId)
  return { ok: true, data: jobFunctions }
}

module.exports = {
  getUserJobFunctions,
}
