/**
 * name: 'string'
 * columns: 'array'
 *  { key: 'string', label: 'string', disableSortBy: 'bool' [optional], width: 'number' [optional] }
 * columnOrder: { allow: 'bool', initialOrder: 'array' * required if allow === true },
 * hiddenColumns
 */

const config = {
  name: 'notification',
  columns: [
    { key: 'lastTriggeredOn', label: 'Last Triggered', width: 20 },
    { key: 'name', label: 'Name', width: 35 },
    { key: 'totalTriggers', label: 'Total Triggers', width: 20 },
    { key: 'contacts', label: 'Contacts', disableSortBy: true, width: 25 },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
}

export default config
