import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useIntl } from 'react-intl'

import Shell from '../../../Shell'
import ShellContent from '../../../Shell/Content'
import { AspectTable } from '../../../AspectTable'

import { mockDatafetch } from '../../../AspectTable/Helpers'
import baseConfig from './config'

function NotificationList() {
  const intl = useIntl()
  const [data, setData] = useState(false)
  const config = baseConfig(intl)

  const { isError, error } = useQuery(
    'mockTableData',
    async () => mockDatafetch(86),
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
