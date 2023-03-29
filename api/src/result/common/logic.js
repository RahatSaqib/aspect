const get = require('lodash/get')

const plainToDeepObjectResult = result => {
  if (!result) return null

  const r = { ...result }

  if (typeof result.patientData === 'string') r.patientData = JSON.parse(result.patientData)

  if (typeof result.resultData === 'string') r.resultData = JSON.parse(result.resultData)

  return r
}

const getMissingResultValues = (result, sources) => {
  const deepResult = plainToDeepObjectResult(result)
  const missingSources = sources.filter(src => {
    const value = get(deepResult, src)
    return !value
  })
  return missingSources
}

module.exports = {
  plainToDeepObjectResult,
  getMissingResultValues,
}
