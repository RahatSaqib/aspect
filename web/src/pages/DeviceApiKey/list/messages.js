import { defineMessages } from 'react-intl'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceApiKeyList.title',
    defaultMessage: 'Device API Keys',
  },
  /* ---------------- Dialog ----------------- */
  generate: {
    id: 'pages.DeviceApiKeyList.generate',
    defaultMessage: 'Generate',
  },
  generateSuccess: {
    id: 'pages.DeviceApiKeyList.generateSuccess',
    defaultMessage: 'Device API keys generated successfully',
  },
  generateError: {
    id: 'pages.DeviceApiKeyList.generateError',
    defaultMessage: 'Device API keys could not be generated. Please try again.',
  },
  /* ---------------- Table ----------------- */
  createdOn: {
    id: 'pages.DeviceApiKeyList.createdOn',
    defaultMessage: 'Created On',
  },
  token: {
    id: 'pages.DeviceApiKeyList.token',
    defaultMessage: 'Key',
  },
  partner: {
    id: 'pages.DeviceApiKeyList.partner',
    defaultMessage: 'Partner',
  },
  country: {
    id: 'pages.DeviceApiKeyList.country',
    defaultMessage: 'Country',
  },
  site: {
    id: 'pages.DeviceApiKeyList.site',
    defaultMessage: 'Site',
  },
  siteDevicePairs: {
    id: 'pages.DeviceApiKeyList.siteDevicePairs',
    defaultMessage: 'Site / Device',
  },
  device: {
    id: 'pages.DeviceApiKeyList.device',
    defaultMessage: 'Device',
  },
  revoked: {
    id: 'pages.DeviceApiKeyList.revoked',
    defaultMessage: 'Revoked',
  },
  paginatorStatus: {
    id: 'pages.DeviceApiKeyList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# device API key}
      other {# device API keys}
    }`,
  },
})

export default messages
