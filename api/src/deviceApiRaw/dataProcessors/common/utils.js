const isNil = require('lodash/isNil')

const getResultDateOrDefault = (patientData, resultData) =>
  resultData.dateReleased || patientData.dateEncoded || new Date()

const objectHasValues = o =>
  Object.values(o).some(value => !isNil(value) && `${value}`.trim() !== '')

module.exports = {
  getResultDateOrDefault,
  objectHasValues,
}
