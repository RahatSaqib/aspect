import React from 'react'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import { AspectTable } from '../../AspectTable'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'
import baseConfig from './config'

const NotificationList = () => {
  return (
    <Shell>
      <ShellContent>
        <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_LIST} />
      </ShellContent>
    </Shell>
  )
}

export default NotificationList
