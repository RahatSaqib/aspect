import React from 'react'
import { useIntl } from 'react-intl'
import useInventoryList from '../../hooks/inventory/useInventoryList'
import { commonDefinitions } from '../../messages'
import AspectSelect from '../AspectSelect'
import messages from './messages'

export default function InventoryItemSelect({ inventoryItem, requireLotNumber, requireExpirationDate, ...props }) {
  const { isLoading: isInventoryListLoading, data: { data: inventoryItems = [] } = {} } = useInventoryList({
    siteId: inventoryItem.siteId,
    consumableId: inventoryItem.consumableId,
    hasStock: true,
    breakOutByLot: true,
  })
  const { formatMessage } = useIntl()

  const itemToString = item => {
    const parts = []

    if (requireLotNumber) {
      parts.push(
        formatMessage(messages.lotNumber, {
          lotNumber: item.lotNumber || formatMessage(commonDefinitions.notAvailable),
        })
      )
    }

    if (requireExpirationDate) {
      parts.push(
        formatMessage(messages.expiresOn, {
          expiresOn: item.expiresOn ? item.expiresOn.split('T')[0] : formatMessage(commonDefinitions.notAvailable),
        })
      )
    }

    parts.push(
      formatMessage(messages.quantity, {
        quantity: item.quantityOnHand,
      })
    )

    return parts.join(' | ')
  }

  return (
    <AspectSelect
      {...props}
      valueBy="id"
      isLoading={isInventoryListLoading}
      options={inventoryItems}
      itemToString={itemToString}
    />
  )
}
