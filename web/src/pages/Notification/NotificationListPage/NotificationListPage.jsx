import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import AspectTable from '../../../components/AspectTable'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import { Shell, ShellContent } from '../../../components/Shell'
import useI18n from '../../../hooks/useI18n'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import { reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
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
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  return (
    <Fragment>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
      <div className={cssClasses('filters__container')}>
        <BrowseFilters config={reducedFilters}>
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
