import React, { useEffect, useState } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../AspectTable'
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
