import React from 'react'
import PropTypes from 'prop-types'
import { defineMessages, injectIntl } from 'react-intl'
import { compose, withHandlers } from 'recompose'
import DetailBackBar from '../../DetailBackBar'
import AspectButton from '../../shared/AspectButton'

const messages = defineMessages({
  view: {
    id: 'pages.NotificationDetail.view',
    defaultMessage: 'View',
  },
  edit: {
    id: 'pages.NotificationDetail.edit',
    defaultMessage: 'Edit',
  },
  history: {
    id: 'pages.NotificationDetail.history',
    defaultMessage: 'History',
  },
})

const enhance = compose(
  injectIntl,
  withHandlers({
    onBackClick:
      ({ navigate }) =>
      () => {
        navigate(-1)
      },
    onPathClick:
      ({ navigate, params }) =>
      path => {
        navigate({
          pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => params[key]),
        })
      },
  })
)

export const NotificationDetailBackBar = ({
  intl,
  location,
  title,
  // --- injected by recompose ---
  onBackClick,
  onPathClick,
  disabled = true,
}) => (
  <DetailBackBar onBackClick={onBackClick} title={title}>
    {[
      {
        label: intl.formatMessage(messages.view),
        path: `/browse/notification/:notificationId`,
        hidden: true,
      },
      {
        label: intl.formatMessage(messages.edit),
        path: `/browse/notification/:notificationId/edit`,
        disabled,
        hidden: true,
      },
      {
        label: intl.formatMessage(messages.history),
        path: `/browse/notification/:notificationId/history`,
        hidden: false,
      },
    ].map(
      ({ label, path, disabled, hidden }) =>
        !hidden && (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => onPathClick(path)}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={location.pathname !== path}
            disabled={disabled}
          >
            {label}
          </AspectButton>
        )
    )}
  </DetailBackBar>
)

NotificationDetailBackBar.propTypes = {
  intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  // history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  // match: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onBackClick: PropTypes.func.isRequired,
  onPathClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
}

export default enhance(NotificationDetailBackBar)
