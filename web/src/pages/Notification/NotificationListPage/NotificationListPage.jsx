import React, { Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate, useLocation } from 'react-router-dom'
import classnames from 'classnames/bind'

import NavTitle from '../../../oldComponents/NavTitle'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import { reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import { useAuthState } from '../../../providers/AuthProvider'

import { Shell, ShellContent } from '../../../components/Shell'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import tableConfig from './NotificationListPageTableConfig'

import styles from './NotificationListPage.css'
import useI18n from '../../../hooks/useI18n'
import messages from './messages'
import AspectButton from '../../../oldComponents/shared/AspectButton'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { notificationName: true, requiredPermissions: [] },
]

const NotificationList = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  return (
    <Fragment>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
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
      <div
        /**
         * TODO:temp fix before all tables are placed with
         * the <Shell component />
         */
        style={{ marginTop: '-10px' }}
      >
        <Shell>
          <ShellContent>
            <AspectTable baseConfig={tableConfig} consts={NOTIFICATION_LIST} FILTERS_CONFIG={FILTERS_CONFIG} />
          </ShellContent>
        </Shell>
      </div>
    </Fragment>
  )
}

export default NotificationList
