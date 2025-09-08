const { assignMobileAppSpot } = require('./assignMobileAppSpot')
const { getUserFromCredentials } = require('../../../auth/constraints')

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
 * Handles the request to assign a mobile device identifier to a device code
 * @param {Object} params - Request parameters
 * @param {Object} params.query - Query parameters
 * @param {string} params.query.deviceCode - The device code to assign a mobile device to
 * @param {Object} params.auth - Authentication object
 * @param {Object} params.auth.credentials - User credentials
 * @param {number} params.auth.credentials.id - User ID
 * @returns {Promise<Object>} Response containing the deviceIdentifier or error message
 */
async function fetchAppIdFromUniqueDeviceCodeHandler({ query, auth }) {
  const deviceCode = query?.deviceCode
  const userId = auth?.credentials?.id

  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user

  try {
    const result = await assignMobileAppSpot(deviceCode, userId, timezoneIANA)
    return {
      ok: true,
      data: { appId: result.appId },
    }
  } catch (error) {
    if (error.isBoom && error.output.statusCode === 409) {
      return {
        ok: false,
        error: error.message,
        statusCode: 409,
      }
    }
    return {
      ok: false,
      error: error.message || 'Failed to assign mobile device',
    }
  }
}

module.exports = {
  fetchApplicationConfigServiceHandler,
  fetchSystemConfigServiceHandler,
  fetchAppIdFromUniqueDeviceCodeHandler,
}
