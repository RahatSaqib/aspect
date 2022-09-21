import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    sitesTitle: {
      id: 'pages.SiteList.title',
      defaultMessage: 'Sites',
    },
    siteName: {
      id: 'pages.SiteList.siteName',
      defaultMessage: 'Name',
    },
    totalDevices: {
      id: 'pages.SiteList.totalDevices',
      defaultMessage: 'Number of Devices',
    },
    externalId: {
      id: 'pages.SiteList.externalId',
      defaultMessage: 'Site ID',
    },
    siteIssues: {
      id: 'pages.SiteList.siteIssues',
      defaultMessage: 'Issues',
    },
    issueCategoryDeviceHealth: {
      id: 'pages.SiteList.issueCategoryDeviceHealth',
      defaultMessage: 'Device',
    },
    issueCategoryReagentHealth: {
      id: 'pages.SiteList.issueCategoryReagentHealth',
      defaultMessage: 'Reagent',
    },
    issueCategoryDataHealth: {
      id: 'pages.SiteList.issueCategoryDataHealth',
      defaultMessage: 'Data',
    },
    issueCategoryConnectivityHealth: {
      id: 'pages.SiteList.issueCategoryConnectivityHealth',
      defaultMessage: 'Connectivity',
    },
    paginatorStatus: {
      id: 'pages.SiteList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# site}
      other {# sites}
    }`,
    },
    latestInventoryUpdate: {
      id: 'pages.SiteList.latestInventoryUpdate',
      defaultMessage: 'Latest Inventory Update',
    },
    createSite: {
      id: 'pages.SiteList.createSite',
      defaultMessage: 'Create Site',
    },
  }),
}

export default messages
