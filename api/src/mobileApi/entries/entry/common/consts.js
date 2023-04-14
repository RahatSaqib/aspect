const TRANSFERRED = {
  AWAY: 'away',
  HERE: 'here',
}

const TEST_TYPE = {
  RESULT: {
    i18nKey: 'testResult',
    text: 'Test Result',
  },
  SAMPLE: {
    i18nKey: 'sample',
    text: 'Sample',
  },
}

const ACKNOWLEDGED = 'Acknowledged'

const fieldNameToFollowUpTypeIdMappings = {
  treatment: 'treatment',
  outcome: 'outcome',
}

const assayAvatarColorsIcon = {
  tb: {
    backgroundColor: 'purple',
    foregroundColor: 'secondary',
  },
  hcv: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
  },
  hiv: {
    backgroundColor: 'orange',
    foregroundColor: 'secondary',
  },
  ebola: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
  },
  covid: {
    backgroundColor: 'purple',
    foregroundColor: 'secondary',
  },
  hbv: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
  },
  default: {
    backgroundColor: 'orange',
    foregroundColor: 'secondary',
  },
}

const sampleStatusState = [
  { id: 'SAMPLE_REGISTERED', backgroundColor: 'muted', i18nKey: 'registered', title: 'Logged' },
  { id: 'SAMPLE_READY_FOR_PICKUP', backgroundColor: 'info', i18nKey: 'awaitingPickup', title: 'Awaiting Pickup' },
  { id: 'SAMPLE_IN_TRANSIT', backgroundColor: 'info', i18nKey: 'inTransit', title: 'In Transit' },
  { id: 'SAMPLE_RECEIVED_AT_LAB', backgroundColor: 'info', i18nKey: 'labReceived', title: 'Received' },
  { id: 'SAMPLE_UNDER_ANALYSIS', backgroundColor: 'info', i18nKey: 'labTesting', title: 'Testing' },
  { id: 'SAMPLE_ANALYSIS_COMPLETED', backgroundColor: 'info', i18nKey: 'labTestCompleted', title: 'Test Completed' },
  { id: 'RESULT_PENDING_REVIEW', backgroundColor: 'info', i18nKey: 'labPendingReview', title: 'Review Pending' },
  { id: 'RESULT_REVIEWED', backgroundColor: 'info', i18nKey: 'labReviewed', title: 'Reviewed' },
  { id: 'RESULT_SENT_TO_PROVIDER', backgroundColor: 'info', i18nKey: '', title: '' },
  { id: 'RESULT_RECEIVED_BY_PROVIDER', backgroundColor: 'info', i18nKey: '', title: '' },
  { id: 'RESULT_SHARED_WITH_PATIENT', backgroundColor: 'info', i18nKey: '', title: '' },
  { id: 'SAMPLE_LOST_IN_TRANSIT', backgroundColor: 'info', i18nKey: 'lostInTransit', title: 'Lost in Transit' },
  {
    id: 'SAMPLE_DAMAGED_IN_TRANSIT',
    backgroundColor: 'danger',
    i18nKey: 'damagedInTransit',
    title: 'Damaged in Transit',
  },
  { id: 'SAMPLE_DAMAGED_AT_LAB', backgroundColor: 'danger', i18nKey: 'damagedInLab', title: 'Damaged in Lab' },
  { id: 'SAMPLE_LOST_AT_LAB', backgroundColor: 'info', i18nKey: 'lostInLab', title: 'Lost in Lab' },
  { id: 'SAMPLE_NOT_FEASIBLE_FOR_ANALYSIS', backgroundColor: 'info', i18nKey: 'notUsable', title: 'Not Usable' },
]

module.exports = {
  TRANSFERRED,
  TEST_TYPE,
  ACKNOWLEDGED,
  fieldNameToFollowUpTypeIdMappings,
  assayAvatarColorsIcon,
  sampleStatusState,
}
