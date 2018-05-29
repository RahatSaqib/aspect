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
        pluck() {
          return Promise.resolve([
            'DBS',
            'Plasma',
            'Sputum',
            'Saliva',
            'Blood',
            'CSF',
            'Effusion',
            'Pus',
            'Other',
          ])
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

    describe('and the custom fields have been filled out', () => {
      it('should set properties inside the payload', async () => {
        const expectations = [
          {
            initialPayload: getPayload({
              patient: {
                id: 'Bryan Richards,Johannesburg',
              },
              data: {
                customFieldData: {
                  31: {
                    notAvailable: false,
                    value: 'Bradford Edmund Cunningham',
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  32: {
                    notAvailable: false,
                    value: '22',
                    label: 'Patient Age (enter 99 if not on form)',
                  },
                  33: {
                    notAvailable: false,
                    value: 'M',
                    label: 'Sex',
                  },
                  34: {
                    notAvailable: false,
                    value: 'Blood',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Positive',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Smear Negative',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'Previously Treated',
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: null,
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: false,
                    value: 'Hkamti',
                    label: 'Patient Township',
                  },
                  40: {
                    notAvailable: false,
                    value: 'ALN TBC',
                    label: 'Referral Center',
                  },
                  41: {
                    notAvailable: false,
                    value: 'Not sure what to add here',
                    label: 'Other Notes',
                  },
                },
              },
              notes: '34,M,Yes,HIV+,Neg,',
            }),
            transformedPayload: {
              patient: {
                id: 'Bryan Richards',
                name: 'Bradford Edmund',
                surname: 'Cunningham',
                city: 'Johannesburg',
                age: 22,
                gender: 'Male',
                previouslyTreated: 'Yes',
                hivStatus: 'HIV Positive',
                microscopyResult: 'Negative',
              },
              sample: {
                type: {
                  id: 'Blood',
                },
              },
              data: {
                otherNotes: 'Not sure what to add here',
                referralCenter: 'ALN TBC',
                customFieldData: {
                  31: {
                    notAvailable: false,
                    value: 'Bradford Edmund Cunningham',
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  32: {
                    notAvailable: false,
                    value: '22',
                    label: 'Patient Age (enter 99 if not on form)',
                  },
                  33: {
                    notAvailable: false,
                    value: 'M',
                    label: 'Sex',
                  },
                  34: {
                    notAvailable: false,
                    value: 'Blood',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Positive',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Smear Negative',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'Previously Treated',
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: null,
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: false,
                    value: 'Hkamti',
                    label: 'Patient Township',
                  },
                  40: {
                    notAvailable: false,
                    value: 'ALN TBC',
                    label: 'Referral Center',
                  },
                  41: {
                    notAvailable: false,
                    value: 'Not sure what to add here',
                    label: 'Other Notes',
                  },
                },
              },
              notes: '34,M,Yes,HIV+,Neg,',
            },
          },
          {
            initialPayload: getPayload({
              patient: {
                id: 'Lee Nicaise',
              },
              data: {
                customFieldData: {
                  31: {
                    notAvailable: false,
                    value: 'LeeNicaise',
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  33: {
                    notAvailable: false,
                    value: 'F',
                    label: 'Sex',
                  },
                  34: {
                    notAvailable: false,
                    value: 'Not on Form',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Negative',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Smear Positive',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'No Previous Treatment',
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: 'EPTB Suspect',
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: false,
                    value: 'Cape Town',
                    label: 'Patient Township',
                  },
                  40: {
                    notAvailable: false,
                    value: 'Some random value',
                    label: 'Some Unknown Field',
                  },
                },
              },
              notes: '88,M,Yes,HIV+,Neg,',
            }),
            transformedPayload: {
              patient: {
                id: 'Lee Nicaise',
                name: 'LeeNicaise',
                city: 'Cape Town',
                age: 88,
                gender: 'Female',
                previouslyTreated: 'No',
                hivStatus: 'HIV Negative',
                microscopyResult: 'Positive',
              },
              data: {
                customFieldData: {
                  31: {
                    notAvailable: false,
                    value: 'LeeNicaise',
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  33: {
                    notAvailable: false,
                    value: 'F',
                    label: 'Sex',
                  },
                  34: {
                    notAvailable: false,
                    value: 'Not on Form',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Negative',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Smear Positive',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'No Previous Treatment',
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: 'EPTB Suspect',
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: false,
                    value: 'Cape Town',
                    label: 'Patient Township',
                  },
                  40: {
                    notAvailable: false,
                    value: 'Some random value',
                    label: 'Some Unknown Field',
                  },
                },
              },
              notes: '88,M,Yes,HIV+,Neg,',
            },
          },
          {
            initialPayload: getPayload({
              patient: {
                id: 'James May,Brighton',
              },
              data: {
                customFieldData: {
                  31: {
                    notAvailable: true,
                    value: null,
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  32: {
                    notAvailable: false,
                    value: '0',
                    label: 'Patient Age (enter 99 if not on form)',
                  },
                  34: {
                    notAvailable: true,
                    value: null,
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Unknown',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: true,
                    value: null,
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: true,
                    value: null,
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: 'EPTB Suspect',
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: true,
                    value: null,
                    label: 'Patient Township',
                  },
                },
              },
              notes: '16,F,No,HIV?,Pos,',
            }),
            transformedPayload: {
              patient: {
                id: 'James May',
                city: 'Brighton',
                age: 16,
                gender: 'Female',
                previouslyTreated: 'No',
                hivStatus: 'HIV Unknown',
                microscopyResult: 'Positive',
              },
              data: {
                customFieldData: {
                  31: {
                    notAvailable: true,
                    value: null,
                    label: 'PatientName (enter 99 if not on form)',
                  },
                  32: {
                    notAvailable: false,
                    value: '0',
                    label: 'Patient Age (enter 99 if not on form)',
                  },
                  34: {
                    notAvailable: true,
                    value: null,
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Unknown',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: true,
                    value: null,
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: true,
                    value: null,
                    label: 'Previous Treatment History',
                  },
                  38: {
                    notAvailable: false,
                    value: 'EPTB Suspect',
                    label: 'Other Reason for Test',
                  },
                  39: {
                    notAvailable: true,
                    value: null,
                    label: 'Patient Township',
                  },
                },
              },
              notes: '16,F,No,HIV?,Pos,',
            },
          },
          {
            initialPayload: getPayload({
              patient: {
                id: 'Cher,Las Vegas',
              },
              sample: {
                type: {
                  id: 'Pus',
                },
              },
              data: {
                customFieldData: {
                  34: {
                    notAvailable: false,
                    value: 'CSF',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Not On Form',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Off-site Microscopy',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'On Treatment',
                    label: 'Previous Treatment History',
                  },
                },
              },
              notes: '119,F,',
            }),
            transformedPayload: {
              patient: {
                id: 'Cher',
                city: 'Las Vegas',
                age: 119,
                gender: 'Female',
                previouslyTreated: 'On Treatment',
                hivStatus: 'Not On Form',
                microscopyResult: 'Off-site Microscopy',
              },
              sample: {
                type: {
                  id: 'Pus',
                },
              },
              data: {
                customFieldData: {
                  34: {
                    notAvailable: false,
                    value: 'CSF',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Not On Form',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Off-site Microscopy',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'On Treatment',
                    label: 'Previous Treatment History',
                  },
                },
              },
              notes: '119,F,',
            },
          },
          {
            initialPayload: getPayload({
              patient: {
                id: 'Mike Myers,Boston',
              },
              data: {
                customFieldData: {
                  34: {
                    notAvailable: false,
                    value: 'CSF',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Not On Form',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Off-site Microscopy',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'On Treatment',
                    label: 'Previous Treatment History',
                  },
                },
              },
              notes: '56,M,HIV?,Nd,Yes,',
            }),
            transformedPayload: {
              patient: {
                id: 'Mike Myers',
                city: 'Boston',
                age: 56,
                gender: 'Male',
                previouslyTreated: 'Yes',
                hivStatus: 'HIV Unknown',
                microscopyResult: 'Not Done',
              },
              data: {
                customFieldData: {
                  34: {
                    notAvailable: false,
                    value: 'CSF',
                    label: 'Sample Type',
                  },
                  35: {
                    notAvailable: false,
                    value: 'Not On Form',
                    label: 'HIV Status',
                  },
                  36: {
                    notAvailable: false,
                    value: 'Off-site Microscopy',
                    label: 'Microscopy Result',
                  },
                  37: {
                    notAvailable: false,
                    value: 'On Treatment',
                    label: 'Previous Treatment History',
                  },
                },
              },
              notes: '56,M,HIV?,Nd,Yes,',
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
