import React, { Fragment } from 'react'
import { Card, CardContent } from '@mui/material'
import classnames from 'classnames/bind'
import get from 'lodash/get'
import { Helmet } from 'react-helmet'
import { useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader, NotificationFilter } from '../../../cleanComponents'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import useI18n from '../../../hooks/useI18n'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import styles from './NotificationLogsPage.css'
import baseConfig from './NotificationLogsPageTableConfig'

const cssClasses = classnames.bind(styles)

const NotificationHistoryPage = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  const onClickRow = ({ column, row }) => {
    const url = column.link.url.replace(`:${column.link.key}`, get(row.original, column.link.key))
    gotoWithReturnUrl(url, navigate, location)
  }

  return (
    <Fragment>
      <DetailHeader name={intl.formatMessage(messages.notificationLogs)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.notificationLogs)} />
        <NotificationFilter />
        <Card>
          <CardContent>
            <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_LIST} onClickRow={onClickRow} />
          </CardContent>
        </Card>
      </div>
    </Fragment>
  )
}

export default NotificationHistoryPage
