import React, { Fragment } from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import get from 'lodash/get'
import { Helmet } from 'react-helmet'
import { useNavigate, useLocation } from 'react-router-dom'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_HISTORY } from '../../../components/QueryFetch/Notification'
import { Shell, ShellHeader, ShellContent } from '../../../components/Shell'
import useI18n from '../../../hooks/useI18n'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import styles from './NotificationHistoryPage.css'
import baseConfig from './NotificationHistoryPageTableConfig'

const cssClasses = classnames.bind(styles)

const NotificationHistoryPage = () => {
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
        <ShellHeader title={formatMessage(messages.notificationsTitle)} className={cssClasses('logs-header')}>
          <Button variant="contained" color="primary" onClick={() => navigate('/browse/notification')}>
            {formatMessage(messages.backButton)}
          </Button>
        </ShellHeader>
        <ShellContent>
          <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_HISTORY} onClickRow={onClickRow} />
        </ShellContent>
      </Shell>
    </Fragment>
  )
}

export default NotificationHistoryPage
