import { isSharedParameter, pickSharedValues, sharedWireKeys } from '../parameterCache'

// Wire shape the API serves for the pre-feature global filter set (shared derived server-side)
const GLOBAL_FILTER_PARAMETERS = [
  { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' }, shared: true },
  { name: 'stateId', type: 'state', shared: true },
  { name: 'lgaId', type: 'lga', dependsOn: 'stateId', shared: true },
  { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view', shared: true },
  { name: 'assayId', type: 'assay', multiple: true, shared: true },
  { name: 'consumableId', type: 'consumable', shared: true },
]

describe('parameterCache', () => {
  const decommissioned = { name: 'showDecommissionedDevices', type: 'boolean', default: false, shared: false }

  it('shares the server-flagged defs and keeps everything else report-local', () => {
    GLOBAL_FILTER_PARAMETERS.forEach(def => {
      expect(isSharedParameter(def)).toBe(true)
    })
    expect(isSharedParameter({ name: 'groupBy', type: 'enum' })).toBe(false)
    expect(isSharedParameter({ name: 'errorThreshold', type: 'number' })).toBe(false)
    expect(isSharedParameter({ name: 'comment', type: 'text' })).toBe(false)
    expect(isSharedParameter(decommissioned)).toBe(false)
  })

  it('treats defs from an API that does not send the flag yet as report-local', () => {
    expect(isSharedParameter({ name: 'stateId', type: 'state' })).toBe(false)
  })

  it('maps a shared dateRange to the minDate/maxDate wire keys', () => {
    expect(sharedWireKeys(GLOBAL_FILTER_PARAMETERS)).toEqual([
      'minDate',
      'maxDate',
      'stateId',
      'lgaId',
      'siteName',
      'assayId',
      'consumableId',
    ])
  })

  it('publishes only shared values from a submission (report-local values stay local)', () => {
    const parameters = [...GLOBAL_FILTER_PARAMETERS, decommissioned]
    const submitted = { stateId: 5, minDate: '2026-07-01', showDecommissionedDevices: true }

    expect(pickSharedValues(parameters, submitted)).toEqual({ stateId: 5, minDate: '2026-07-01' })
  })

  it('never picks a report-local value from another report submission', () => {
    const lastSubmission = { stateId: 5, showDecommissionedDevices: true }

    expect(pickSharedValues([...GLOBAL_FILTER_PARAMETERS, decommissioned], lastSubmission)).toEqual({ stateId: 5 })
  })

  it('tolerates a missing values object', () => {
    expect(pickSharedValues(GLOBAL_FILTER_PARAMETERS, undefined)).toEqual({})
  })
})
