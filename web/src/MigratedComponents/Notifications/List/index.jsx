import React from 'react'
import { useQuery } from 'react-query'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../Table'

import { mockDatafetch } from '../../Table/Helpers'

function NotificationList() {
  const {
    isError,
    data: { data: tableData } = false,
    error,
  } = useQuery('mockTableData', async () => mockDatafetch())

  if (isError) {
    throw new Error(error)
  }

  const config = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'lastTriggeredOn', label: 'Last Triggered' },
      { key: 'totalTriggers', label: 'Total Triggers' },
      { key: 'contacts', label: 'Contacts', disableSortBy: true },
    ],
  }

  return tableData && tableData.length ? (
    <Shell>
      <ShellContent>
        <AspectTable tableData={tableData} config={config} />
      </ShellContent>
    </Shell>
  ) : null
}

export default NotificationList
