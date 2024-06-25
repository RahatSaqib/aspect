const moment = require('moment')

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

module.exports = {
  calculateDaysDifference,
  calculateMinimumDaysInactive,
}
