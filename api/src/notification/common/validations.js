const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../../db')

const validateFilterCondition = async filterCondition => {
  const { jobFunctions, persons } = filterCondition
  if (jobFunctions) {
    const jobFunctionsIds = jobFunctions.map(jf => jf.jobFunctionId)
    const existingJobFunctions = await knex('JobFunction').whereIn('id', jobFunctionsIds)
    if (jobFunctionsIds.length !== existingJobFunctions.length)
      return Boom.badRequest('Attempt to set unexisting job function to notification')
  }
  if (persons) {
    const personsIds = persons.map(p => p.personId)
    const existingPersons = await knex('Person as p')
      .leftJoin('JobContext as jc', 'p.id', 'jc.personId')
      .whereIn('p.id', personsIds)
      .groupBy('p.id')
      .select(['p.id as personId', knex.raw('COUNT(jc.id) as numberOfJobs')])
    if (personsIds.length !== existingPersons.length)
      return Boom.badRequest('Attempt to set unexisting person to notification')
    if (existingPersons.filter(p => _.isNil(p.numberOfJobs) || p.numberOfJobs === 0).length > 0)
      return Boom.badRequest('Attempt to set to notifications persons without assigned jobs')
  }
  return true
}
module.exports = { validateFilterCondition }
