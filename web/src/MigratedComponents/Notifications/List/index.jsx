import React, { useState } from 'react'
import { useQuery } from 'react-query'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../Table'

import { mockDatafetch } from '../../Table/Helpers'

import config from './config'

function NotificationList() {
  const [data, setData] = useState(false)

  const { isError, error } = useQuery(
    'mockTableData',
    async () => mockDatafetch(230),
    {
      onSuccess: ({ data }) => setData(data),
    }
  )

  if (isError) {
    throw new Error(error)
  }

  return data && data.length ? (
    <Shell>
      <ShellContent>
        <AspectTable tableData={data} config={config} />
      </ShellContent>
    </Shell>
  ) : null
}

export default NotificationList
