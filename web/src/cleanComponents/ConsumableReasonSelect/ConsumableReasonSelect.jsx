import React from 'react'
import { useIntl } from 'react-intl'
import useConsumableReasons from '../../hooks/inventory/useConsumableReasons'
import { consumableReasonMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableReasonSelect({ filterType, ...props }) {
  const { formatMessage } = useIntl()
  const { isLoading: isReasonsLoading, data: reasons } = useConsumableReasons()

  const filteredReasons = reasons
    ?.filter(
      reason =>
        reason.userSelectable === 1 &&
        (filterType === 'decrease' ? reason.increaseDecrease < 0 : reason.increaseDecrease >= 0)
    )
    .sort((a, b) => (a.reset === b.reset ? 0 : a.reset ? 1 : -1)) // Sort reasons with reset === 1 to the bottom

  return (
    <AspectSelect
      {...props}
      isLoading={isReasonsLoading}
      options={filteredReasons}
      itemToString={item => (item ? formatMessage(consumableReasonMessages[item.i18nKey]) : '')}
    />
  )
}
