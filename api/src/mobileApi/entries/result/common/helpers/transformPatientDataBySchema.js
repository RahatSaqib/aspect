const _ = require('lodash')

function transformPatientDataBySchema(patientData, patientDataSchema) {
  if (_.isNil(patientData) || _.isNil(patientDataSchema)) return null
  const transformedData = _.map(patientDataSchema, (value, key) => {
    return !_.isNil(patientData[key])
      ? {
          key,
          value: patientData[key],
          title: value.title,
          order: value.order,
        }
      : null
  })
  return _.orderBy(_.pickBy(transformedData, _.identity), ['order'], ['asc'])
}

module.exports = { transformPatientDataBySchema }
