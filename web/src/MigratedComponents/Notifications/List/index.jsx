import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { usePaginatedQuery } from 'react-query'
import isEqual from 'lodash/isEqual'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../AspectTable'

import fetchWrapperForQueries from '../../QueryFetch'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'

import baseConfig from './config'

function NotificationList() {
  const intl = useIntl()
  const config = baseConfig(intl)
  const [tableData, setTableData] = useState(false)
  const [params] = useState(false)

  const { error, isError, isLoading } = usePaginatedQuery(
    [NOTIFICATION_LIST.KEY, { params }],
    async (_queryId, { params }) =>
      fetchWrapperForQueries({
        endpoint: NOTIFICATION_LIST.ENDPOINT,
        params,
      }),
    {
      onSuccess: ({ total, data }) => {
        return !isEqual(data, tableData.data)
          ? setTableData({ total, data })
          : false
      },
    }
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <Shell>
      <ShellContent>
        {!tableData || isLoading ? (
          <div>Loading</div>
        ) : (
          <AspectTable
            config={config}
            tableData={tableData}
            initialParams={params}
          />
        )}
      </ShellContent>
    </Shell>
  )
}

export default NotificationList
