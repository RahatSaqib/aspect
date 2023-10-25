import React, { useState } from 'react'
import { LinearProgress } from '@mui/material'
import { PeriodSelector, ConsumableSelector } from '../../../../../cleanComponents'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../../hooks/useI18n'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import useInventoryOverview from './useInventoryOverview'

const InventoryOverviewPage = () => {
  const { formatMessage } = useI18n()
  const [filter, setFilter] = useState({
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  })

  function getInventoryLabel(item, isState) {
    if (item.type && item[item.type]) return item.type && item[item.type]
    return isState ? formatMessage(messages.noAssociatedState) : formatMessage(messages.noAssociatedLga)
  }

  function transformInventory(data) {
    const isState = data?.some(item => item.type === 'state')
    return data?.map(item => ({
      ...item,
      name: getInventoryLabel(item, isState),
      children: transformInventory(item.children ?? []),
      usedLastSixMonths: item.usedLastSixMonths ?? 0,
      daysOfInventoryLeft: item.daysOfInventoryLeft ?? 0,
      usedInDateRange: item.usedInDateRange ?? 0,
      dailyConsumptionRate: item.dailyConsumptionRate ?? 0,
    }))
  }

  const [consumableExternalId, setConsumableExternalId] = useState()

  const { isLoading, data } = useInventoryOverview(
    { consumableExternalId, minDate: filter.minDate, maxDate: filter.maxDate },
    { enabled: !!consumableExternalId }
  )

  const columns = [
    { name: 'Name', prop: 'name' },
    { name: 'Current Qty.', prop: 'quantity' },
    { name: 'Last 6 Months', prop: 'usedLastSixMonths' },
    { name: 'Used', prop: 'usedInDateRange' },
    { name: 'Consumption Rate', prop: 'dailyConsumptionRate' },
    { name: 'Days Left', prop: 'daysOfInventoryLeft' },
  ]

  return (
    <PkPage
      title={formatMessage(messages.overview)}
      filters={
        <>
          <ConsumableSelector onChange={e => setConsumableExternalId(e.consumableExternalId)} />
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={filter.minDate || null}
            maxDate={filter.maxDate || null}
            onChange={dateValues => setFilter({ ...filter, ...dateValues })}
          />
        </>
      }
    >
      {isLoading ? <LinearProgress /> : <NestedTable columns={columns} rows={transformInventory(data)} />}
    </PkPage>
  )
}
export default InventoryOverviewPage
