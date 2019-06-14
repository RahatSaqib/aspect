import { defineMessages } from 'react-intl'
import React from 'react'
import AspectButton from '../../components/shared/AspectButton'
import DetailBackBar from '../../globals/components/DetailBackBar'

const messages = defineMessages({
  profile: {
    id: 'pages.DeviceDetail.profile',
    defaultMessage: 'Profile',
  },
  operation: {
    id: 'pages.DeviceDetail.operation',
    defaultMessage: 'Operation',
  },
  alerts: {
    id: 'pages.DeviceDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.DeviceDetail.edit',
    defaultMessage: 'Edit',
  },
})

const DeviceDetailBackBar = ({
  intl,
  history,
  location,
  match,
  title,
  disabled,
}) => {
  const onBackClick = () => {
    history.goBack()
  }
  const onPathClick = path => {
    history.push({
      pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => match.params[key]),
    })
  }
  return (
    <DetailBackBar
      history={history}
      location={location}
      match={match}
      onBackClick={onBackClick}
      title={title}
    >
      {[
        {
          label: intl.formatMessage(messages.profile),
          path: `/browse/device/:deviceId`,
        },
        {
          label: intl.formatMessage(messages.alerts),
          path: `/browse/device/:deviceId/alerts`,
        },
        {
          label: intl.formatMessage(messages.edit),
          path: `/browse/device/:deviceId/edit`,
          disabled,
        },
      ].map(({ label, path, disabled = false }) => (
        <AspectButton
          key={path}
          onClick={({
            currentTarget: {
              dataset: { path },
            },
          }) => onPathClick(path)}
          disabled={disabled}
          data-path={path}
          color="primary"
          variant="contained"
          inverse={match.path !== path && !disabled}
        >
          {label}
        </AspectButton>
      ))}
    </DetailBackBar>
  )
}

export default DeviceDetailBackBar
