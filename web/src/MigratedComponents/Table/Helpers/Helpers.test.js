import { buildColumnsFromData } from './index'

describe('Table Helpers', () => {
  describe('Build Columns', () => {
    it('should build correct column details based on the config', () => {
      const input = {
        columns: [
          { key: 'name', label: 'Name', disableSortBy: true },
          { key: 'lastTriggeredOn', label: 'Last Triggered' },
          { key: 'totalTriggers', label: 'Total Triggers' },
          { key: 'contacts', label: 'Contacts' },
        ],
      }

      const output = [
        {
          Header: 'Name',
          accessor: 'name',
          disableSortBy: true,
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
        },
      ]

      const grouped = buildColumnsFromData(input)
      expect(grouped).toEqual(output)
    })
  })
})
