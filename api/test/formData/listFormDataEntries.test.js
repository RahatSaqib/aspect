const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('formData listFormDataEntries', () => {
  let getConstraintsStub
  let buildBaseQueryStub
  let sortPageParamsStub
  let parseRowStub
  let enrichWithFormFieldsStub
  let listQb
  let countQb
  let listRows
  let countRow
  let listFormDataEntries

  const DEFAULT_LIST_DATES = {
    minDate: '2026-01-01T00:00:00.000Z',
    maxDate: '2026-12-31T23:59:59.999Z',
  }

  const buildRequest = ({ query = {} } = {}) => ({
    query: { ...DEFAULT_LIST_DATES, ...query },
    auth: { credentials: { name: 'client-user' } },
  })

  // Chainable query-builder fake for the inline DB reads.
  const makeQb = () => {
    const qb = {}
    ;['modify', 'select', 'orderBy', 'where', 'countDistinct'].forEach(method => {
      qb[method] = sinon.stub().returns(qb)
    })
    return qb
  }

  // The filters object passed to applyListFilters, and the sort/page query passed to
  // sortPageParams, are both delivered via `.modify(fn, arg)`. Distinguish them by the
  // (stubbed) sortPageParams ref.
  const getListFilters = () => listQb.modify.getCalls().find(call => call.args[0] !== sortPageParamsStub).args[1]
  const getListSortPage = () => listQb.modify.getCalls().find(call => call.args[0] === sortPageParamsStub).args[1]

  beforeEach(() => {
    listRows = []
    countRow = { total: '2' }

    getConstraintsStub = sinon.stub().resolves({ partner: { id: 91 } })
    sortPageParamsStub = sinon.stub()
    parseRowStub = sinon.stub().callsFake(row => ({ ...row, parsed: true }))
    enrichWithFormFieldsStub = sinon.stub().callsFake(async row => ({ ...row, formFields: [] }))

    // getFormDataEntries awaits the builder directly → make it thenable, resolving rows.
    listQb = makeQb()
    listQb.then = (resolve, reject) => Promise.resolve(listRows).then(resolve, reject)
    // countFormDataEntries terminates with `.first()` → resolve the count row.
    countQb = makeQb()
    countQb.first = sinon.stub().callsFake(() => Promise.resolve(countRow))

    buildBaseQueryStub = sinon.stub()
    buildBaseQueryStub.onCall(0).returns(listQb)
    buildBaseQueryStub.onCall(1).returns(countQb)
    ;({ listFormDataEntries } = proxyquire('../../src/formData/listFormDataEntries', {
      '../db': { sortPageParams: sortPageParamsStub },
      '../auth/constraints': { getConstraints: getConstraintsStub },
      './db': { buildBaseQuery: buildBaseQueryStub },
      './formFieldsService': { parseRow: parseRowStub, enrichWithFormFields: enrichWithFormFieldsStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns the standard list response shape with parsed, enriched rows', async () => {
    listRows = [
      { id: 5, siteName: 'Site A' },
      { id: 6, siteName: 'Site B' },
    ]

    const response = await listFormDataEntries(buildRequest())

    assert.deepEqual(Object.keys(response), ['ok', 'total', 'length', 'data'])
    assert.isTrue(response.ok)
    assert.equal(response.total, 2)
    assert.equal(response.length, 2)
    assert.equal(response.data.length, 2)
    assert.equal(response.data[0].id, 5)
    assert.deepEqual(response.data[0].formFields, [])
    // Each row flows through parseRow then enrichWithFormFields (with the partnerId).
    sinon.assert.calledTwice(parseRowStub)
    sinon.assert.calledTwice(enrichWithFormFieldsStub)
    assert.equal(enrichWithFormFieldsStub.firstCall.args[1], 91)
  })

  it('passes through explicit minDate, maxDate, siteId and sampleExternalId filters', async () => {
    const minDate = '2026-02-01T00:00:00.000Z'
    const maxDate = '2026-02-28T23:59:59.000Z'

    await listFormDataEntries(buildRequest({ query: { minDate, maxDate, siteId: 42, sampleExternalId: 'sample-xyz' } }))

    const filters = getListFilters()
    assert.equal(filters.minDate.toISOString(), '2026-02-01T00:00:00.000Z')
    assert.equal(filters.maxDate.toISOString(), '2026-02-28T23:59:59.000Z')
    assert.equal(filters.siteId, 42)
    assert.equal(filters.sampleExternalId, 'sample-xyz')
  })

  it('forwards pagination params (page/size) to the sort/page query', async () => {
    await listFormDataEntries(buildRequest({ query: { page: 2, size: 25 } }))

    const sortPageQuery = getListSortPage()
    assert.equal(sortPageQuery.page, 2)
    assert.equal(sortPageQuery.size, 25)
  })

  it('forwards sort params (sortCol/sortDir) to the sort/page query', async () => {
    await listFormDataEntries(buildRequest({ query: { sortCol: 'siteName', sortDir: 'asc' } }))

    const sortPageQuery = getListSortPage()
    assert.equal(sortPageQuery.sortCol, 'siteName')
    assert.equal(sortPageQuery.sortDir, 'asc')
  })

  it("normalizes matched='true' to boolean true", async () => {
    await listFormDataEntries(buildRequest({ query: { matched: 'true' } }))
    assert.strictEqual(getListFilters().matched, true)
  })

  it("normalizes matched='false' to boolean false", async () => {
    await listFormDataEntries(buildRequest({ query: { matched: 'false' } }))
    assert.strictEqual(getListFilters().matched, false)
  })

  it('keeps boolean matched values as-is', async () => {
    await listFormDataEntries(buildRequest({ query: { matched: true } }))
    assert.strictEqual(getListFilters().matched, true)
  })

  it('leaves matched undefined when the param is absent', async () => {
    await listFormDataEntries(buildRequest({ query: {} }))
    assert.strictEqual(getListFilters().matched, undefined)
  })

  it('coerces a null count row total to 0', async () => {
    countRow = { total: null }

    const response = await listFormDataEntries(buildRequest())

    assert.equal(response.total, 0)
  })
})
