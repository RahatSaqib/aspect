const chai = require('chai')
const { subDays, subMonths } = require('date-fns')
const { knex } = require('../../src/db')
const { assignMobileAppSpot } = require('../../src/mobileApi/config/common/assignMobileAppSpot')
const server = require('../utils/testUtils')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const { expect, assert } = chai

describe('Mobile App Spot Assignment Priority Tests', () => {
  const testUserId = 1
  const testTimezone = 'America/New_York'

  // Helper function to set up test data by updating existing seeded records
  const setupTestData = async (updates, options = {}) => {
    // Clean up any previous test data first
    await cleanupTestData()

    // Apply the test updates to specific deviceAppSpot records
    const updatePromises = updates.map(update =>
      knex('MobileDevice').where('deviceAppSpot', update.deviceAppSpot).update(update)
    )
    await Promise.all(updatePromises)

    // If options.assignMostRecords is true, assign device codes to most records
    // leaving only the specified test records available
    if (options.assignMostRecords) {
      const testSpots = updates.map(u => u.deviceAppSpot)
      await knex('MobileDevice').whereNotIn('deviceAppSpot', testSpots).update({
        deviceCode: 'OCCUPIED-DEVICE',
        active: true,
        createdBy: testUserId,
        createdOn: new Date(),
        updatedBy: testUserId,
        updatedOn: new Date(),
      })
    }
  }

  // Helper function to create test sample records
  const createTestSamples = async samples => {
    await knex('Sample').insert(samples)
  }

  // Helper function to clean up test data
  const cleanupTestData = async () => {
    // Delete any test Sample records we created
    await knex('Sample').where('externalId', 'like', 'TEST-%').delete()
    // Also clean up samples with the pattern used in tests (XXX-XXXXXX-XXX)
    await knex('Sample').where('externalId', 'regexp', '^\\d{3}-\\d{6}-\\d{3}$').delete()
    // Clean up samples with invalid patterns used in tests
    await knex('Sample').whereIn('externalId', ['001-invalid-format', 'not-numeric-001']).delete()

    // Reset ALL MobileDevice records back to their original seeded state
    await knex('MobileDevice').update({
      deviceCode: null,
      active: false,
      createdBy: null,
      createdOn: null,
      updatedBy: null,
      updatedOn: null,
    })
  }

  afterEach(async () => {
    await run(async () => {
      await cleanupTestData()
    })
  })

  describe('Priority 1: Unassigned records (no deviceCode)', () => {
    it('should assign the first unassigned record when multiple are available', async () => {
      // Set up test data by updating existing seeded records
      await setupTestData([
        { deviceAppSpot: '001', deviceCode: null, active: false, updatedOn: subDays(new Date(), 5) },
        { deviceAppSpot: '002', deviceCode: null, active: false, updatedOn: subDays(new Date(), 3) },
        { deviceAppSpot: '003', deviceCode: null, active: false, updatedOn: subDays(new Date(), 1) },
      ])

      const result = await assignMobileAppSpot('TEST-DEVICE-001', testUserId, testTimezone)

      expect(result).to.have.property('appId')

      // Should assign the first available unassigned record (null updatedOn has priority)
      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-001').first()

      expect(assignedDevice.deviceCode).to.equal('TEST-DEVICE-001') // Should assign to the test device
      expect(assignedDevice.deviceAppSpot).to.match(/^\d{3}$/) // Should assign some 3-digit spot
      expect(assignedDevice.active).to.equal(1) // MySQL returns 1 for true
    })

    it('should prefer unassigned records over inactive assigned records', async () => {
      await setupTestData(
        [
          { deviceAppSpot: '001', deviceCode: 'OLD-DEVICE', active: false, updatedOn: subDays(new Date(), 10) },
          { deviceAppSpot: '002', deviceCode: null, active: false, updatedOn: subDays(new Date(), 1) },
        ],
        { assignMostRecords: true }
      )

      const spot = await assignMobileAppSpot('TEST-DEVICE-002', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '002' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-002').first()

      expect(assignedDevice.deviceCode).to.equal('TEST-DEVICE-002') // Should assign to the test device
      expect(assignedDevice.deviceAppSpot).to.match(/^\d{3}$/) // Should assign some unassigned spot
    })
  })

  describe('Priority 2: Oldest inactive records (active = false, ordered by updatedOn)', () => {
    it('should assign oldest inactive record when no unassigned records are available', async () => {
      await setupTestData(
        [
          { deviceAppSpot: '001', deviceCode: 'DEVICE-A', active: false, updatedOn: subDays(new Date(), 10) },
          { deviceAppSpot: '002', deviceCode: 'DEVICE-B', active: false, updatedOn: subDays(new Date(), 5) },
          { deviceAppSpot: '003', deviceCode: 'DEVICE-C', active: true, updatedOn: subMonths(new Date(), 6) },
        ],
        { assignMostRecords: true }
      )

      const spot = await assignMobileAppSpot('TEST-DEVICE-003', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '001' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-003').first()

      expect(assignedDevice.deviceAppSpot).to.equal('001') // Oldest inactive record
      expect(assignedDevice.active).to.equal(1)
    })

    it('should order inactive records by updatedOn correctly', async () => {
      await setupTestData(
        [
          { deviceAppSpot: '001', deviceCode: 'DEVICE-A', active: false, updatedOn: subDays(new Date(), 1) },
          { deviceAppSpot: '002', deviceCode: 'DEVICE-B', active: false, updatedOn: subDays(new Date(), 20) },
          { deviceAppSpot: '003', deviceCode: 'DEVICE-C', active: false, updatedOn: subDays(new Date(), 10) },
        ],
        { assignMostRecords: true }
      )

      const spot = await assignMobileAppSpot('TEST-DEVICE-004', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '002' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-004').first()

      expect(assignedDevice.deviceAppSpot).to.equal('002') // Oldest by updatedOn (20 days ago)
    })
  })

  describe('Priority 3: Oldest active records older than 3 months without informing Samples', () => {
    it('should assign oldest active record older than 3 months when no inactive records available', async () => {
      const fourMonthsAgo = subMonths(new Date(), 4)
      const fiveMonthsAgo = subMonths(new Date(), 5)

      const testDevices = [
        { deviceAppSpot: '001', deviceCode: 'DEVICE-A', active: true, updatedOn: fourMonthsAgo },
        { deviceAppSpot: '002', deviceCode: 'DEVICE-B', active: true, updatedOn: fiveMonthsAgo },
        { deviceAppSpot: '003', deviceCode: 'DEVICE-C', active: true, updatedOn: subDays(new Date(), 30) }, // Less than 3 months
      ]
      await setupTestData(testDevices, { assignMostRecords: true })

      const spot = await assignMobileAppSpot('TEST-DEVICE-005', testUserId, testTimezone)
      expect(spot).to.deep.equal({ appId: '002' })
      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-005').first()

      expect(assignedDevice.deviceAppSpot).to.equal('002') // Oldest (5 months ago)
      expect(assignedDevice.active).to.equal(1)
    })

    it('should not assign active records newer than 3 months', async () => {
      const testDevices = [
        { deviceAppSpot: '000', deviceCode: 'DEVICE-qa', active: true, updatedOn: subDays(new Date(), 30) },
        { deviceAppSpot: '001', deviceCode: 'DEVICE-A', active: true, updatedOn: subDays(new Date(), 30) },
        { deviceAppSpot: '002', deviceCode: 'DEVICE-B', active: true, updatedOn: subDays(new Date(), 60) },
        { deviceAppSpot: '003', deviceCode: 'DEVICE-J', active: true, updatedOn: subDays(new Date(), 300) },
      ]
      await setupTestData(testDevices, { assignMostRecords: true })

      const spot = await assignMobileAppSpot('TEST-DEVICE-006', testUserId, testTimezone)
      expect(spot).to.deep.equal({ appId: '003' })
    })
  })

  describe('Sample exclusion: Skip spots that have informed Samples today', () => {
    it('should skip spots that have been used in samples created today', async () => {
      const today = new Date()
      const yesterday = subDays(new Date(), 1)

      await setupTestData(
        [
          { deviceAppSpot: '001', deviceCode: null, active: false, updatedOn: subDays(new Date(), 5) },
          { deviceAppSpot: '002', deviceCode: null, active: false, updatedOn: subDays(new Date(), 3) },
        ],
        { assignMostRecords: true }
      )

      // Create a sample that uses deviceAppSpot '001' today
      const testSamples = [
        {
          externalId: '001-240910-001', // Uses deviceAppSpot '001'
          createdOn: today,
          updatedOn: today,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
        {
          externalId: '002-240909-001', // Uses deviceAppSpot '002' but yesterday
          createdOn: yesterday,
          updatedOn: yesterday,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
      ]
      await createTestSamples(testSamples)

      const spot = await assignMobileAppSpot('TEST-DEVICE-007', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '002' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-007').first()

      // Should assign '002' since '001' was used today
      expect(assignedDevice.deviceAppSpot).to.equal('002')
    })

    it('should allow assignment to spots used in samples from previous days', async () => {
      const yesterday = subDays(new Date(), 1)

      await setupTestData(
        [{ deviceAppSpot: '001', deviceCode: null, active: false, updatedOn: subDays(new Date(), 5) }],
        { assignMostRecords: true }
      )

      // Create a sample that uses deviceAppSpot '001' yesterday
      const testSamples = [
        {
          externalId: '001-240909-001',
          createdOn: yesterday,
          updatedOn: yesterday,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
      ]
      await createTestSamples(testSamples)

      const spot = await assignMobileAppSpot('TEST-DEVICE-008', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '001' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-008').first()

      // Should assign '001' since it was only used yesterday
      expect(assignedDevice.deviceAppSpot).to.equal('001')
    })

    it('should only exclude samples with correct externalId pattern', async () => {
      const today = new Date()

      await setupTestData(
        [{ deviceAppSpot: '001', deviceCode: null, active: false, updatedOn: subDays(new Date(), 5) }],
        { assignMostRecords: true }
      )

      // Create samples with various externalId patterns
      const testSamples = [
        {
          externalId: '001-invalid-format', // Incorrect pattern
          createdOn: today,
          updatedOn: today,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
        {
          externalId: 'not-numeric-001', // Incorrect pattern
          createdOn: today,
          updatedOn: today,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
      ]
      await createTestSamples(testSamples)

      const spot = await assignMobileAppSpot('TEST-DEVICE-009', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '001' })

      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'TEST-DEVICE-009').first()

      // Should assign '001' since the samples don't match the required pattern
      expect(assignedDevice.deviceAppSpot).to.equal('001')
    })
  })

  describe('Device reassignment and deactivation', () => {
    it('should deactivate existing assignment when reassigning the same deviceCode', async () => {
      await setupTestData(
        [
          { deviceAppSpot: '001', deviceCode: 'DEVICE-X', active: true, updatedOn: subDays(new Date(), 5) },
          { deviceAppSpot: '002', deviceCode: null, active: false, updatedOn: subDays(new Date(), 3) },
        ],
        { assignMostRecords: true }
      )

      // Reassign the same device code
      const spot = await assignMobileAppSpot('DEVICE-X', testUserId, testTimezone)

      expect(spot).to.deep.equal({ appId: '002' })

      // Old assignment should be deactivated
      const oldAssignment = await knex('MobileDevice').where('deviceAppSpot', '001').first()
      expect(oldAssignment.active).to.equal(0)
      expect(oldAssignment.deviceCode).to.equal('DEVICE-X') // Still has the device code but inactive

      // New assignment should be active
      const newAssignment = await knex('MobileDevice').where('deviceCode', 'DEVICE-X').where('active', true).first()
      expect(newAssignment.deviceAppSpot).to.equal('002')
      expect(newAssignment.active).to.equal(1)
    })
  })

  describe('Error conditions', () => {
    it('should throw error when deviceCode is missing', async () => {
      try {
        await assignMobileAppSpot(null, testUserId, testTimezone)
        assert.fail('Should have thrown an error for missing device code')
      } catch (error) {
        expect(error.message).to.equal('Missing device code')
      }
    })
  })

  describe('Integration with API endpoint', () => {
    const path = '/mobile/api/v4/config/retrieve-app-id'

    before(() => {
      shared.checkToken(server, path)
    })

    beforeEach(async () => {
      // Setup basic test data
      await setupTestData([
        { deviceAppSpot: '001', deviceCode: null, active: false, updatedOn: subDays(new Date(), 5) },
        { deviceAppSpot: '002', deviceCode: 'OLD-DEVICE', active: false, updatedOn: subDays(new Date(), 10) },
      ])
    })

    it('should return the correct appId following priority rules via API', async () => {
      const response = await server
        .get(path)
        .set('api-version', '4')
        .set('Authorization', `Bearer ${shared.token}`)
        .query({ deviceCode: 'API-TEST-DEVICE' })

      const firstAvailableSpot = await knex('MobileDevice').first('deviceAppSpot as appId').orderBy('id', 'asc')

      expect(response.status).to.equal(200)
      expect(response.body).to.have.property('ok', true)
      expect(response.body.data).to.have.property('appId', firstAvailableSpot.appId) // Should pick record with NULL updatedOn

      // Verify database state
      const assignedDevice = await knex('MobileDevice').where('deviceCode', 'API-TEST-DEVICE').first()
      expect(assignedDevice.deviceAppSpot).to.equal(firstAvailableSpot.appId)
      expect(assignedDevice.active).to.equal(1)
    })
  })
})
