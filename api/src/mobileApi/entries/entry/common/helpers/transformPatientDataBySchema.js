const _ = require('lodash')

function transformPatientDataBySchema(patientData, patientDataSchema) {
  const transformedData = _.map(patientDataSchema, (value, key) => {
    return {
      key,
      value: patientData[key],
      title: value.title,
      order: value.order,
    }
  })
  return _.orderBy(transformedData, ['order'], ['asc'])
}

module.exports = { transformPatientDataBySchema }
