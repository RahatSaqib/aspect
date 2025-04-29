import React from 'react'
import { useIntl } from 'react-intl'
import useConsumableReasons from '../../hooks/inventory/useConsumableReasons'
import { consumableReasonMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableReasonSelect({ filterType, ...props }) {
  const { formatMessage } = useIntl()
  const { isLoading: isReasonsLoading, data: reasons } = useConsumableReasons()

  const filteredReasons = reasons?.filter(
    reason =>
      reason.userSelectable === 1 &&
      (filterType === 'decrease' ? reason.increaseDecrease < 0 : reason.increaseDecrease >= 0)
  )

  return (
    <AspectSelect
      {...props}
      isLoading={isReasonsLoading}
      options={filteredReasons}
      itemToString={item => (item ? formatMessage(consumableReasonMessages[item.i18nKey]) : '')}
    />
  )
}
