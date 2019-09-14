const chai = require('chai')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const proxyquire = require('proxyquire')
const dateParse = require('date-fns/parse')
const { getUtcTime } = require('../../src/shared/date')

const { assert } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  let knexSpy
  let DefaultAbbottM2000 = ''
  let dbsHivVlPklPayload = ''

  before(() => {
    knexSpy = table => ({
      where: () => ({
        first: async () => {
          switch (table) {
            case 'DeviceApiKey':
              return Promise.resolve({
                id: 1,
                revoked: false,
                partnerId: 1,
                deviceId: 1,
              })
            case 'Device':
              return Promise.resolve({
                id: 1,
                siteId: 1,
                geographyId: 1,
                configurationData: '{}',
                lastSeenOn: new Date(1990, 1, 13, 7, 30),
              })
            case 'Site':
              return Promise.resolve({
                id: 1,
                longitude: 1,
                latitude: 1,
              })
            default:
              return Promise.resolve({})
          }
        },
        update: async () => {
          return Promise.resolve()
        },
      }),
      insert: async record => {
        return Promise.resolve([1])
      },
    })
    const resolveWith = returnValue => async () => Promise.resolve(returnValue)
    DefaultAbbottM2000 = proxyquire(
      '../../src/deviceApiRaw/dataProcessors/abbottM2000',
      {
        '../../db': {
          transact: async transaction => transaction(knexSpy),
        },
        '../../shared/dictionary': {
          allAssayToId: resolveWith({}),
          allSampleTypeToId: resolveWith({}),
          resultTypeToId: resolveWith({}),
          resultSourceToId: resolveWith({}),
          resultCategoryToId: resolveWith({}),
          allResultWorkflowStatusToId: resolveWith({}),
        },
      }
    )
    // The example below is an obfuscated copy of a PKL taken
    //   from the Abbott M2000 running HIV Viral Load Tests using
    //   the 1mLDBSvOP HIV1.0mlDBS Assay
    dbsHivVlPklPayload = fs.readFileSync(
      path.join(__dirname, 'abbotM2000DbsHivVl.pkl'),
      'utf8'
    )
  })

  it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
    const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
      payload: dbsHivVlPklPayload,
    })
    assert.isOk(isM2000Payload)
  })

  it('should be able to parse a PKL file into results', async () => {
    const m2000DataProcessorViralLoad = new DefaultAbbottM2000(
      {
        auth: { credentials: { token: 'some device API key' } },
        payload: dbsHivVlPklPayload,
      },
      { dispatch: () => {} }
    )
    await m2000DataProcessorViralLoad.processRequest()
  })
})
