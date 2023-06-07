import React from 'react'
import useConsumable from '../../hooks/inventory/useConsumable'
import useI18n from '../../hooks/useI18n'
import { consumableMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableSelect(props) {
  const { formatMessage } = useI18n()
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
