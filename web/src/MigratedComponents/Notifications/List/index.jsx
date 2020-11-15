import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { usePaginatedQuery } from 'react-query'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../AspectTable'

import fetchWrapperForQueries from '../../QueryFetch'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'

import baseConfig from './config'

function NotificationList() {
  const intl = useIntl()
  const config = baseConfig(intl)
  const [data, setData] = useState(false)
  const [params, setParams] = useState(false)

  const { error, isError, isLoading } = usePaginatedQuery(
    [NOTIFICATION_LIST.KEY, { params }],
    async (_queryId, { params }) =>
      fetchWrapperForQueries({
        endpoint: NOTIFICATION_LIST.ENDPOINT,
        params,
      }),
    { onSuccess: ({ total, data }) => setData({ total, data }) }
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <Shell>
      <ShellContent>
        {!data || isLoading ? (
          <div>Loading</div>
        ) : (
          <AspectTable
            config={config}
            tableData={data}
            setUrlParams={setParams}
          />
        )}
      </ShellContent>
    </Shell>
  )
}

export default NotificationList
