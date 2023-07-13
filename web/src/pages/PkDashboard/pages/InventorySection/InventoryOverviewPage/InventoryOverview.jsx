import React, { useState } from 'react'
import { LinearProgress } from '@mui/material'
import { PeriodSelector } from '../../../../../cleanComponents'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../../hooks/useI18n'
import ConsumableSelector from '../../../../../oldPages/dashboard/Graphs/ConsumableSelector'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import useInventoryOverview from './useInventoryOverview'

function transformInventory(data) {
  return data?.map(item => ({
    ...item,
    name: item[item.type],
    children: transformInventory(item.children ?? []),
  }))
}

const InventoryOverviewPage = () => {
  const { formatMessage } = useI18n()
  const [filter, setFilter] = useState({
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  })
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
