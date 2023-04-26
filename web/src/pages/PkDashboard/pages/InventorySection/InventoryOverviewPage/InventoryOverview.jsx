import React, { useState } from 'react'
import { LinearProgress } from '@mui/material'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../../../hooks/useI18n'
import ConsumableSelector from '../../../../../oldPages/dashboard/Graphs/ConsumableSelector'
import PeriodSelector from '../../../../../oldPages/dashboard/Graphs/PeriodSelector'
import DATE_CONSTS from '../../../../../utils/consts/DateTime/CONSTS'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import useInventoryOverview from './useInventoryOverview'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

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
          <PeriodSelector onChange={setFilter} initialValue={DATE_RANGE_OPTIONS.LAST_MONTH} />
        </>
      }
    >
      {isLoading ? <LinearProgress /> : <NestedTable columns={columns} rows={data} />}
    </PkPage>
  )
}
export default InventoryOverviewPage
