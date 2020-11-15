import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useIntl } from 'react-intl'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../AspectTable'
import fetchWrapperForQueries from '../../QueryFetch'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'

import baseConfig from './config'

function NotificationList() {
  const intl = useIntl()
  const [data, setData] = useState(false)
  const config = baseConfig(intl)

  const { error, isError, isLoading } = useQuery(
    NOTIFICATION_LIST.KEY,
    async () =>
      fetchWrapperForQueries({ endpoint: NOTIFICATION_LIST.ENDPOINT }),
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
        <AspectTable tableData={data} config={config} loading={isLoading} />
      </ShellContent>
    </Shell>
  ) : null
}

export default NotificationList
