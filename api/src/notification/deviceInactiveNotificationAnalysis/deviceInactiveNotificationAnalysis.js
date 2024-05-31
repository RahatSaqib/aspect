const moment = require('moment')
const { knex } = require('../../db')
const { deviceOffline } = require('../../device/actions')
const { issueTypeToId } = require('../../shared/dictionary')

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
const calculateDaysDifference = targetDate => {
  if (!targetDate) return 0
  // Parse the given time as a moment object in UTC
  const parsedGivenTime = moment.utc(targetDate)

  // Get the current time in UTC
  const currentTimeInUTC = moment.utc()

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = currentTimeInUTC.diff(parsedGivenTime)

  // Convert the difference to a duration object
  const duration = moment.duration(differenceInMilliseconds)

  // Return the difference in days
  return Math.floor(duration.asDays())
}

async function startDeviceInactiveRecurringNotification(_, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceOffline,
  })

  const deviceOfflineIssue = await issueTypeToId('DeviceOffline')

  const issue = await knex('IssueType').where({ id: deviceOfflineIssue }).first().select('id')

  // Get all offline notification types
  const offlineNotificationTypes = await knex('NotificationType')
    .where({ issueTypeId: issue.id })
    .select('recurrenceFactor', 'daysInactive', 'issueTypeId')

  const devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin(
      knex('DeviceMaintenanceStatusLog as dms2')
        .select('dms2.deviceId', knex.raw('MAX(dms2.id) as logId'))
        .groupBy('dms2.deviceId')
        .as('latestDms'),
      'latestDms.deviceId',
      'd.id'
    )
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'dmsl.id', 'latestDms.logId')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dms.id', 'dmsl.deviceMaintenanceStatusId')
    .where('da.token', 'approved')
    // .where('d.id', 39)
    .select(
      'd.id',
      knex.raw('MAX(CASE WHEN dms.externalId = ? THEN dmsl.createdOn ELSE NULL END) as lastReportedOn', [
        'reportedActive',
      ]),
      'd.lastPingOn'
    )
    .groupBy('d.id')

  // Initialize storage for possible values and a set for tracking unique cron/days combinations
  const possibleValues = []
  const uniqueCombinations = new Set()

  // Iterate over each notification type that requires offline handling
  for (const type of offlineNotificationTypes) {
    // Convert recurrenceFactor to a number, defaulting to 0 if not specified
    const recurrenceFactor = Number(type.recurrenceFactor) || 0
    const { issueTypeId } = type // Issue type identifier

    // Check if daysInactive is specified for the notification type
    if (type.daysInactive) {
      const { daysInactive } = type // Days until the issue is considered inactive

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
    const lastSeenOnDiff = calculateDaysDifference(device.lastPingOn) || 0

    // Calculate the number of days since the last reported date of the device
    const lastReportedOnDiff = calculateDaysDifference(device.lastReportedOn) || 0

    // Determine the smallest number of days from the last seen, ping, and reported metrics
    const deviceInactiveDays = calculateMinimumDaysInactive(lastSeenOnDiff, lastReportedOnDiff)

    // find a notification setting that matches the device's inactive days
    const deviceNotificationMatch = possibleValues.find(value => value.notificationDaysInactive === deviceInactiveDays)

    if (deviceNotificationMatch) {
      const { recurrenceFactor, notificationDaysInactive, offlineIssueType } = deviceNotificationMatch
      context.deviceOffline(device.id, {
        lastSeenOn: device.lastSeenOn,
        lastPingOn: device.lastPingOn,
        deviceRecurrenceGroup: recurrenceFactor,
        notificationDaysInactive,
        offlineIssueType,
      })
    }
  }
}
module.exports = startDeviceInactiveRecurringNotification
