const Promise = require('bluebird')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

describe('transformMergeResultPayload plugin for CepheidGeneXpert devices in the Philippines', () => {
  const transformMergeResultPayload = proxyquire(
    '../../../../src/plugin/partner/Philippines/transformMergeResultPayload',
    {
      '../../../shared/dictionary': {
        sampleTypeToId: async () => {},
        deviceTypeToPlugin: async () => Promise.resolve(''),
      },
      '../../registration': {
        loadPlugin: async () => Promise.resolve(async ({ payload }) => Promise.resolve(payload)),
      },
    }
  )

  it('Should set (but not overwrite) patient name & surname from custom field data', async () =>
    Promise.each(
      [
        {
          originalPayload: {
            data: {
              customFieldData: {
                10: {
                  value: 'AND LAST',
                  label: 'Last Name of Patient',
                },
                11: {
                  value: 'HAS FIRST',
                  label: 'First Name of Patient',
                },
                12: {
                  value: 'MIDDLE',
                  label: 'Middle Name of Patient',
                },
              },
            },
            patient: {
              name: '',
              surname: null,
            },
          },
          expectedPayload: {
            patient: {
              name: 'HAS FIRST MIDDLE',
              surname: 'AND LAST',
            },
          },
        },
        {
          originalPayload: {
            data: {
              customFieldData: {
                10: {
                  value: 'AND LAST',
                  label: 'Last Name of Patient',
                },
                11: {
                  value: 'HAS FIRST',
                  label: 'First Name of Patient',
                },
                12: {
                  value: 'MIDDLE',
                  label: 'Middle Name of Patient',
                },
              },
            },
            patient: {
              name: null,
              surname: null,
            },
          },
          expectedPayload: {
            patient: {
              name: 'HAS FIRST MIDDLE',
              surname: 'AND LAST',
            },
          },
        },
        {
          originalPayload: {
            data: {
              customFieldData: {
                10: {
                  value: 'RICHARDS',
                  label: 'Last Name of Patient',
                },
                11: {
                  value: 'BRYAN',
                  label: 'First Name of Patient',
                },
                12: {
                  value: 'MAITLAND',
                  label: 'Middle Name of Patient',
                },
              },
            },
            patient: {
              name: 'Has Existing',
              surname: 'Name',
            },
          },
          expectedPayload: {
            patient: {
              name: 'Has Existing',
              surname: 'Name',
            },
          },
        },
        {
          originalPayload: {
            data: {
              customFieldData: {
                10: {
                  value: 'May',
                  label: 'Last Name of Patient',
                },
                11: {
                  value: 'Brian',
                  label: 'First Name of Patient',
                },
                12: {
                  value: 'Harold',
                  label: 'Middle Name of Patient',
                },
              },
            },
            patient: {
              name: 'Has Existing First name Only',
              surname: null,
            },
          },
          expectedPayload: {
            patient: {
              name: 'Has Existing First name Only',
              surname: null,
            },
          },
        },
        {
          originalPayload: {
            data: {},
            patient: {
              name: '',
              surname: '',
            },
          },
          expectedPayload: {
            patient: {
              name: '',
              surname: '',
            },
          },
        },
        {
          originalPayload: {
            data: {
              customFieldData: {
                11: {
                  value: 'ONLY FIRST NAME',
                  label: 'First Name of Patient',
                },
              },
            },
            patient: {
              name: null,
              surname: null,
            },
          },
          expectedPayload: {
            patient: {
              name: 'ONLY FIRST NAME',
              surname: null,
            },
          },
        },
        {
          originalPayload: {
            data: {
              customFieldData: {
                10: {
                  value: 'AND LAST NAME',
                  label: 'Last Name of Patient',
                },
                12: {
                  value: 'MIDDLE NAME',
                  label: 'Middle Name of Patient',
                },
              },
            },
          },
          expectedPayload: {
            patient: {
              name: 'MIDDLE NAME',
              surname: 'AND LAST NAME',
            },
          },
        },
      ],
      async ({ originalPayload, expectedPayload }) => {
        const transformedPayload = await transformMergeResultPayload({
          knex: () => this,
          deviceType: 'CepheidGeneXpert',
          payload: originalPayload,
        })
        expect(transformedPayload).to.containSubset(expectedPayload)
      }
    ))
})
