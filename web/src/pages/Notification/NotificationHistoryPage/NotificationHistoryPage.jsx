import React, { Fragment } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import get from 'lodash/get'
import { Helmet } from 'react-helmet'
import { useNavigate, useLocation } from 'react-router-dom'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_HISTORY } from '../../../components/QueryFetch/Notification'
import useI18n from '../../../hooks/useI18n'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import baseConfig from './NotificationHistoryPageTableConfig'

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
      <DetailHeader name={formatMessage(messages.notificationsTitle)} back="/browse/notification" />
      <Box component="main" sx={{ p: 1, width: '100%' }}>
        <Card>
          <CardContent>
            <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_HISTORY} onClickRow={onClickRow} />
          </CardContent>
        </Card>
      </Box>
    </Fragment>
  )
}

export default NotificationHistoryPage
