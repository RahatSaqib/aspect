const Promise = require('bluebird')
const includes = require('lodash/includes')
const { allReportToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const reportForAll = 'critical_errors_by_device'
  const jobFunctionsWithLowerPermissions = [
    'deviceMaker',
    'technician',
    'ntpNoResults',
    'donor',
  ]

  const reportIdByExternalId = await allReportToId()
  const reportIds = Object.values(reportIdByExternalId)
  const jobFunctions = await knex('JobFunction').select('externalId', 'id')

  const insertions = jobFunctions.map(
    ({ externalId: jobFunctionExternalId, id: jobFunctionId }) => {
      if (includes(jobFunctionsWithLowerPermissions, jobFunctionExternalId)) {
        return knex('JobFunctionReport').insert({
          jobFunctionId,
          reportId: reportIdByExternalId[reportForAll],
        })
      }
      return Promise.each(reportIds, async reportId =>
        knex('JobFunctionReport').insert({ jobFunctionId, reportId })
      )
    }
  )
  await Promise.all(insertions)
}

module.exports = seed
