const { expect } = require('chai')
const moment = require('moment')
const {
  calculateDaysDifference,
  calculateMinimumDaysInactive,
} = require('../../src/notification/deviceInactiveNotificationAnalysis/utils')

describe('Utility Functions', () => {
  describe('calculateMinimumDaysInactive', () => {
    it('should return the smallest non-zero value', () => {
      const result = calculateMinimumDaysInactive(5, 0, 3, 7)
      expect(result).to.equal(3)
    })

    it('should return 0 if all values are zero', () => {
      const result = calculateMinimumDaysInactive(0, 0, 0)
      expect(result).to.equal(0)
    })

    it('should handle a single non-zero value correctly', () => {
      const result = calculateMinimumDaysInactive(10)
      expect(result).to.equal(10)
    })

    it('should handle a mix of zero and non-zero values correctly', () => {
      const result = calculateMinimumDaysInactive(0, 8, 0, 5)
      expect(result).to.equal(5)
    })

    it('should return the minimum value if all are non-zero', () => {
      const result = calculateMinimumDaysInactive(5, 3, 9, 7)
      expect(result).to.equal(3)
    })
  })

  describe('calculateDaysDifference', () => {
    it('should return the number of full days difference between current date and target date', () => {
      const targetDate = moment.utc().subtract(5, 'days').toDate()
      const result = calculateDaysDifference(targetDate)
      expect(result).to.be.at.least(5)
    })

    it('should return 0 if the target date is not provided', () => {
      const result = calculateDaysDifference()
      expect(result).to.equal(0)
    })

    it('should return 0 if the target date is null', () => {
      const result = calculateDaysDifference(null)
      expect(result).to.equal(0)
    })

    it('should return the correct difference for past dates', () => {
      const targetDate = moment.utc().subtract(10, 'days').toDate()
      const result = calculateDaysDifference(targetDate)
      expect(result).to.be.at.least(10)
    })

    it('should return 0 for the current date', () => {
      const targetDate = moment.utc().toDate()
      const result = calculateDaysDifference(targetDate)
      expect(result).to.equal(0)
    })
  })
})
