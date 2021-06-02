const getResultDateOrDefault = (patientData, resultData) =>
  resultData.dateReleased || patientData.dateEncoded || new Date()

module.exports = {
  getResultDateOrDefault,
}
