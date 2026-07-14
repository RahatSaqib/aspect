const { expect } = require('chai')
const sinon = require('sinon')
const {
  applyGeographyFilterIncludingUndeployed,
  applyUndeployedDevicesResultFilter,
  getUndeployedDevicesPartnerQueryOptions,
  getResultListConstraintOptions,
  isShowUndeployedDevices,
  withUndeployedAwareGeographyFilters,
} = require('../../src/result/common/undeployedDevicesFilter')

describe('undeployedDevicesFilter', () => {
  describe('isShowUndeployedDevices', () => {
    it('recognizes truthy query values', () => {
      expect(isShowUndeployedDevices({ showUndeployedDevices: true })).to.equal(true)
      expect(isShowUndeployedDevices({ showUndeployedDevices: 'true' })).to.equal(true)
      expect(isShowUndeployedDevices({ showUndeployedDevices: 1 })).to.equal(true)
    })

    it('recognizes falsy query values', () => {
      expect(isShowUndeployedDevices({})).to.equal(false)
      expect(isShowUndeployedDevices({ showUndeployedDevices: false })).to.equal(false)
      expect(isShowUndeployedDevices({ showUndeployedDevices: 'false' })).to.equal(false)
    })
  })

  describe('applyUndeployedDevicesResultFilter', () => {
    it('excludes null siteId results when showUndeployedDevices is false', () => {
      const queryBuilder = { whereNotNull: sinon.spy() }
      applyUndeployedDevicesResultFilter(queryBuilder, {})
      expect(queryBuilder.whereNotNull.calledOnceWith('r.siteId')).to.equal(true)
    })

    it('does not exclude null siteId results when showUndeployedDevices is true', () => {
      const queryBuilder = { whereNotNull: sinon.spy() }
      applyUndeployedDevicesResultFilter(queryBuilder, { showUndeployedDevices: true })
      expect(queryBuilder.whereNotNull.called).to.equal(false)
    })
  })

  describe('getUndeployedDevicesPartnerQueryOptions', () => {
    it('returns showUndeployedDevices as boolean', () => {
      expect(getUndeployedDevicesPartnerQueryOptions({})).to.deep.equal({ showUndeployedDevices: false })
      expect(getUndeployedDevicesPartnerQueryOptions({ showUndeployedDevices: true })).to.deep.equal({
        showUndeployedDevices: true,
      })
    })
  })

  describe('getResultListConstraintOptions', () => {
    it('includes undeployed devices without touching decommissioned when only undeployed is requested', () => {
      expect(getResultListConstraintOptions({ showUndeployedDevices: true })).to.deep.equal({
        displayResult: 'actual',
        showUndeployedDevices: true,
        showDecommissionedDevices: false,
      })
    })

    it('keeps undeployed and decommissioned independent', () => {
      expect(
        getResultListConstraintOptions({
          showUndeployedDevices: false,
          showDecommissionedDevices: true,
          displayResult: 'all',
        })
      ).to.deep.equal({
        displayResult: 'all',
        showUndeployedDevices: false,
        showDecommissionedDevices: true,
      })
    })
  })

  describe('withUndeployedAwareGeographyFilters', () => {
    it('wraps geography filters when undeployed devices are requested', () => {
      const filters = withUndeployedAwareGeographyFilters(
        { countryId: 'g.countryId', deviceId: 'd.id' },
        {
          showUndeployedDevices: true,
        }
      )

      expect(typeof filters.countryId).to.equal('function')
      expect(filters.deviceId).to.equal('d.id')
    })

    it('leaves filters unchanged when undeployed devices are not requested', () => {
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
