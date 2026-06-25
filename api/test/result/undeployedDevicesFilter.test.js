const { expect } = require('chai')
const sinon = require('sinon')
const {
  applyGeographyFilterIncludingUndeployed,
  applyShowResultsFromUndeployedDevicesFilter,
  getUndeployedDevicesPartnerQueryOptions,
  getResultListConstraintOptions,
  isShowResultsFromUndeployedDevices,
  withUndeployedAwareGeographyFilters,
} = require('../../src/result/common/undeployedDevicesFilter')

describe('undeployedDevicesFilter', () => {
  describe('isShowResultsFromUndeployedDevices', () => {
    it('recognizes truthy query values', () => {
      expect(isShowResultsFromUndeployedDevices({ showResultsFromUndeployedDevices: true })).to.equal(true)
      expect(isShowResultsFromUndeployedDevices({ showResultsFromUndeployedDevices: 'true' })).to.equal(true)
      expect(isShowResultsFromUndeployedDevices({ showResultsFromUndeployedDevices: 1 })).to.equal(true)
    })

    it('recognizes falsy query values', () => {
      expect(isShowResultsFromUndeployedDevices({})).to.equal(false)
      expect(isShowResultsFromUndeployedDevices({ showResultsFromUndeployedDevices: false })).to.equal(false)
      expect(isShowResultsFromUndeployedDevices({ showResultsFromUndeployedDevices: 'false' })).to.equal(false)
    })
  })

  describe('applyShowResultsFromUndeployedDevicesFilter', () => {
    it('excludes null siteId results when showResultsFromUndeployedDevices is false', () => {
      const queryBuilder = { whereNotNull: sinon.spy() }
      applyShowResultsFromUndeployedDevicesFilter(queryBuilder, {})
      expect(queryBuilder.whereNotNull.calledOnceWith('r.siteId')).to.equal(true)
    })

    it('does not exclude null siteId results when showResultsFromUndeployedDevices is true', () => {
      const queryBuilder = { whereNotNull: sinon.spy() }
      applyShowResultsFromUndeployedDevicesFilter(queryBuilder, { showResultsFromUndeployedDevices: true })
      expect(queryBuilder.whereNotNull.called).to.equal(false)
    })
  })

  describe('getUndeployedDevicesPartnerQueryOptions', () => {
    it('returns showResultsFromUndeployedDevices as boolean', () => {
      expect(getUndeployedDevicesPartnerQueryOptions({})).to.deep.equal({ showResultsFromUndeployedDevices: false })
      expect(getUndeployedDevicesPartnerQueryOptions({ showResultsFromUndeployedDevices: true })).to.deep.equal({
        showResultsFromUndeployedDevices: true,
      })
    })
  })

  describe('getResultListConstraintOptions', () => {
    it('includes unapproved and decommissioned devices when undeployed results are requested', () => {
      expect(getResultListConstraintOptions({ showResultsFromUndeployedDevices: true })).to.deep.equal({
        displayResult: 'actual',
        showUnapprovedDevices: true,
        showDecommissionedDevices: true,
      })
    })

    it('respects explicit device visibility flags when undeployed results are not requested', () => {
      expect(
        getResultListConstraintOptions({
          showUnapprovedDevices: true,
          showDecommissionedDevices: false,
          displayResult: 'all',
        })
      ).to.deep.equal({
        displayResult: 'all',
        showUnapprovedDevices: true,
        showDecommissionedDevices: false,
      })
    })
  })

  describe('withUndeployedAwareGeographyFilters', () => {
    it('wraps geography filters when undeployed results are requested', () => {
      const filters = withUndeployedAwareGeographyFilters(
        { countryId: 'g.countryId', deviceId: 'd.id' },
        {
          showResultsFromUndeployedDevices: true,
        }
      )

      expect(typeof filters.countryId).to.equal('function')
      expect(filters.deviceId).to.equal('d.id')
    })

    it('leaves filters unchanged when undeployed results are not requested', () => {
      const filters = withUndeployedAwareGeographyFilters({ countryId: 'g.countryId' }, {})

      expect(filters.countryId).to.equal('g.countryId')
    })
  })

  describe('applyGeographyFilterIncludingUndeployed', () => {
    it('allows null siteId results to match geography filters', () => {
      const orWhereNull = sinon.spy()
      const queryBuilder = {
        where: callback => {
          const qb = {
            where: () => qb,
            orWhereNull,
          }
          callback(qb)
          return queryBuilder
        },
      }

      applyGeographyFilterIncludingUndeployed(queryBuilder, 'g.countryId', 1)

      expect(orWhereNull.calledOnceWith('r.siteId')).to.equal(true)
    })
  })
})
