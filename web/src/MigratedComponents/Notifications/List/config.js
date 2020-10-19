/**
 * name
 * columns
 * columnOrder: ['contacts', 'name', 'lastTriggeredOn', 'totalTriggers'],
 * hiddenColumns
 */

const config = {
  name: 'notification',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'lastTriggeredOn', label: 'Last Triggered' },
    { key: 'totalTriggers', label: 'Total Triggers' },
    { key: 'contacts', label: 'Contacts', disableSortBy: true },
  ],
}

export default config
