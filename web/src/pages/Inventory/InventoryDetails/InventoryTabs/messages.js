import { defineMessages } from 'react-intl'

export default defineMessages({
  assay: {
    id: 'pages.InventoryTabs.New.assay',
    defaultMessage: 'Assay',
  },
  errorUpdatingSites: {
    id: 'pages.InventoryTabs.New.errorUpdatingSites',
    defaultMessage: 'Error updating sites',
  },
  sitesUpdatedSuccessfully: {
    id: 'pages.InventoryTabs.New.sitesUpdatedSuccessfully',
    defaultMessage: 'Sites updated successfully',
  },
  quantity: {
    id: 'pages.InventoryTabs.New.quantity',
    defaultMessage: 'Quantity',
  },
  sitesByConsumable: {
    id: 'pages.InventoryTabs.New.sitesByConsumable',
    defaultMessage: 'Sites by Consumable',
  },
  sitesByConsumableTooltip: {
    id: 'pages.InventoryTabs.New.sitesByConsumableTooltip',
    defaultMessage:
      'Some sites may appear unavailable for selection change as they have inventory or unreconciled transactions for the selected Inventory item',
  },
  selectAllLocations: {
    id: 'pages.InventoryTabs.siteList.selectAllLocations',
    defaultMessage: 'Select all Locations to track inventory for this item',
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
  locationsWithThisItem: {
    id: 'pages.InventoryTabs.New.locationsWithThisItem',
    defaultMessage: 'Locations with this Item',
  },
})
