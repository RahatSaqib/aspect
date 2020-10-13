import { buildColumnsFromData } from './index'
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
})
