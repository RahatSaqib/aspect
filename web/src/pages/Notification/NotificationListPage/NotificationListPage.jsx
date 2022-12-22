import React from 'react'
import { Card, CardContent, Box } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useNavigate, useLocation } from 'react-router-dom'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import useI18n from '../../../hooks/useI18n'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import { reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { useAuthState } from '../../../providers/AuthProvider'
import messages from './messages'
import styles from './NotificationListPage.css'
import tableConfig from './NotificationListPageTableConfig'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { notificationName: true, requiredPermissions: [] },
]

const NotificationList = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { userPermissions } = useAuthState()
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  return (
    <>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <div className={cssClasses('filters__container')}>
        <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters}>
          <AspectButton
            type="button"
            color="primary"
            variant="contained"
            browseButton
            onClick={event => {
              event.stopPropagation()
              navigate('/browse/notification/create')
            }}
          >
            {intl.formatMessage(messages.createNotification)}
          </AspectButton>
        </BrowseFilters>
      </div>
      <Box component="main" sx={{ pr: 1, pl: 1, pb: 1 }}>
        <Card>
          <CardContent>
            <AspectTable baseConfig={tableConfig} consts={NOTIFICATION_LIST} FILTERS_CONFIG={FILTERS_CONFIG} />
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default NotificationList
