import messages from './messages'

export function getColumns(intl, options) {
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
      key: 'unreconciledQuantity',
      label: intl.formatMessage(messages.unreconciledQuantity),
      tooltip: intl.formatMessage(messages.unreconciledQuantityDescription),
    },
    {
      key: 'dailyConsumptionRate',
      label: intl.formatMessage(messages.dailyConsumptionRate),
      sortable: true,
      isHidden: options.breakOutByLot,
      tooltip: intl.formatMessage(messages.dailyConsumptionRateDescription),
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
      sortable: true,
      isHidden: !(options.breakOutByLot && options.requireLotNumber),
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
      isHidden: !(options.breakOutByLot && options.requireExpirationDate),
    },
    {
      key: 'newQuantity',
      label: intl.formatMessage(messages.newQuantityOnHand),
      isHidden: !options.enableInventoryOnHandField,
    },
    {
      key: 'inc-dec',
      label: intl.formatMessage(messages.resultQuantityOnHand),
      isHidden: !options.enableInventoryOnHandField,
    },
    {
      key: 'notes',
      label: intl.formatMessage(messages.inventoryOnNote),
      isHidden: !options.enableInventoryOnHandField,
    },
    {
      key: 'daysStockLeft',
      label: intl.formatMessage(messages.daysStockLeft),
      tooltip: intl.formatMessage(messages.daysStockLeftDescription),
      sortable: true,
      isHidden: options.breakOutByLot,
    },
    {
      key: 'projectedWaste',
      label: intl.formatMessage(messages.projectedWaste),
      tooltip: intl.formatMessage(messages.projectedWasteDescription),
      sortable: true,
      isHidden: options.breakOutByLot,
    },
    {
      key: 'action',
    },
  ]
}
