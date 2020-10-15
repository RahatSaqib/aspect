import { buildColumnsFromData, getCurrentVisibleRows } from './index'
import config from '../../Notifications/List/config'

describe('Table Helpers', () => {
  describe('Build Columns', () => {
    it('should build correct column details based on the config', () => {
      const output = [
        {
          Header: 'Name',
          accessor: 'name',
        },
        {
          Header: 'Last Triggered',
          accessor: 'lastTriggeredOn',
        },
        {
          Header: 'Total Triggers',
          accessor: 'totalTriggers',
        },
        {
          Header: 'Contacts',
          accessor: 'contacts',
          disableSortBy: true,
        },
      ]
      const grouped = buildColumnsFromData(config)
      expect(grouped).toEqual(output)
    })
  })

  describe('Calculate Now Showing', () => {
    it('should display the correct values when pagination is used', () => {
      const input = [
        { id: '0', index: 20, depth: 0, cells: [] },
        { id: '1', index: 21, depth: 0, cells: [] },
        { id: '2', index: 22, depth: 0, cells: [] },
        { id: '3', index: 23, depth: 0, cells: [] },
        { id: '4w', index: 24, depth: 0, cells: [] },
      ]

      const grouped = getCurrentVisibleRows(input)
      expect(grouped).toEqual([21, 25])
    })
  })
})
