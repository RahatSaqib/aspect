const _ = require('lodash')
const { query } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function* getJobFunctionsForSelectList(request) {
  const { auth } = request
  const dataConstraints = yield getConstraints(auth.credentials)
  const partnersAndJobFunctions = yield query('Get partners and job functions for select lists')
    .from('JobFunction as jf')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .orderBy(['p.name', 'jf.name'], 'asc')
    .select(
      'p.id as partnerId', 'p.name as partnerName',
      'jf.id as jobFunctionId', 'jf.name as jobFunctionName')

  const partners = _.map(
      _.uniqBy(partnersAndJobFunctions, 'partnerId'),
      partnerRecord => ({
        id: partnerRecord.partnerId,
        name: partnerRecord.partnerName,
        jobFunctions: _.orderBy(_.map(
            _.filter(partnersAndJobFunctions, { partnerId: partnerRecord.partnerId }),
            jobFunctionRecord => ({
              id: jobFunctionRecord.jobFunctionId,
              name: jobFunctionRecord.jobFunctionName
            })), 'name')
      }))

  return {
    ok: true,
    data: partners
  }
}

module.exports = {
  getJobFunctionsForSelectList
}
