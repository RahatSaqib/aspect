import subMinutes from 'date-fns/sub_minutes'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

describe('AssayRedux module', () => {
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
    let fetchStub
    let dispatchStub

    context('initial fetch', () => {
      beforeEach(() => {
        const expectedResponseFromServer = Promise.resolve({ ok: true, data: assaysData })

        fetchStub = {
          aspectFetch: sinon.stub()
        }

        fetchStub.aspectFetch
          .withArgs('/assay')
          .returns(expectedResponseFromServer)

        AssayRedux = proxyquire('./AssayRedux', {
          '../shared/utils/fetch': fetchStub
        })

        dispatchStub = sinon.stub()
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false
          }
        }))
      })

      it('should dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub.firstCall.args).toEqual([{ type: AssayRedux.types.REQUEST_ASSAYS }])
      })

      it('should request the account details from the server', () => {
        expect(fetchStub.aspectFetch.calledWith('/assay')).toBeTruthy()
      })
    })

    context('subsequent calls within 5 minutes', () => {
      beforeEach(() => {
        const expectedResponseFromServer = Promise.resolve({ ok: true, data: assaysData })

        fetchStub = {
          aspectFetch: sinon.stub()
        }

        fetchStub.aspectFetch
          .withArgs('/assay')
          .returns(expectedResponseFromServer)

        AssayRedux = proxyquire('./AssayRedux', {
          '../shared/utils/fetch': fetchStub
        })

        dispatchStub = sinon.stub()
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false,
            lastRefreshed: subMinutes(new Date(), 3)
          }
        }))
      })

      it('should not dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub.called).toBeFalsy()
      })

      it('should not request the account details from the server', () => {
        expect(fetchStub.aspectFetch.called).toBeFalsy()
      })
    })

    context('subsequent calls after 5 minutes', () => {
      beforeEach(() => {
        const expectedResponseFromServer = Promise.resolve({ ok: true, data: assaysData })

        fetchStub = fetchStub = {
          aspectFetch: sinon.stub()
        }

        fetchStub.aspectFetch
          .withArgs('/assay')
          .returns(expectedResponseFromServer)

        AssayRedux = proxyquire('./AssayRedux', {
          '../shared/utils/fetch': fetchStub
        })

        dispatchStub = sinon.stub()
        const thunk = AssayRedux.fetchAssays(false)

        thunk(dispatchStub, () => ({
          assay: {
            loading: false,
            lastRefreshed: subMinutes(new Date(), 7)
          }
        }))
      })

      it('should dispatch a REQUEST_ASSAYS action', () => {
        expect(dispatchStub.firstCall.args).toEqual([{ type: AssayRedux.types.REQUEST_ASSAYS }])
      })

      it('should request the account details from the server', () => {
        expect(fetchStub.aspectFetch.calledWith('/assay')).toBeTruthy()
      })
    })
  })
})
