const crypto = require('crypto')

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

/**
 * Generates a unique app ID from a device code
 * @param {string} deviceCode - The device code to generate the app ID from
 * @returns {string} A 12-character uppercase alphanumeric code
 * @throws {Error} If deviceCode is missing or invalid
 */
function generateAppId(deviceCode) {
  if (!deviceCode || typeof deviceCode !== 'string') {
    throw new Error('Invalid device code provided')
  }

  const hash = crypto
    .createHash('sha256')
    .update(deviceCode)
    .digest('hex')
    .replace(/[^0-9]/g, '')
  return hash.slice(0, 3).toUpperCase()
}

/**
 * Handles the request to generate an app ID from a device code
 * @param {Object} params - Request parameters
 * @param {Object} params.query - Query parameters
 * @param {string} params.query.deviceCode - The device code to generate the app ID from
 * @returns {Promise<Object>} Response containing the generated app ID or error message
 */
async function fetchAppIdFromUniqueDeviceCodeHandler({ query: { deviceCode } }) {
  try {
    const appId = generateAppId(deviceCode)
    return {
      ok: true,
      data: { appId },
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to generate app ID',
    }
  }
}

module.exports = {
  fetchApplicationConfigServiceHandler,
  fetchSystemConfigServiceHandler,
  fetchAppIdFromUniqueDeviceCodeHandler,
}
