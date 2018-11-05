const Promise = require('bluebird')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

describe('transformMergeResultPayload plugin for CepheidGeneXpert devices in Myanmar', () => {
  const transformMergeResultPayload = proxyquire(
    '../../../../src/plugin/partner/Myanmar/transformMergeResultPayload',
    {
      '../../../shared/dictionary': {
        sampleTypeToId: async () => {},
        deviceTypeToPlugin: async () => Promise.resolve(''),
      },
      '../../registration': {
        loadPlugin: async () =>
          Promise.resolve(async ({ payload }) => Promise.resolve(payload)),
      },
    }
  )

  describe('Parse Notes', () => {
    it('Should populate patient HIV status, Gender, Age, Phone Number and Reason for Test', async () =>
      Promise.each(
        [
          {
            notes: '40yrs,M,Yes HIV-,Dx,Nd',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 40,
                gender: 'Male',
                previouslyTreated: 'Yes',
                microscopyResult: 'Not Done',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '49M , NO, HIV?, Dx, POs',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Unknown',
                age: 49,
                gender: 'Male',
                previouslyTreated: 'No',
                microscopyResult: 'Positive',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '24,F,No,HIV-,Dx,Pos,',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 24,
                gender: 'Female',
                previouslyTreated: 'No',
                microscopyResult: 'Positive',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '30,M,No,HIV+,Dx,Neg,YarMinNya(12)St,789489001.',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Positive',
                phone: '789489001',
                age: 30,
                gender: 'Male',
                previouslyTreated: 'No',
                microscopyResult: 'Negative',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '23,F,No,HIV-,Dx,Pos,',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 23,
                gender: 'Female',
                previouslyTreated: 'No',
                microscopyResult: 'Positive',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '30,M,No,HIV+,Dx,Neg',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Positive',
                age: 30,
                gender: 'Male',
                previouslyTreated: 'No',
                microscopyResult: 'Negative',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '65,M,Yes,HIV-,Dx,Neg,Kan Gyi Su,Baye Pauk,Shwe Pyi Thar,LPA TSP,Relapse.',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 65,
                gender: 'Male',
                previouslyTreated: 'Yes',
                microscopyResult: 'Negative',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '32,M,No,HIV-,Pos,',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 32,
                gender: 'Male',
                previouslyTreated: 'No',
                microscopyResult: 'Positive',
              },
              data: undefined,
            },
          },
          {
            notes: '42,F,No,HIV-,Dx,Pos',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Negative',
                age: 42,
                gender: 'Female',
                previouslyTreated: 'No',
                microscopyResult: 'Positive',
              },
              data: {
                testReasonShortName: 'Dx',
              },
            },
          },
          {
            notes: '4,m,yes,hiv?,dx,neg',
            expectedPayload: {
              patient: {
                hivStatus: 'HIV Unknown',
                age: 4,
                gender: 'Male',
                previouslyTreated: 'Yes',
                microscopyResult: 'Negative',
              },
              data: {
                testReasonShortName: 'dx',
              },
            },
          },
        ],
        async ({ notes, expectedPayload }) => {
          const transformedPayload = await transformMergeResultPayload({
            knex: () => this,
            deviceType: 'CepheidGeneXpert',
            payload: { notes },
          })
          expect(transformedPayload).to.containSubset(expectedPayload)
        }
      ))
  })
})
