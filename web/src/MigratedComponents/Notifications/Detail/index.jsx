import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { IoIosArrowBack } from 'react-icons/io'
import { useParams } from 'react-router-dom'

import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import NotificationDetailHistory from './history/NotificationDetailHistory'
import AspectButton from '../../../components/shared/AspectButton'

const AspectNotificationDetails = props => {
  const { notificationId } = useParams()

  const notification = useSelector(state => state.notification)

  return (
    <Shell>
      <ShellHeader
        title={notification?.items?.byId.toJS()[notificationId]?.name}
      >
        <AspectButton color="primary" variant="contained">
          History
        </AspectButton>
      </ShellHeader>
      <ShellContent>
        <NotificationDetailHistory notificationId={notificationId} {...props} />
      </ShellContent>
    </Shell>
  )
}

AspectNotificationDetails.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectNotificationDetails
