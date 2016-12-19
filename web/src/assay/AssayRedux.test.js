import subMinutes from 'date-fns/sub_minutes'

describe('AssayRedux module', () => {
  let fetchStub
  let AssayRedux

  const assaysData = [
    {
      id: 7,
      assayTypeId: 3,
      name: 'Abbot m2000 HIV VL',
      assayTypeName: 'HIV VL',
      deviceTypeId: 4,
      deviceTypeName: 'm2000',
      resultDataSchema: {
        copies: {
          type: 'number',
          title: 'copies/mL'
        },
        resultText: {
          type: 'string',
          title: 'Result Text'
        }
      },
      resultCategory1Label: null,
      resultCategory1i18nKey: null,
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      hasResults: false
    },
    {
      id: 4,
      assayTypeId: 3,
      name: 'Afinion HIV VL',
      assayTypeName: 'HIV VL',
      deviceTypeId: 2,
      deviceTypeName: 'Afinion',
      resultDataSchema: {
        log: {
          type: 'number',
          title: 'log'
        },
        copies: {
          list: true,
          type: 'number',
          title: 'copies/mL'
        }
      },
      resultCategory1Label: null,
      resultCategory1i18nKey: null,
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      hasResults: false
    }
  ]

  describe('fetchAssays action', () => {
    let dispatchStub

    beforeAll(() => {
      jest
        .resetModules()
        .mock('../shared/utils/fetch', () => {
          const expectedResponseFromServer = Promise.resolve({ ok: true, data: assaysData })

          fetchStub = {
            aspectFetch: jest.fn(() => expectedResponseFromServer)
          }

          return fetchStub
        })

      AssayRedux = require('./AssayRedux')

      dispatchStub = jest.fn()
    })

    describe('initial fetch', () => {
      beforeAll(() => {
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false
          }
        }))
      })

      afterAll(() => {
        dispatchStub.mockClear()
        fetchStub.aspectFetch.mockClear()
      })

      it('should dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub).toHaveBeenCalledWith({ type: AssayRedux.types.REQUEST_ASSAYS })
      })

      it('should request the account details from the server', () => {
        expect(fetchStub.aspectFetch.mock.calls[0][0]).toBe('/assay')
      })
    })

    describe('subsequent calls within 5 minutes', () => {
      beforeAll(() => {
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false,
            lastRefreshed: subMinutes(new Date(), 3)
          }
        }))
      })

      afterAll(() => {
        fetchStub.aspectFetch.mockClear()
        dispatchStub.mockClear()
      })

      it('should not dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub).not.toHaveBeenCalled()
      })

      it('should not request the account details from the server', () => {
        expect(fetchStub.aspectFetch).not.toHaveBeenCalled()
      })
    })

    describe('subsequent calls after 5 minutes', () => {
      beforeAll(() => {
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false,
            lastRefreshed: subMinutes(new Date(), 7)
          }
        }))
      })

      afterAll(() => {
        fetchStub.aspectFetch.mockClear()
        dispatchStub.mockClear()
      })

      it('should dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub).toHaveBeenCalledWith({ type: AssayRedux.types.REQUEST_ASSAYS })
      })

      it('should request the account details from the server', () => {
        expect(fetchStub.aspectFetch.mock.calls[0][0]).toBe('/assay')
      })
    })
  })
})
