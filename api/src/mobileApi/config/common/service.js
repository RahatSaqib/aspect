async function fetchApplicationConfigServiceHandler() {
  return Promise.resolve({
    ok: true,
    data: {
      followUpStatusList: [
        {
          id: 'AwaitingFollowUp',
          name: 'Awaiting Follow-up',
          i18nKey: 'AwaitingFollowUp',
        },
        {
          id: 'FollowUpCompleted',
          name: 'Follow-up Completed',
          i18nKey: 'FollowUpCompleted',
        },
        {
          id: 'FollowUpNotPossible',
          name: 'Not Possible',
          i18nKey: 'NotPossible',
        },
        {
          id: 'FollowUpNotRequired',
          name: 'Not Required',
          i18nKey: 'NotRequired',
        },
      ],
      transferStatusList: [
        {
          id: 'TransferredAway',
          name: 'Transferred Away',
          i18nKey: 'TransferredAway',
        },
        {
          id: 'TransferredHere',
          name: 'Transferred Here',
          i18nKey: 'TransferredHere',
        },
        {
          id: 'NotTransferred',
          name: 'Not Transferred',
          i18nKey: 'NotTransferred',
        },
      ],
      entryTypeList: [
        {
          id: 'Sample',
          name: 'Sample',
          i18nKey: 'Sample',
        },
        {
          id: 'TestResult',
          name: 'Test Result',
          i18nKey: 'TestResult',
        },
      ],
    },
  })
}

async function fetchSystemConfigServiceHandler() {
  return Promise.resolve({
    ok: true,
    data: {
      fetchIntervals: [
        {
          operation: 'Entries',
          interval: 300,
        },
        {
          operation: 'Sites',
          interval: 3600,
        },
        {
          operation: 'Treatments',
          interval: 3600,
        },
        {
          operation: 'Outcomes',
          interval: 3600,
        },
      ],
    },
  })
}

module.exports = { fetchApplicationConfigServiceHandler, fetchSystemConfigServiceHandler }
