import buildMarkersForDailyStatus from '../Helpers'
import {
  devicesDaily,
  visibleStatusesAll,
  visibleStatusesOnlyActive,
  visibleStatusesOnlyDownForRepair,
  visibleAllExpected,
  visibleOnlyActiveExpected,
  visibleOnlyDownForRepairExpected,
} from './mocks'

describe('DailyStatusMaps', () => {
  it('should not filter any results out', () => {
    const filtered = buildMarkersForDailyStatus(devicesDaily, visibleStatusesAll)
    expect(filtered).toEqual(visibleAllExpected)
  })

  it('should filter and display active only', () => {
    const filtered = buildMarkersForDailyStatus(devicesDaily, visibleStatusesOnlyActive)
    expect(filtered).toEqual(visibleOnlyActiveExpected)
  })

  it('should filter and display inactiveDownForRepair only', () => {
    const filtered = buildMarkersForDailyStatus(devicesDaily, visibleStatusesOnlyDownForRepair)
    expect(filtered).toEqual(visibleOnlyDownForRepairExpected)
  })
})
