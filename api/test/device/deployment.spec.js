const chai = require('chai')
const { addDays, format, subHours } = require('date-fns')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { resultSourceToId, resultTypeToId, resultCategoryToId, sampleTypeToId } = require('../../src/shared/dictionary')

const { assert } = chai

async function cleanupDeploymentTestDevice(knex, deviceId) {
  if (!deviceId) return
  await knex('Deployment').where({ deviceId }).del()
  await knex('FactDeviceFlag').where({ deviceId }).del()
  await knex('FactDeviceModulesCount').where({ deviceId }).del()
  await knex('Instrument').where({ deviceId }).del()
  await knex('Device').where({ id: deviceId }).del()
}

const path = '/api/device'

describe('Deployment endpoints', () => {
  let deviceId
  let siteId
  let refDevice

  before(async () => {
    shared.checkToken(server, path)
    const device = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .whereNotNull('d.siteId')
      .first('d.id as deviceId', 'd.siteId as siteId')
    assert(device, 'Seed data should have at least one device with a site')
    deviceId = device.deviceId
    siteId = device.siteId
    refDevice = await knex('Device')
      .where({ id: deviceId })
      .first('partnerId', 'siteId', 'deviceTypeId', 'deviceApprovalId')
  })

  describe('POST /device/{deviceId}/deployments/check-results', () => {
    const checkResultsPath = (id = deviceId) => `${path}/${id}/deployments/check-results`

    it('should return 200 and moves/gaps when payload is valid', async () => {
      const deployments = [
        { siteId, start: null, end: format(addDays(new Date(), 30), 'yyyy-MM-dd') },
        { siteId, start: format(addDays(new Date(), 31), 'yyyy-MM-dd'), end: null },
      ]
      const res = await server
        .post(checkResultsPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({ deployments })

      assert.equal(res.status, 200)
      assert.isTrue(res.body.ok)
      assert.property(res.body, 'data')
      assert.property(res.body.data, 'moves')
      assert.property(res.body.data, 'gaps')
      assert.isArray(res.body.data.moves)
      assert.isArray(res.body.data.gaps)
      res.body.data.moves.forEach(m => {
        assert.property(m, 'siteId')
        assert.property(m, 'siteName')
        assert.property(m, 'resultCount')
      })
    })

    it('should return 200 with empty moves when deployments match current result sites', async () => {
      const deployments = [{ siteId, start: null, end: null }]
      const res = await server
        .post(checkResultsPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({ deployments })

      assert.equal(res.status, 200)
      assert.isTrue(res.body.ok)
      assert.isArray(res.body.data.moves)
      assert.isArray(res.body.data.gaps)
    })

    it('should return 400 when deployments is missing', async () => {
      const res = await server.post(checkResultsPath()).set('Authorization', `Bearer ${shared.token}`).send({})

      assert.equal(res.status, 400)
    })

    it('should return 400 when deployments is not an array', async () => {
      const res = await server
        .post(checkResultsPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({ deployments: 'not-an-array' })

      assert.equal(res.status, 400)
    })

    it('should return 400 when a deployment item misses required siteId', async () => {
      const res = await server
        .post(checkResultsPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({ deployments: [{ start: null, end: null }] })

      assert.equal(res.status, 400)
    })
  })

  describe('POST /device/{deviceId}/deployments/persist', () => {
    const persistPath = (id = deviceId) => `${path}/${id}/deployments/persist`

    it('should return 200 when adding a single deployment to a device with no deployments', async () => {
      const deviceNoDeployments = await knex('Device as d')
        .leftJoin('Deployment as dep', 'dep.deviceId', 'd.id')
        .whereNotNull('d.siteId')
        .groupBy('d.id')
        .having(knex.raw('COUNT(dep.id) = 0'))
        .first('d.id as deviceId', 'd.siteId as siteId')
      if (!deviceNoDeployments) {
        // All devices have deployments (e.g. from seed); skip or use a device we clean up
        return
      }
      const { deviceId: id, siteId: sid } = deviceNoDeployments
      const res = await server
        .post(persistPath(id))
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          changes: [{ action: 'add', siteId: sid, start: null, end: null }],
        })

      assert.equal(res.status, 200)
      assert.isTrue(res.body.ok)

      await knex('Deployment').where({ deviceId: id }).del()
    })

    describe('when updating an existing deployment', () => {
      let deploymentTestDeviceId

      beforeEach(async () => {
        const [newDeviceId] = await knex('Device').insert({
          partnerId: refDevice.partnerId,
          siteId: refDevice.siteId,
          deviceTypeId: refDevice.deviceTypeId,
          deviceApprovalId: refDevice.deviceApprovalId,
          name: 'Deployment Test Device',
          shortName: 'Deployment Test Device',
          lastSeenOn: new Date(),
        })
        deploymentTestDeviceId = newDeviceId
        await knex('FactDeviceFlag').insert({ deviceId: newDeviceId, updatedOn: new Date() })

        const addRes = await server
          .post(persistPath(deploymentTestDeviceId))
          .set('Authorization', `Bearer ${shared.token}`)
          .send({
            changes: [{ action: 'add', siteId: refDevice.siteId, start: null, end: null }],
          })
        assert.equal(addRes.status, 200, 'Setup: add deployment should succeed')
      })

      afterEach(async () => {
        await cleanupDeploymentTestDevice(knex, deploymentTestDeviceId)
      })

      it('should return 200 when updating an existing deployment (valid date range)', async () => {
        const deployment = await knex('Deployment')
          .where({ deviceId: deploymentTestDeviceId })
          .first('id', 'siteId', 'start', 'end')
        assert(deployment, 'Setup should have created one deployment')

        const startStr = deployment.start && format(new Date(deployment.start), 'yyyy-MM-dd')
        const endStr = deployment.end && format(new Date(deployment.end), 'yyyy-MM-dd')
        const res = await server
          .post(persistPath(deploymentTestDeviceId))
          .set('Authorization', `Bearer ${shared.token}`)
          .send({
            changes: [{ action: 'update', id: deployment.id, siteId: deployment.siteId, start: startStr, end: endStr }],
          })
        assert.equal(res.status, 200)
        assert.isTrue(res.body.ok)
      })

      it('should set Result.siteId and Device.siteId to deployment site after persist', async () => {
        const deployment = await knex('Deployment')
          .where({ deviceId: deploymentTestDeviceId })
          .first('id', 'siteId', 'start', 'end')
        assert(deployment, 'Setup should have created one deployment')

        const now = new Date()
        const admin = await knex('User').where({ name: 'admin' }).first('id')
        const assay = await knex('Assay').where({ externalId: 'GxMtbRif' }).first('id')
        const resultSourceId = await resultSourceToId('DiagnosticDevice')
        const resultTypeId = await resultTypeToId('Patient')
        const sampleTypeId = await sampleTypeToId('DBS')
        const resultCategoryId = await resultCategoryToId('NoResult')

        const [sampleId] = await knex('Sample').insert({
          externalId: `Deployment test sample ${now.getTime()}`,
          collectedOn: now,
          sampleTypeId,
          originSiteId: refDevice.siteId,
        })

        const [resultId] = await knex('Result').insert({
          createdOn: now,
          createdBy: admin.id,
          updatedOn: now,
          updatedBy: admin.id,
          externalId: `Deployment test result ${now.getTime()}`,
          assayId: assay.id,
          partnerId: refDevice.partnerId,
          siteId: null,
          deviceId: deploymentTestDeviceId,
          reportableSiteId: refDevice.siteId,
          resultSourceId,
          resultTypeId,
          sampleId,
          resultCategory1: resultCategoryId,
          resultCategory2: resultCategoryId,
          startedOn: subHours(now, 2),
          endedOn: now,
        })

        try {
          const startStr = deployment.start && format(new Date(deployment.start), 'yyyy-MM-dd')
          const endStr = deployment.end && format(new Date(deployment.end), 'yyyy-MM-dd')
          const res = await server
            .post(persistPath(deploymentTestDeviceId))
            .set('Authorization', `Bearer ${shared.token}`)
            .send({
              changes: [
                { action: 'update', id: deployment.id, siteId: deployment.siteId, start: startStr, end: endStr },
              ],
            })
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)

          const resultRow = await knex('Result').where({ id: resultId }).first('siteId')
          assert.equal(resultRow.siteId, deployment.siteId, 'Result.siteId should match deployment site after persist')

          const deviceRow = await knex('Device').where({ id: deploymentTestDeviceId }).first('siteId')
          assert.equal(
            deviceRow.siteId,
            deployment.siteId,
            'Device.siteId should match active deployment site after persist'
          )
        } finally {
          await knex('Result').where({ id: resultId }).del()
          await knex('Sample').where({ id: sampleId }).del()
        }
      })
    })

    it('should return 400 when changes is missing', async () => {
      const res = await server.post(persistPath()).set('Authorization', `Bearer ${shared.token}`).send({})

      assert.equal(res.status, 400)
    })

    it('should return 400 when changes is empty array', async () => {
      const res = await server.post(persistPath()).set('Authorization', `Bearer ${shared.token}`).send({ changes: [] })

      assert.equal(res.status, 400)
    })

    it('should return 400 when change has invalid action', async () => {
      const res = await server
        .post(persistPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          changes: [{ action: 'invalid', siteId, start: null, end: null }],
        })

      assert.equal(res.status, 400)
    })

    it('should return 409 when two deployments have null start (invariant: exactly one)', async () => {
      const deployments = await knex('Deployment').where({ deviceId }).orderBy('start', 'asc')
      if (deployments.length < 2) return
      const second = deployments[1]
      const siteIdSecond = second.siteId

      const res = await server
        .post(persistPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          changes: [
            {
              action: 'update',
              id: second.id,
              siteId: siteIdSecond,
              start: null,
              end: second.end && format(new Date(second.end), 'yyyy-MM-dd'),
            },
          ],
        })

      assert.equal(res.status, 409)
      assert.include((res.body.message || '').toLowerCase(), 'start date')
    })

    it('should return 409 when end date is before start date', async () => {
      const deployment = await knex('Deployment').where({ deviceId }).whereNotNull('start').first('id', 'siteId')
      if (!deployment) return

      const res = await server
        .post(persistPath())
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          changes: [
            {
              action: 'update',
              id: deployment.id,
              siteId: deployment.siteId,
              start: '2025-06-01',
              end: '2025-05-01',
            },
          ],
        })

      assert.equal(res.status, 409)
      assert.include((res.body.message || '').toLowerCase(), 'before')
    })
  })
})
