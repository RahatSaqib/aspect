import { defineMessages } from 'react-intl'

export default defineMessages({
  profile: { id: 'pages.DeviceDetail.profile', defaultMessage: 'Profile' },
  operation: { id: 'pages.DeviceDetail.operation', defaultMessage: 'Operation' },
  alerts: { id: 'pages.DeviceDetail.alerts', defaultMessage: 'Alerts' },
  edit: { id: 'pages.DeviceDetail.edit', defaultMessage: 'Edit' },
  deviceNotFound: { id: 'pages.DeviceDetail.deviceNotFound', defaultMessage: 'Device not found.' },
  undeployed: { id: 'pages.DeviceDetail.undeployed', defaultMessage: 'Undeployed' },
  decommission: { id: 'pages.DeviceDetail.decommission', defaultMessage: 'Decommission' },
  decommissionConfirmTitle: {
    id: 'pages.DeviceDetail.decommissionConfirmTitle',
    defaultMessage: 'Decommission',
  },
  decommissionConfirmMessage: {
    id: 'pages.DeviceDetail.decommissionConfirmMessage',
    defaultMessage:
      'Once decommissioned, this device will no longer appear in active-device lists, counts, or reports. The results it has already produced stay valid and will keep appearing in every result view and result count.',
  },
  decommissionedTitleSuffix: {
    id: 'pages.DeviceDetail.decommissionedTitleSuffix',
    defaultMessage: '(Decommissioned)',
  },
  decommissionOnlyApprovedTooltip: {
    id: 'pages.DeviceDetail.decommissionOnlyApprovedTooltip',
    defaultMessage: 'Only Approved Devices can be Decommissioned',
  },
  reactivate: { id: 'pages.DeviceDetail.reactivate', defaultMessage: 'Reactivate' },
  reactivateConfirmTitle: { id: 'pages.DeviceDetail.reactivateConfirmTitle', defaultMessage: 'Reactivate' },
  reactivateSite: { id: 'pages.DeviceDetail.reactivateSite', defaultMessage: 'Site' },
})
