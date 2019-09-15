const chai = require('chai')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const proxyquire = require('proxyquire')

const { parseDateOrDefault } = require('../../src/shared/date')

const { assert } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  const utcNow = new Date('2019-09-15T08:09:10.123Z')
  let knexSpy
  let DefaultAbbottM2000 = ''
  let dbsHivVlPklPayload = ''

  before(() => {
    knexSpy = table => {
      const where = (...rest) => {
        const finalCall = {
          first: async () => {
            switch (table) {
              case 'DeviceApiKey':
                return Promise.resolve({
                  id: 1,
                  revoked: false,
                  partnerId: 2,
                  deviceId: 3,
                })
              case 'Device':
                return Promise.resolve({
                  id: 4,
                  siteId: 5,
                  geographyId: 6,
                  configurationData: '{}',
                  lastSeenOn: new Date(1990, 1, 13, 7, 30),
                })
              case 'Site':
                return Promise.resolve({
                  id: 7,
                  longitude: 8,
                  latitude: 9,
                })
              case 'Result':
                if (rest[1] === 'SYS123165|275021695|vl110|D1|20190825165311') {
                  console.log(rest[1])
                }
                return Promise.resolve()
              default:
                return Promise.resolve({})
            }
          },
          update: async () => {
            return Promise.resolve()
          },
        }
        finalCall.andWhere = () => finalCall
        return finalCall
      }
      const knex = {
        where,
        insert: async (record) => {
          if (record.moduleName === 'D1') {
            console.log(JSON.stringify(record))
          }
          return Promise.resolve([1])
        },
      }
      const join = () => knex
      knex.join = join
      return knex
    }
    const resolveWith = returnValue => async () => Promise.resolve(returnValue)
    DefaultAbbottM2000 = proxyquire(
      '../../src/deviceApiRaw/dataProcessors/abbottM2000',
      {
        '../../db': {
          transact: async transaction => transaction(knexSpy),
        },
        '../../shared/date': {
          parseDateOrDefault,
          getUtcTime: () => utcNow,
        },
        '../../shared/dictionary': {
          allAssayToId: resolveWith({
            abbottM2000DBSHivVL: 1,
            abbottM2000PlasmaHivVL: 2,
            abbottM2000HIVEID: 3,
          }),
          allSampleTypeToId: resolveWith({
            DBS: 4,
            Plasma: 5,
          }),
          resultTypeToId: resolveWith(6),
          resultSourceToId: resolveWith(7),
          allResultCategoryToId: resolveWith({
            Detected: 8,
            NotDetected: 9,
            LessThan550: 10,
            MoreThan550: 11,
            LessThan40: 12,
            MoreThan40: 13,
            Error: 14,
          }),
          allResultWorkflowStatusToId: resolveWith({
            Processed: 15,
            OK: 16,
            Ordered: 17,
            InProgress: 18,
            Error: 19,
          }),
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
