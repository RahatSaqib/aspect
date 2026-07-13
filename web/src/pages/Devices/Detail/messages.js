import { defineMessages } from 'react-intl'

export default defineMessages({
  profile: { id: 'pages.DeviceDetail.profile', defaultMessage: 'Profile' },
  operation: { id: 'pages.DeviceDetail.operation', defaultMessage: 'Operation' },
  alerts: { id: 'pages.DeviceDetail.alerts', defaultMessage: 'Alerts' },
  edit: { id: 'pages.DeviceDetail.edit', defaultMessage: 'Edit' },
  deviceNotFound: { id: 'pages.DeviceDetail.deviceNotFound', defaultMessage: 'Device not found.' },
  undeployed: { id: 'pages.DeviceDetail.undeployed', defaultMessage: 'Undeployed' },
  decommission: { id: 'pages.DeviceDetail.decommission', defaultMessage: 'Decommission' },
  decommissionFailed: {
    id: 'pages.DeviceDetail.decommissionFailed',
    defaultMessage: 'Failed to decommission the device.',
  },
  cannotDecommissionExplanation: {
    id: 'pages.DeviceDetail.cannotDecommissionExplanation',
    defaultMessage:
      'Cannot decommission. A device must be deployed to be decommissioned, otherwise any result it has produced would remain unassigned to any site.',
  },
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
  onlyApprovedDevicesCanBeDecommissioned: {
    id: 'pages.DeviceDetail.onlyApprovedDevicesCanBeDecommissioned',
    defaultMessage: 'Only approved devices can be decommissioned.',
  },
  deviceMustHaveDeploymentToBeDecommissioned: {
    id: 'pages.DeviceDetail.deviceMustHaveDeploymentToBeDecommissioned',
    defaultMessage: 'A device must have a deployment before it can be decommissioned.',
  },
  deviceAlreadyDecommissioned: {
    id: 'pages.DeviceDetail.deviceAlreadyDecommissioned',
    defaultMessage: 'This device is already decommissioned.',
  },
  reactivate: { id: 'pages.DeviceDetail.reactivate', defaultMessage: 'Reactivate' },
  reactivateFailed: {
    id: 'pages.DeviceDetail.reactivateFailed',
    defaultMessage: 'Failed to reactivate the device.',
  },
  reactivateConfirmTitle: { id: 'pages.DeviceDetail.reactivateConfirmTitle', defaultMessage: 'Reactivate' },
  reactivateSite: { id: 'pages.DeviceDetail.reactivateSite', defaultMessage: 'Site' },
  onlyDecommissionedDevicesCanBeReactivated: {
    id: 'pages.DeviceDetail.onlyDecommissionedDevicesCanBeReactivated',
    defaultMessage: 'Only decommissioned devices can be reactivated.',
  },
  deviceHasNoDeploymentsToReactivate: {
    id: 'pages.DeviceDetail.deviceHasNoDeploymentsToReactivate',
    defaultMessage: 'This device has no deployments to reactivate.',
  },
  decommissionedDeviceCannotBeEdited: {
    id: 'pages.DeviceDetail.decommissionedDeviceCannotBeEdited',
    defaultMessage: 'A decommissioned device cannot be edited.',
  },
})
