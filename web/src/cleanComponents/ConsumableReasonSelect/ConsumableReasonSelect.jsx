import React from 'react'
import useConsumableReasons from '../../hooks/inventory/useConsumableReasons'
import useI18n from '../../hooks/useI18n'
import { consumableReasonMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableReasonSelect(props) {
  const { formatMessage } = useI18n()
  const { isLoading: isReasonsLoading, data: reasons } = useConsumableReasons()
  return (
    <AspectSelect
      {...props}
      isLoading={isReasonsLoading}
      options={reasons}
      itemToString={item => (item ? formatMessage(consumableReasonMessages[item.i18nKey]) : '')}
    />
  )
}
