const chai = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const _ = require('lodash')
const Promise = require('bluebird')

const { assert } = chai

describe('Uptime Robot External Source Fact Handler', () => {
  function mockOutUptimeRobotExternalFactHandler(
    deviceTypeId,
    createFetchSpy,
    uptimeRobotResponse,
    uptimeRobotError,
    uptimeRobotStatusCode = 200,
    uptimeRobotStatusText = 'OK'
  ) {
    const resolveWith = returnValue => async () => Promise.resolve(returnValue)
    const rejectWith = error => async () => Promise.reject(error)
    return proxyquire('../../../src/fact/externalSourceHandlers/uptimeRobot', {
      'http-client': {
        createFetch: (...rest) => {
          createFetchSpy(...rest)
          if (uptimeRobotError) {
            return rejectWith(uptimeRobotError)
          }
          return resolveWith({
            json: resolveWith(uptimeRobotResponse),
            status: uptimeRobotStatusCode,
            statusText: uptimeRobotStatusText,
          })
        },
        base: _.noop,
        accept: _.noop,
        header: _.noop,
        method: _.noop,
        body: _.noop,
      },
      '../../shared/dictionary': {
        deviceTypeToId: resolveWith(deviceTypeId),
      },
    })
  }

  function mockContext(updateSpy, insertSpy, aspectDeviceIds, aspectDeviceUptimeRobotFact) {
    const buildKnexSpy = () => table => {
      const knex = {
        insert: async (...rest) => {
          insertSpy(table, ...rest)
          return Promise.resolve([insertSpy.callCount])
        },
      }
      const where = () => {
        const returnData = async () => {
          let returnValue
          if (table === 'Device') {
            returnValue = aspectDeviceIds
          } else if (table === 'FactDeviceExternalSource') {
            returnValue = aspectDeviceUptimeRobotFact
          }
          return Promise.resolve(returnValue)
        }
        const finalCall = {
          first: async () => returnData(),
          pluck: async () => returnData(),
          update: async (...rest) => {
            updateSpy(table, ...rest)
            return Promise.resolve()
          },
        }
        finalCall.andWhere = () => finalCall
        finalCall.select = () => finalCall
        return finalCall
      }
      knex.where = where
      const join = () => knex
      knex.join = join
      knex.leftJoin = join
      knex.select = where
      return knex
    }
    return {
      messageContext: {
        run: async callback => {
          const knex = buildKnexSpy()
          return callback(knex)
        },
      },
    }
  }

  describe('When no Aspect Device Present in Database', () => {
    it('Should not do anything', async () => {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      const createFetchSpy = sinon.spy()
      const uptimeRobotExternalFactHandler = mockOutUptimeRobotExternalFactHandler(1, createFetchSpy)
      await uptimeRobotExternalFactHandler(mockContext(updateSpy, insertSpy))
      assert.isOk(createFetchSpy.notCalled)
      assert.isOk(updateSpy.notCalled)
      assert.isOk(insertSpy.notCalled)
    })
  })

  describe('When Aspect Device Present in Database', () => {
    const uptimeRobotResponse = {
      stat: 'ok',
      pagination: {
        offset: 0,
        limit: 50,
        total: 1,
      },
      monitors: [
        {
          id: 785334592,
          friendly_name: 'Aspect Dev',
          url: 'https://dev.aspect.id',
          type: 1,
          sub_type: '',
          keyword_type: null,
          keyword_value: '',
          http_username: '',
          http_password: '',
          port: '',
          interval: 300,
          status: 2,
          create_datetime: 1592324655,
          custom_uptime_ranges: '92.339-100.000',
        },
      ],
    }
    const aspectDeviceIds = [2]
    const aspectDeviceUptimeRobotFact = { deviceId: 2 }

    async function runUptimeRobitExternalFactHandler(
      updateSpy,
      insertSpy,
      createFetchSpy,
      explicitAspectDeviceIds = aspectDeviceIds,
      explicitAspectDeviceUptimeRobotFact = aspectDeviceUptimeRobotFact
    ) {
      const uptimeRobotExternalFactHandler = mockOutUptimeRobotExternalFactHandler(
        1,
        createFetchSpy,
        uptimeRobotResponse
      )
      return uptimeRobotExternalFactHandler(
        mockContext(updateSpy, insertSpy, explicitAspectDeviceIds, explicitAspectDeviceUptimeRobotFact)
      )
    }

    it('Should fetch statistics from the Uptime Robot API', async () => {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      const createFetchSpy = sinon.spy()
      await runUptimeRobitExternalFactHandler(updateSpy, insertSpy, createFetchSpy)
      assert.isOk(createFetchSpy.calledOnce)
      assert.isOk(updateSpy.calledOnce)
      assert.isOk(insertSpy.notCalled)
    })

    it('Should update the fact with the data from Uptime Robot API', async () => {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      const createFetchSpy = sinon.spy()
      await runUptimeRobitExternalFactHandler(updateSpy, insertSpy, createFetchSpy)
      assert.equal(updateSpy.getCalls()[0].args[0], 'FactDeviceExternalSource')
      assert.equal(updateSpy.getCalls()[0].args[1].data, JSON.stringify(uptimeRobotResponse))
    })

    describe('and Aspect Device Uptime Robot Fact Not Already Present in Database', () => {
      it('Should insert the Uptime Robot fact', async () => {
        const updateSpy = sinon.spy()
        const insertSpy = sinon.spy()
        const createFetchSpy = sinon.spy()
        await runUptimeRobitExternalFactHandler(updateSpy, insertSpy, createFetchSpy, aspectDeviceIds, null)
        assert.isOk(createFetchSpy.calledOnce)
        assert.isOk(updateSpy.notCalled)
        assert.isOk(insertSpy.calledOnce)
        assert.equal(insertSpy.getCalls()[0].args[0], 'FactDeviceExternalSource')
        const insertedObject = insertSpy.getCalls()[0].args[1]
        assert.equal(insertedObject.deviceId, aspectDeviceIds[0])
        assert.equal(insertedObject.sourceName, 'uptimeRobot')
        assert.equal(insertedObject.data, JSON.stringify(uptimeRobotResponse))
      })
    })
  })
})
