function isValidSampleExternalIdMobileFormat(externalId) {
  const sampleExternalIdMobileFormat = /^[0-9]{3}-[0-9]{6}-[0-9]{3}$/
  return sampleExternalIdMobileFormat.test(externalId)
}

module.exports = {
  isValidSampleExternalIdMobileFormat,
}
