const subDays = require('date-fns/sub_days')

const {
  MODULE_FAILURE_ERROR_CODES,
  moduleFailureMaxErrors,
} = require('./errors')

async function resolveModuleFailureError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const issueData = JSON.parse(issue.data) || {}
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_FAILURE_ERROR_CODES)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')
  const [module] = modules.filter(
    mod => mod.resultModuleName === issueData.resultModuleName
  )
  return module != null && module.errorCount <= moduleFailureMaxErrors
}

module.exports = {
  resolveModuleFailureError,
}
