const plainToDeepObjectResult = result => {
  if (!result) return null

  const r = { ...result }

  if (typeof result.patientData === 'string') r.patientData = JSON.parse(result.patientData)

  if (typeof result.resultData === 'string') r.resultData = JSON.parse(result.resultData)

  return r
}

module.exports = {
  plainToDeepObjectResult,
}
