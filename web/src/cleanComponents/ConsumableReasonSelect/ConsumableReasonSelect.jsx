import React from 'react'
import { useIntl } from 'react-intl'
import useConsumableReasons from '../../hooks/inventory/useConsumableReasons'
import { consumableReasonMessages } from '../../messages'
import AspectSelect from '../AspectSelect'

export default function ConsumableReasonSelect({ filterType, ...props }) {
  const { formatMessage } = useIntl()
  const { isLoading: isReasonsLoading, data: reasons } = useConsumableReasons()
  const onlyDecreaseReasons = filterType === 'decrease'

  const filteredReasons = reasons
    ?.filter(
      reason =>
        reason.userSelectable === 1 &&
        (onlyDecreaseReasons
          ? reason.effectOnStock === 'decrease'
          : ['increase', 'resetToValue'].includes(reason.effectOnStock))
    )
    .sort((a, b) => {
      const order = {
        increase: 0,
        decrease: 1,
        resetToValue: 2,
      }
      return order[a.effectOnStock] - order[b.effectOnStock]
    })

  return (
    <AspectSelect
      {...props}
      isLoading={isReasonsLoading}
      options={filteredReasons}
      itemToString={item => (item ? formatMessage(consumableReasonMessages[item.i18nKey]) : '')}
    />
  )
}
