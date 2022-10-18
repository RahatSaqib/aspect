import { buildColumnsFromData, getFirstAndLastVisibleRowNumbers } from './index'

const config = {
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: 'Last Triggered',
      width: 20,
      disableHide: true,
    },
    {
      key: 'name',
      label: 'Name',
      width: 35,
    },
    {
      key: 'totalTriggers',
      label: 'Total Triggers',
      width: 20,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      disableSortBy: true,
      width: 25,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
}

describe('Table Helpers', () => {
  describe('Build Columns', () => {
    it('should build correct column details based on the config', () => {
      const output = {
        columns: [
          {
            Header: 'Last Triggered',
            accessor: 'lastTriggeredOn',
          },
          {
            Header: 'Name',
            accessor: 'name',
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
        ],
        initialSortBy: false,
        columnOrder: {
          allow: true,
          initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
        },
      }

      const grouped = buildColumnsFromData(config)
      /**
       * toMatchObject only loosely matches on expected keys.
       * toStrictEqual will match exact keys to exact values
       */
      expect(grouped).toMatchObject(output)
    })
  })

  describe('Calculate Now Showing', () => {
    it('should display nothing if incorrect values passed', () => {
      const { dataLength, pageIndex, pageSize } = {
        dataLength: 48,
        pageIndex: 2, // will not have a page three
        pageSize: 50,
      }
      const grouped = getFirstAndLastVisibleRowNumbers(dataLength, pageIndex, pageSize)
      expect(grouped).toEqual(false)
    })

    it('should display the correct values when pagination is used', () => {
      const { dataLength, pageIndex, pageSize } = {
        dataLength: 148,
        pageIndex: 2,
        pageSize: 25,
      }
      const grouped = getFirstAndLastVisibleRowNumbers(dataLength, pageIndex, pageSize)
      expect(grouped).toEqual([51, 75])
    })
  })
})
