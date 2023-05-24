const _ = require('lodash')
const { sampleStatusState } = require('../../../common/consts')

function transformSampleStatus(status) {
  const defaultStatus = _.find(sampleStatusState, { id: 'SAMPLE_STATUS_UNKNOWN' })
  const statusState = _.find(sampleStatusState, { id: status })
  return _.isEmpty(statusState) ? defaultStatus : statusState
}

module.exports = { transformSampleStatus }
