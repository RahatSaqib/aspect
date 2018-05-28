const _ = require('lodash')
const proxyquire = require('proxyquire')
const { assert, expect } = require('chai')
const sinon = require('sinon')
const Promise = require('bluebird')
const { runTest } = require('../../utils/generatorFunctionUtils')

describe('transformMergeResultPayload for Myanmar', () => {
  function getPayload(payload) {
    if (payload) {
      return _.cloneDeep(payload)
    }
    const basicPayload = {
      patient: {
        id: 'Bryan Richards,Johannesburg',
      },
      notes: '34,M,Yes,HIV+,Neg,',
    }
    return _.cloneDeep(basicPayload)
  }

  const gxConnectPluginContext = {
    payload: getPayload(),
    knex() {
      return {
        where() {
          return {
            async first() {
              return Promise.resolve({ plugin: 'gxconnect' })
            },
          }
        },
      }
    },
    deviceType: 'CepheidGeneXpert',
  }

  let deviceTypeTransformMergeResultPayload
  let transformMergeResultPayload

  function initialisePluginAndPayload(payload) {
    deviceTypeTransformMergeResultPayload = sinon
      .stub()
      .resolves(getPayload(payload))
    transformMergeResultPayload = proxyquire(
      '../../../src/deviceApi/plugin/myanmar/transformMergeResultPayload',
      {
        '../registration': {
          async loadPlugin() {
            return deviceTypeTransformMergeResultPayload
          },
        },
      }
    )
  }

  beforeEach(() => {
    initialisePluginAndPayload()
  })

  it('should execute plugins for the device type in the payload', () =>
    runTest(transformMergeResultPayload, [gxConnectPluginContext])(() => {
      assert.ok(deviceTypeTransformMergeResultPayload.calledOnce)
      assert.ok(
        deviceTypeTransformMergeResultPayload.calledWith(gxConnectPluginContext)
      )
    }))

  describe('when request comes from from a GeneXpert', () => {
    it('should parse notes and patient ID', async () => {
      const expectations = [
        {
          initialPayload: getPayload(),
          transformedPayload: {
            patient: {
              id: 'Bryan Richards',
              city: 'Johannesburg',
              age: 34,
              gender: 'Male',
              previouslyTreated: 'Yes',
              hivStatus: 'HIV Positive',
              microscopyResult: 'Negative',
            },
            notes: '34,M,Yes,HIV+,Neg,',
          },
        },
        {
          initialPayload: {
            patient: {
              id: 'Cho Mar,Myaungmya',
            },
            notes: '30,F,No,HIv-,Dx,Pos,',
          },
          transformedPayload: {
            patient: {
              id: 'Cho Mar',
              city: 'Myaungmya',
              age: 30,
              gender: 'Female',
              previouslyTreated: 'No',
              hivStatus: 'HIV Negative',
              microscopyResult: 'Positive',
            },
            data: {
              testReasonShortName: 'Dx',
            },
            notes: '30,F,No,HIv-,Dx,Pos,',
          },
        },
        {
          initialPayload: {
            patient: {
              id: 'May May Chu,Pathein',
            },
            notes: '25,No,HIV?,Dx,Pos,YoDaYarKone,Pathein TSP,09-250993323.',
          },
          transformedPayload: {
            patient: {
              id: 'May May Chu',
              city: 'Pathein',
              age: 25,
              previouslyTreated: 'No',
              hivStatus: 'HIV Unknown',
              microscopyResult: 'Positive',
              phone: '250993323',
            },
            data: {
              testReasonShortName: 'Dx',
            },
            notes: '25,No,HIV?,Dx,Pos,YoDaYarKone,Pathein TSP,09-250993323.',
          },
        },
        {
          initialPayload: {
            patient: {
              id: 'Lee Michelle Nicaise,Bogota',
              age: undefined,
            },
            notes:
              '6MONTHS,Yes,HIV-,Na,Nd,YoDaYarKone,Pathein TSP,+9550993323.',
          },
          transformedPayload: {
            patient: {
              id: 'Lee Michelle Nicaise',
              city: 'Bogota',
              age: undefined,
              previouslyTreated: 'Yes',
              hivStatus: 'HIV Negative',
              microscopyResult: 'Not Done',
              phone: '50993323',
            },
            data: {
              testReasonShortName: 'Na',
            },
            notes:
              '6MONTHS,Yes,HIV-,Na,Nd,YoDaYarKone,Pathein TSP,+9550993323.',
          },
        },
        {
          initialPayload: {
            patient: {
              id: 'Bradford Edmund,Strudensvallei',
              hivStatus: undefined,
            },
            notes: '13,Unk,HIV-,Fu,Nd,YoDaYarKone,Pathein TSP,(0)+9556798763',
          },
          transformedPayload: {
            patient: {
              id: 'Bradford Edmund',
              city: 'Strudensvallei',
              age: 13,
              previouslyTreated: 'Unknown',
              hivStatus: 'HIV Negative',
              microscopyResult: 'Not Done',
              phone: '56798763',
            },
            data: {
              testReasonShortName: 'Fu',
            },
            notes: '13,Unk,HIV-,Fu,Nd,YoDaYarKone,Pathein TSP,(0)+9556798763',
          },
        },
      ]
      await Promise.each(
        expectations,
        async ({ initialPayload, transformedPayload }) => {
          initialisePluginAndPayload(initialPayload)
          return runTest(transformMergeResultPayload, [gxConnectPluginContext])(
            actualTransformedPayload => {
              expect(actualTransformedPayload).to.containSubset(
                transformedPayload
              )
            }
          )
        }
      )
    })

    describe('and the notes do not describe the patient', () => {
      it('should NOT parse notes', async () => {
        const expectations = [
          {
            initialPayload: {
              patient: {
                id: 'Cho Mar,Myaungmya',
              },
              notes:
                'Post-run analysis error Error 5007: [Probe D] probe check failed. Probe check value of 11.1 for reading number 2 was below the minimum of 81.0',
            },
            transformedPayload: {
              patient: {
                id: 'Cho Mar',
                city: 'Myaungmya',
              },
              notes:
                'Post-run analysis error Error 5007: [Probe D] probe check failed. Probe check value of 11.1 for reading number 2 was below the minimum of 81.0',
            },
          },
          {
            initialPayload: {
              patient: {
                id: 'May May Chu',
              },
              notes: 'PID-433335\r\n',
            },
            transformedPayload: {
              patient: {
                id: 'May May Chu',
              },
              notes: 'PID-433335\r\n',
            },
          },
          {
            initialPayload: {
              patient: {
                id: '2017-C-1',
              },
              notes: 'QC\n',
            },
            transformedPayload: {
              patient: {
                id: '2017-C-1',
              },
              notes: 'QC\n',
            },
          },
        ]
        await Promise.each(
          expectations,
          async ({ initialPayload, transformedPayload }) => {
            initialisePluginAndPayload(initialPayload)
            return runTest(transformMergeResultPayload, [
              gxConnectPluginContext,
            ])(actualTransformedPayload => {
              expect(actualTransformedPayload).to.containSubset(
                transformedPayload
              )
              assert.isUndefined(actualTransformedPayload.patient.age)
              assert.isUndefined(actualTransformedPayload.patient.gender)
              assert.isUndefined(
                actualTransformedPayload.patient.previouslyTreated
              )
              assert.isUndefined(actualTransformedPayload.patient.hivStatus)
              assert.isUndefined(
                actualTransformedPayload.patient.microscopyResult
              )
              assert.isUndefined(actualTransformedPayload.data)
            })
          }
        )
      })
    })

    describe('and the notes have already been parsed', () => {
      it('should NOT set the fields that have already been set', async () => {
        const expectations = [
          {
            initialPayload: getPayload({
              patient: {
                id: 'Bryan Richards,Johannesburg',
                city: 'New York, New York',
                age: 99,
                gender: 'Female',
                previouslyTreated: 'No',
                hivStatus: 'HIV Unknown',
                microscopyResult: 'Not Done',
              },
              data: {
                testReasonShortName: 'Fu',
              },
              notes: '34,M,Yes,HIV+,Neg,',
            }),
            transformedPayload: {
              patient: {
                id: 'Bryan Richards,Johannesburg',
                city: 'New York, New York',
                age: 99,
                gender: 'Female',
                previouslyTreated: 'No',
                hivStatus: 'HIV Unknown',
                microscopyResult: 'Not Done',
              },
              data: {
                testReasonShortName: 'Fu',
              },
              notes: '34,M,Yes,HIV+,Neg,',
            },
          },
          {
            initialPayload: {
              patient: {
                id: 'Cho Mar,Myaungmya',
                city: 'Greenfields',
                age: 66,
                gender: 'Male',
              },
              notes: '30,F,No,HIv-,Dx,Pos,',
            },
            transformedPayload: {
              patient: {
                id: 'Cho Mar,Myaungmya',
                city: 'Greenfields',
                age: 66,
                gender: 'Male',
                previouslyTreated: 'No',
                hivStatus: 'HIV Negative',
                microscopyResult: 'Positive',
              },
              data: {
                testReasonShortName: 'Dx',
              },
              notes: '30,F,No,HIv-,Dx,Pos,',
            },
          },
        ]
        await Promise.each(
          expectations,
          async ({ initialPayload, transformedPayload }) => {
            initialisePluginAndPayload(initialPayload)
            return runTest(transformMergeResultPayload, [
              gxConnectPluginContext,
            ])(actualTransformedPayload => {
              expect(actualTransformedPayload).to.containSubset(
                transformedPayload
              )
            })
          }
        )
      })
    })
  })

  describe('when request does NOT come from a GeneXpert', () => {
    let otherDeviceTypePluginContext

    before(() => {
      otherDeviceTypePluginContext = {
        payload: getPayload(),
        knex() {
          return {
            where() {
              return {
                async first() {
                  return Promise.resolve({ plugin: null })
                },
              }
            },
          }
        },
        deviceType: 'm2000',
      }
    })

    it('should NOT parse notes and patient ID ', async () => {
      await runTest(transformMergeResultPayload, [
        otherDeviceTypePluginContext,
      ])(transformedPayload => {
        expect(transformedPayload).to.containSubset({
          patient: {
            id: 'Bryan Richards,Johannesburg',
          },
          notes: '34,M,Yes,HIV+,Neg,',
        })
      })
    })
  })
})
