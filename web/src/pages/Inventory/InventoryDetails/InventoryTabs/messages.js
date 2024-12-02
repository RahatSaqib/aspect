import { defineMessages } from 'react-intl'

export default defineMessages({
  assay: {
    id: 'pages.InventoryTabs.New.assay',
    defaultMessage: 'Assay',
  },
  quantity: {
    id: 'pages.InventoryTabs.New.quantity',
    defaultMessage: 'Quantity',
  },
  trackByLocation: {
    id: 'pages.InventoryTabs.New.trackByLocation',
    defaultMessage: 'Track By Location',
  },
  trackByLocationTooltip: {
    id: 'pages.InventoryTabs.New.trackByLocationTooltip',
    defaultMessage:
      'Some sites may appear unavailable for selection change as they have inventory or unreconciled transactions for the selected Inventory item',
  },
  selectAllLocations: {
    id: 'pages.InventoryTabs.siteList.selectAllLocations',
    defaultMessage:
      'Select all Locations to track inventory for this item',
  },
  consumpationRate: {
    id: 'pages.InventoryTabs.New.consumpationRate',
    defaultMessage: 'Consumption Rate',
  },
  headerText: {
    id: 'pages.InventoryTabs.New.headerText',
    defaultMessage: 'Assay that Consume this Item',
  },
  definitionText: {
    id: 'pages.InventoryTabs.New.definitionText',
    defaultMessage: 'Define which Assay consume this inventory item',
  },
  locationswiththisItem: {
    id: 'pages.InventoryTabs.New.locationswiththisItem',
    defaultMessage:
      'Locations with this Item',
  },
})
