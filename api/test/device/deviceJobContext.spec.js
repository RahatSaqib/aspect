const chai = require('chai')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Device route Job constraints', () => {
  const path = '/api/device'

  describe('Device Type based', () => {
    const deviceTypeGeneXpertExternalId = 'CepheidGeneXpert'
    const gxClinicianUsername = 'gx_clinician'
    const gxClinicianPassword = 'gx-clinician-pass'
    let gxClinicianUserId
    let gxClinicianAuthAccessToken
    let deviceTypeGeneXpertName

    const deviceTypeDaktariVirologyExternalId = 'DaktariVirology'
    let deviceTypeDaktariVirologyName

    const bothDeviceTypesClinicianUsername = 'both_device_types_clinician'
    const bothDeviceTypesClinicianPassword = 'both-device-types-clinician-pass'
    let bothDeviceTypesClinicianUserId
    let bothDeviceTypesClinicianAuthAccessToken

    before(async () => {
      shared.checkToken(server, path)
      ;({ name: deviceTypeGeneXpertName } = await knex('DeviceType')
        .where('externalId', deviceTypeGeneXpertExternalId)
        .first('name'))
      gxClinicianUserId = await createUser('Partner One', 'US', gxClinicianUsername, gxClinicianPassword, [
        {
          jobFunctionExternalId: 'clinician',
          deviceTypeExternalId: deviceTypeGeneXpertExternalId,
        },
      ])
      gxClinicianAuthAccessToken = await getAccessToken(gxClinicianUsername, gxClinicianPassword)
      ;({ name: deviceTypeDaktariVirologyName } = await knex('DeviceType')
        .where('externalId', deviceTypeDaktariVirologyExternalId)
        .first('name'))
      bothDeviceTypesClinicianUserId = await createUser(
        'Partner One',
        'US',
        bothDeviceTypesClinicianUsername,
        bothDeviceTypesClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            deviceTypeExternalId: deviceTypeGeneXpertExternalId,
          },
          {
            jobFunctionExternalId: 'clinician',
            deviceTypeExternalId: deviceTypeDaktariVirologyExternalId,
          },
        ]
      )
      bothDeviceTypesClinicianAuthAccessToken = await getAccessToken(
        bothDeviceTypesClinicianUsername,
        bothDeviceTypesClinicianPassword
      )
    })

    after(async () => {
      await removeUser(gxClinicianUserId)
      await removeUser(bothDeviceTypesClinicianUserId)
    })

    it("should constrain devices returned based on the user's job context", async () => {
      const geneXpertUserDevicesResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${gxClinicianAuthAccessToken}`)
      assert.equal(geneXpertUserDevicesResponse.status, 200)
      assert.typeOf(geneXpertUserDevicesResponse.body, 'Object')
      assert.property(geneXpertUserDevicesResponse.body, 'data')
      assert.typeOf(geneXpertUserDevicesResponse.body.data, 'array')
      assert.property(geneXpertUserDevicesResponse.body, 'total')
      geneXpertUserDevicesResponse.body.data.forEach(device => {
        assert.equal(device.type, deviceTypeGeneXpertName)
      })
    })

    describe('Mixed device types', () => {
      it("should constrain results returned based on the user's job context", async () => {
        const bothDeviceTypesResponse = await server
          .get(path)
          .set('Authorization', `Bearer ${bothDeviceTypesClinicianAuthAccessToken}`)
        assert.equal(bothDeviceTypesResponse.status, 200)
        assert.typeOf(bothDeviceTypesResponse.body, 'Object')
        assert.property(bothDeviceTypesResponse.body, 'data')
        assert.typeOf(bothDeviceTypesResponse.body.data, 'array')
        assert.property(bothDeviceTypesResponse.body, 'total')
        bothDeviceTypesResponse.body.data.forEach(device => {
          assert.include([deviceTypeGeneXpertName, deviceTypeDaktariVirologyName], device.type)
        })
      })
    })
  })
})
