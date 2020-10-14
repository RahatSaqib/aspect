import React from 'react'
import { useQuery } from 'react-query'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../Table'

import { mockDatafetch } from '../../Table/Helpers'

import config from './config'

function NotificationList() {
  const {
    isError,
    data: { data: tableData } = false,
    error,
  } = useQuery('mockTableData', async () => mockDatafetch(230))

  if (isError) {
    throw new Error(error)
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
