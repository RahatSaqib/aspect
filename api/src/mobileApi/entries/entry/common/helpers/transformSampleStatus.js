const _ = require('lodash')

const sampleStatusState = [
  { id: 'SAMPLE_REGISTERED', backgroundColor: 'info', label: 'Logged', i18nKey: 'logged' },
  { id: 'SAMPLE_READY_FOR_PICKUP', backgroundColor: 'info', label: 'Awaiting Pickup', i18nKey: 'awaiting_pickup' },
  { id: 'SAMPLE_IN_TRANSIT', backgroundColor: 'info', label: 'In Transit', i18nKey: 'in_transit' },
  { id: 'SAMPLE_RECEIVED_AT_LAB', backgroundColor: 'info', label: 'Received', i18nKey: 'received_at_lab' },
  { id: 'SAMPLE_UNDER_ANALYSIS', backgroundColor: 'info', label: 'Testing', i18nKey: 'under_analysis' },
  { id: 'SAMPLE_ANALYSIS_COMPLETED', backgroundColor: 'info', label: 'Test Completed', i18nKey: 'analysis_completed' },
  { id: 'RESULT_PENDING_REVIEW', backgroundColor: 'info', label: 'Review Pending', i18nKey: 'pending_review' },
  { id: 'RESULT_REVIEWED', backgroundColor: 'info', label: 'Reviewed', i18nKey: 'reviewed' },
  { id: 'RESULT_SENT_TO_PROVIDER', backgroundColor: 'info', label: '', i18nKey: 'sent_to_provider' },
  { id: 'RESULT_RECEIVED_BY_PROVIDER', backgroundColor: 'info', label: '', i18nKey: 'received_by_provider' },
  { id: 'RESULT_SHARED_WITH_PATIENT', backgroundColor: 'info', label: '', i18nKey: 'shared_with_patient' },
  { id: 'SAMPLE_LOST_IN_TRANSIT', backgroundColor: 'danger', label: 'Lost in Transit', i18nKey: 'lost_in_transit' },
  {
    id: 'SAMPLE_DAMAGED_IN_TRANSIT',
    backgroundColor: 'danger',
    label: 'Damaged in Transit',
    i18nKey: 'damaged_in_transit',
  },
  { id: 'SAMPLE_DAMAGED_AT_LAB', backgroundColor: 'danger', label: 'Damaged in Lab', i18nKey: 'damaged_at_lab' },
  { id: 'SAMPLE_LOST_AT_LAB', backgroundColor: 'danger', label: 'Lost in Lab', i18nKey: 'lost_at_lab' },
  {
    id: 'SAMPLE_NOT_FEASIBLE_FOR_ANALYSIS',
    backgroundColor: 'warning',
    label: 'Not Usable',
    i18nKey: 'not_feasible_for_analysis',
  },
  { id: 'SAMPLE_STATUS_UNKNOWN', backgroundColor: 'mute', label: 'Unknown', i18nKey: 'sample_status_unknown' },
]

function transformSampleStatus(status) {
  const defaultStatus = _.find(sampleStatusState, { id: 'SAMPLE_STATUS_UNKNOWN' })
  const statusState = _.find(sampleStatusState, { id: status })
  return _.isEmpty(statusState) ? defaultStatus : statusState
}

module.exports = { transformSampleStatus }
