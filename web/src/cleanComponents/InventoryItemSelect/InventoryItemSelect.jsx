import React from 'react'
import { useIntl } from 'react-intl'
import useInventoryList from '../../hooks/inventory/useInventoryList'
import { commonDefinitions } from '../../messages'
import AspectSelect from '../AspectSelect'
import messages from './messages'

export default function InventoryItemSelect({ inventoryItem, ...props }) {
  const { isLoading: isInventoryListLoading, data: { data: inventoryItems = [] } = {} } = useInventoryList({
    siteId: inventoryItem.siteId,
    consumableId: inventoryItem.consumableId,
    hasStock: true,
    breakOutByLot: true,
  })
  const { formatMessage } = useIntl()

  return (
    <AspectSelect
      {...props}
      valueBy="id"
      isLoading={isInventoryListLoading}
      options={inventoryItems}
      itemToString={item =>
        formatMessage(messages.option, {
          lotNumber: item.lotNumber || formatMessage(commonDefinitions.notAvailable),
          expiresOn: item.expiresOn.split('T')[0] || formatMessage(commonDefinitions.notAvailable),
          quantity: item.quantityOnHand,
        })
      }
    />
  )
}
