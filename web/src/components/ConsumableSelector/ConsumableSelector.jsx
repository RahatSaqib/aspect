import React, { useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { consumableMessages } from '../../messages'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import AspectSelect from '../AspectSelect'
import fetchWrapperForQueries from '../QueryFetch'

const ConsumableSelector = ({ onChange, ...props }) => {
  const { isLoading, data } = useQuery(
    'data.inventoryConsumableSummaryList',
    async () => fetchWrapperForQueries({ endpoint: '/dashboard/inventory-item' }),
    {
      select: s =>
        s.data.inventoryConsumableSummaryList.sort((a, b) => `${a.consumableName}`.localeCompare(b.consumableName)),
      ...SELECTS_QUERY_OPTIONS,
    }
  )
  const { formatMessage } = useIntl()

  useEffect(() => {
    if (data) onChange(data[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <AspectSelect
      {...props}
      onChange={onChange}
      label={formatMessage(consumableMessages.consumable)}
      isLoading={isLoading}
      options={data}
      itemToString={item => (item ? item.consumableName : '')}
    />
  )
}

export default ConsumableSelector
