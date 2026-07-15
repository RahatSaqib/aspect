import { LEGACY_REPORT_PARAMETERS } from '../legacyParameters'
import { isSharedParameter, pickSharedValues, sharedWireKeys } from '../parameterCache'

describe('parameterCache', () => {
  const decommissioned = { name: 'showDecommissionedDevices', type: 'boolean', default: false }

  it('shares the six legacy types and keeps everything else report-local', () => {
    LEGACY_REPORT_PARAMETERS.forEach(def => {
      expect(isSharedParameter(def)).toBe(true)
    })
    expect(isSharedParameter({ name: 'groupBy', type: 'enum' })).toBe(false)
    expect(isSharedParameter({ name: 'errorThreshold', type: 'number' })).toBe(false)
    expect(isSharedParameter({ name: 'comment', type: 'text' })).toBe(false)
    expect(isSharedParameter(decommissioned)).toBe(false)
  })

  it('maps a shared dateRange to the minDate/maxDate wire keys', () => {
    expect(sharedWireKeys(LEGACY_REPORT_PARAMETERS)).toEqual([
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
    const parameters = [...LEGACY_REPORT_PARAMETERS, decommissioned]
    const submitted = { stateId: 5, minDate: '2026-07-01', showDecommissionedDevices: true }

    expect(pickSharedValues(parameters, submitted)).toEqual({ stateId: 5, minDate: '2026-07-01' })
  })

  it('never picks a report-local value from another report submission', () => {
    const lastSubmission = { stateId: 5, showDecommissionedDevices: true }

    expect(pickSharedValues([...LEGACY_REPORT_PARAMETERS, decommissioned], lastSubmission)).toEqual({ stateId: 5 })
  })

  it('tolerates a missing values object', () => {
    expect(pickSharedValues(LEGACY_REPORT_PARAMETERS, undefined)).toEqual({})
  })
})
