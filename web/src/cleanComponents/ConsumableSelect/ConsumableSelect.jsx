import React from 'react'
import { useIntl } from 'react-intl'
import useConsumable from '../../hooks/inventory/useConsumable'
import { consumableMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableSelect(props) {
  const { formatMessage } = useIntl()
  const { isLoading: isConsumableLoading, data: consumables } = useConsumable()
  return (
    <AspectSelect
      {...props}
      isLoading={isConsumableLoading}
      options={consumables}
      itemToString={item => (item ? formatMessage(consumableMessages[item.i18nKey]) : '')}
    />
  )
}
