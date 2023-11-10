import React from 'react'
import { useIntl } from 'react-intl'
import useConsumableReasons from '../../hooks/inventory/useConsumableReasons'
import { consumableReasonMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableReasonSelect(props) {
  const { formatMessage } = useIntl()
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
