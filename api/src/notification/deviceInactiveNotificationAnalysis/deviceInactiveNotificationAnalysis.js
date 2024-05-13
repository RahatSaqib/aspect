const { differenceInMilliseconds } = require('date-fns')
const { knex } = require('../../db')
const { deviceOffline } = require('../../device/actions')

/**
 * Calculates the minimum number of days a device has been inactive,
 * excluding any zero values unless all values are zero.
 *
 * @param {...number} values - A spread of numeric values representing days of inactivity.
 * @returns {number} The smallest non-zero value, or 0 if all values are zero
 *
 */
const calculateMinimumDaysInactive = (...values) => {
  const nonZeroValues = values.filter(val => val !== 0)

  if (nonZeroValues.length === 0) {
    return 0
  }

  return Math.min(...nonZeroValues)
}

/**
 * Calculate the number of full days between the current date and the target date.
 * Returns 0 if the target date is not provided, to handle undefined or null values safely.
 *
 * @param {Date} targetDate - The date to compare with the current date.
 * @returns {number} The number of full days difference.
 */
function calculateDaysDifference(targetDate) {
  if (!targetDate) return 0

  const now = new Date()

  // Calculate the difference in milliseconds
  const diffInMs = differenceInMilliseconds(now, targetDate)

  // Convert milliseconds to full days, ignoring any fraction of a day
  const days = Math.floor(diffInMs / (24 * 60 * 60 * 1000))

  return days
}

async function startDeviceInactiveRecurringNotification({}, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceOffline,
  })

  const issue = await knex('IssueType').where({ externalId: 'DeviceOffline' }).first().select('id')

  // Get all offline notification types
  const offlineNotificationTypes = await knex('NotificationType')
    .where({ issueTypeId: issue.id })
    .select('recurrenceFactor', 'daysInactive', 'issueTypeId')

  const devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin(
      knex
        .select('dms2.deviceId', knex.raw('MAX(dms2.id) as logId'))
        .from('DeviceMaintenanceStatusLog as dms2')
        .groupBy('dms2.deviceId')
        .as('latestDms'),
      'latestDms.deviceId',
      'd.id'
    )
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'dmsl.id', 'latestDms.logId')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dms.id', 'dmsl.deviceMaintenanceStatusId')
    .where('da.token', 'approved')
    .select(
      'd.id as deviceId',
      'dmsl.id as logId',
      'dmsl.day as lastReportedOn',
      'dms.externalId',
      'd.lastPingOn',
      'd.lastSeenOn'
    )
    .distinct('d.id')

  // Initialize storage for possible values and a set for tracking unique cron/days combinations
  const possibleValues = []
  const uniqueCombinations = new Set()

  // Iterate over each notification type that requires offline handling
  for (const type of offlineNotificationTypes) {
    // Convert recurrenceFactor to a number, defaulting to 0 if not specified
    const recurrenceFactor = Number(type.recurrenceFactor) || 0
    const issueTypeId = type.issueTypeId // Issue type identifier

    // Check if daysInactive is specified for the notification type
    if (type.daysInactive) {
      const daysInactive = type.daysInactive // Days until the issue is considered inactive

      // Calculate unique notification intervals based on the recurrence factor
      for (let i = 0; i <= recurrenceFactor; i++) {
        // Calculate total inactive days for the current iteration
        const notificationDaysInactive = (i + 1) * daysInactive

        // Create a unique identifier using recurrence factor and days inactive
        const identifier = `${recurrenceFactor}-${notificationDaysInactive}`

        if (!uniqueCombinations.has(identifier)) {
          possibleValues.push({ recurrenceFactor, notificationDaysInactive, offlineIssueType: issueTypeId })

          uniqueCombinations.add(identifier)
        }
      }
    }
  }

  for (const device of devices) {
    // Calculate the number of days since the device was last seen
    const lastSeenOnDiff = calculateDaysDifference(device.lastSeenOn) || 0

    // Calculate the number of days since the device last pinged
    const lastPingOnDiff = calculateDaysDifference(device.lastPingOn) || 0

    // Calculate the number of days since the last reported date of the device
    const lastReportedOnDiff = calculateDaysDifference(device.lastReportedOn) || 0

    // Determine the smallest number of days from the last seen, ping, and reported metrics
    const deviceInactiveDays = calculateMinimumDaysInactive(lastSeenOnDiff, lastPingOnDiff, lastReportedOnDiff)

    // find a notification setting that matches the device's inactive days
    const deviceNotificationMatch = possibleValues.find(value => value.notificationDaysInactive === deviceInactiveDays)

    if (deviceNotificationMatch) {
      const { recurrenceFactor, notificationDaysInactive, offlineIssueType } = deviceNotificationMatch
      context.deviceOffline(device.id, {
        deviceRecurrenceGroup: recurrenceFactor,
        notificationDaysInactive,
        offlineIssueType,
      })
    }
  }
}
module.exports = startDeviceInactiveRecurringNotification
