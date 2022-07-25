import { defineMessages, injectIntl } from 'react-intl'
import React from 'react'
import AspectButton from '../../../components/shared/AspectButton'
import DetailBackBar from '../../../globals/components/DetailBackBar'

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

export const DeviceDetailBackBar = ({ intl, navigate, location, params, title, disabled }) => {
  const onBackClick = () => {
    navigate(-1)
  }
  const onPathClick = path => {
    navigate({
      pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => params[key]),
    })
  }
  return (
    <DetailBackBar onBackClick={onBackClick} title={title}>
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
          inverse={location.pathname !== path && !disabled}
        >
          {label}
        </AspectButton>
      ))}
    </DetailBackBar>
  )
}

export default injectIntl(DeviceDetailBackBar)
