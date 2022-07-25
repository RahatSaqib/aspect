import React, { Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import get from 'lodash/get'

import { gotoWithReturnUrl } from '../../../../shared/utils/browser'
import useI18n from '../../../../Hooks/i18n/useI18n'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import AspectTable from '../../../AspectTable'
import { NOTIFICATION_HISTORY } from '../../../QueryFetch/Notification'
import baseConfig from './config'

import styles from '../NotificationDetail.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.notificationsTitle',
    defaultMessage: 'Notifications History',
  },
  backButton: {
    id: 'pages.NotificationList.backButton',
    defaultMessage: 'Back',
  },
})

const NotificationList = () => {
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  const onClickRow = ({ column, row }) => {
    const url = column.link.url.replace(`:${column.link.key}`, get(row.original, column.link.key))
    gotoWithReturnUrl(url, navigate, location)
  }

  return (
    <Fragment>
      <Helmet title={formatMessage(messages.notificationsTitle)} />
      <Shell>
        <ShellHeader
          title={formatMessage(messages.notificationsTitle)}
          // style={{ paddingTop: '2px', paddingBottom: '2px' }}
          className={cssClasses('logs-header')}
        >
          <Button variant="contained" color="primary" onClick={() => navigate('/browse/notification')}>
            {formatMessage(messages.backButton)}
          </Button>
        </ShellHeader>
        <ShellContent>
          <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_HISTORY} onClickRow={onClickRow} />
        </ShellContent>
      </Shell>
      {/* </div> */}
    </Fragment>
  )
}

export default NotificationList
