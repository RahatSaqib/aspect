const _ = require('lodash')
const chai = require('chai')

const { createGxConnectTestContext } = require('./geneXpert/gxconnect_utils')
const { basicResultPayload } = require('./geneXpert/geneXpertConstants')
const { run } = require('../../src/db')
const server = require('../utils/testUtils')

const { assert } = chai

describe('Device API deployment behavior', () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'

  it('should create an active deployment from the DAK site when a result creates a new device', () =>
    run(async knex => {
      const resultContext = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName: `${deviceName} Result Created`,
        macAddress: 'MACRESULTCREATE001',
        deviceSerialNumber: 'Cepheid-PC-RESULT-001',
        instrumentSerial: null,
      })

      try {
        await resultContext.requestNewApiKey()

        const deviceApiKey = await knex('DeviceApiKey').where({ token: resultContext.apiKey }).first('id', 'partnerId')
        const site = await knex('Site as s')
          .join('Geography as g', 'g.id', 's.geographyId')
          .where('s.partnerId', deviceApiKey.partnerId)
          .first('s.id', 's.geographyId')

        assert.isOk(site, 'Expected a site for the partner used by the device API key')

        await knex('DeviceApiKey')
          .where({ id: deviceApiKey.id })
          .update({ siteId: site.id, geographyId: site.geographyId })

        const response = await server
          .post('/device')
          .set('Authorization', resultContext.deviceAuth)
          .send(
            _.merge({}, resultContext.basicDevicePayload, basicResultPayload, {
              name: `${deviceName} Result Created ${Date.now()}`,
              result: {
                id: `result-created-device-${Date.now()}`,
                startedOn: new Date(),
                sample: { id: `sample-created-device-${Date.now()}` },
                instrument: { serial: `inst-${Date.now()}` },
              },
            })
          )

        assert.equal(response.status, 200)

        const [deviceRow, deploymentRow, deviceApiKeyRow] = await Promise.all([
          knex('Device').where({ id: response.body.device.id }).first('siteId', 'deviceApiKeyId'),
          knex('Deployment').where({ deviceId: response.body.device.id }).first('siteId', 'start', 'end'),
          knex('DeviceApiKey').where({ id: deviceApiKey.id }).first('siteId'),
        ])

        assert.equal(deviceRow.siteId, site.id)
        assert.equal(deviceRow.deviceApiKeyId, deviceApiKey.id)
        assert.equal(deploymentRow.siteId, site.id)
        assert.isNull(deploymentRow.start)
        assert.isNull(deploymentRow.end)
        assert.equal(deviceApiKeyRow.siteId, site.id)
      } finally {
        await resultContext.cleanUp()
      }
    }))
})
