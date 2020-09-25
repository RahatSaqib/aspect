import React from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'

import { useQueryCache } from 'react-query'
import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import NotificationDetailHistory from './history/NotificationDetailHistory'
import AspectButton from '../../../components/shared/AspectButton'

const AspectNotificationDetails = ({ location, history }) => {
  const { notificationId } = useParams()

  const notificationQueryData = useQueryCache().getQueryData([
    'notificationList',
    0,
    10,
    '?filters=',
  ])

  const notification = notificationQueryData?.data?.filter(
    x => x.id === notificationId
  )[0]

  return (
    <Shell>
      <ShellHeader title={notification?.name || 'Notifications'}>
        <AspectButton color="primary" variant="contained">
          History
        </AspectButton>
      </ShellHeader>
      <ShellContent>
        <NotificationDetailHistory
          notificationId={notificationId}
          location={location}
          history={history}
        />
      </ShellContent>
    </Shell>
  )
}

AspectNotificationDetails.propTypes = {
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectNotificationDetails
