import messages from './messages'

export function getColumns(intl, breakOutByLot, enableInventoryOnHandField) {
  return [
    {
      key: 'siteName',
      label: intl.formatMessage(messages.siteName),
      sortable: true,
    },
    {
      key: 'consumableName',
      label: intl.formatMessage(messages.consumableName),
      sortable: true,
    },
    {
      key: 'quantityOnHand',
      label: intl.formatMessage(messages.quantityOnHand),
      sortable: true,
      tooltip: intl.formatMessage(messages.quantityOnHandDescription),
    },
    {
      key: 'dailyConsumptionRate',
      label: intl.formatMessage(messages.dailyConsumptionRate),
      sortable: true,
      isHidden: breakOutByLot,
      tooltip: intl.formatMessage(messages.dailyConsumptionRateDescription),
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
      sortable: true,
      isHidden: !breakOutByLot,
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
      isHidden: !breakOutByLot,
    },
    {
      key: 'newQuantity',
      label: intl.formatMessage(messages.newQuantityOnHand),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'inc-dec',
      label: intl.formatMessage(messages.resultQuantityOnHand),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'notes',
      label: intl.formatMessage(messages.inventoryOnNote),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'daysStockLeft',
      label: intl.formatMessage(messages.daysStockLeft),
      tooltip: intl.formatMessage(messages.daysStockLeftDescription),
      sortable: true,
      isHidden: breakOutByLot,
    },
    {
      key: 'projectedWaste',
      label: intl.formatMessage(messages.projectedWaste),
      tooltip: intl.formatMessage(messages.projectedWasteDescription),
      sortable: true,
      isHidden: breakOutByLot,
    },
    {
      key: 'action',
    },
  ]
}
