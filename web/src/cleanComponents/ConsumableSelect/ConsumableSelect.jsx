import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import { useConsumable } from '../../hooks/inventory/useConsumable'
import { consumableMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableSelect({ onlyWhitelisted, whitelistIds, ...props }) {
  const { formatMessage } = useIntl()
  const { isLoading: isConsumableLoading, data: { data } = {} } = useConsumable()
  const consumables = useMemo(() => {
    if (isConsumableLoading) {
      return []
    }
    return onlyWhitelisted ? data?.filter(it => whitelistIds?.includes(it.id)) : data
  }, [data, isConsumableLoading, onlyWhitelisted, whitelistIds])
  return (
    <AspectSelect
      {...props}
      isLoading={isConsumableLoading}
      options={consumables}
      itemToString={item => (item ? formatMessage(consumableMessages[item.i18nKey]) : '')}
    />
  )
}
