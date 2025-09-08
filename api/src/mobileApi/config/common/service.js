const crypto = require('crypto')
const { knex } = require('../../../db')

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
 * Finds the first available mobile device record for assignment
 * Priority: 1) Unassigned records, 2) Oldest inactive records, 3) Oldest active records > 3 months
 * @param {string} deviceCode - The device code to look up
 * @param {number} userId - The user ID for updating records
 * @returns {Promise<Object>} Response containing the deviceIdentifier or error
 */
async function findAvailableMobileDevice(deviceCode, userId) {
  if (!deviceCode || typeof deviceCode !== 'string') {
    throw new Error('Invalid device code provided')
  }

  // Check if deviceCode is already assigned
  const existingAssignment = await knex('MobileDevice')
    .where('deviceCode', deviceCode)
    .first()

  if (existingAssignment) {
    // Set current assignment as inactive
    await knex('MobileDevice')
      .where('id', existingAssignment.id)
      .update({
        active: false,
        updatedBy: userId,
        updatedOn: new Date()
      })
  }

  // Find first available record with priority order
  const availableRecord = await knex('MobileDevice')
    .where(function () {
      // Unassigned records (no deviceCode)
      this.whereNull('deviceCode')
        .orWhere(function () {
          // Inactive records (active = false)
          this.where('active', false)
        })
        .orWhere(function () {
          // Active records older than 3 months
          this.where('active', true)
            .where('updatedOn', '<', knex.raw('DATE_SUB(NOW(), INTERVAL 3 MONTH)'))
        })
    })
    .orderBy([
      { column: 'deviceCode', order: 'asc', nulls: 'first' }, // Unassigned first
      { column: 'active', order: 'asc' }, // Inactive before active
      { column: 'updatedOn', order: 'asc' } // Oldest first
    ])
    .first()

  if (!availableRecord) {
    throw new Error('All mobile spots are assigned.')
  }

  // Assign the record to the deviceCode
  await knex('MobileDevice')
    .where('id', availableRecord.id)
    .update({
      deviceCode,
      active: true,
      createdBy: userId,
      createdOn: new Date(),
      updatedBy: userId,
      updatedOn: new Date()
    })

  return {
    appId: availableRecord.deviceIdentifier
  }
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
  const userId = auth?.credentials?.id || 1 // Default to admin user if no auth
  try {
    const result = await findAvailableMobileDevice(deviceCode, userId)
    return {
      ok: true,
      data: { appId: result.appId },
    }
  } catch (error) {
    if (error.message === 'All mobile spots are assigned.') {
      return {
        ok: false,
        error: error.message,
        statusCode: 409
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
