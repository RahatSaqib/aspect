import React, { useState } from 'react'
import useI18n from '../../../../../hooks/useI18n'
import ConsumableSelector from '../../../../../oldPages/dashboard/Graphs/ConsumableSelector'
import PeriodSelector from '../../../../../oldPages/dashboard/Graphs/PeriodSelector'
import DATE_CONSTS from '../../../../../utils/consts/DateTime/CONSTS'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const InventoryOverviewPage = () => {
  const { formatMessage } = useI18n()
  const [, setFilter] = useState()
  const [, setConsumable] = useState()

  const data = new Array(111).fill({}).map((i, idx) => createData(idx, `City ${idx}`, 159, 6, 24, 9, 5))

  const columns = [
    { name: 'Name', prop: 'name' },
    { name: 'Current Qty.', prop: 'quantity' },
    { name: 'Last 6 Months', prop: 'lastSixMonths' },
    { name: 'Used', prop: 'used' },
    { name: 'Consumption Rate', prop: 'rate' },
    { name: 'Days Left', prop: 'left' },
  ]

  return (
    <PkPage
      title={formatMessage(messages.overview)}
      filters={
        <>
          <ConsumableSelector onChange={setConsumable} />
          <PeriodSelector onChange={setFilter} initialValue={DATE_RANGE_OPTIONS.LAST_MONTH} />
        </>
      }
    >
      <NestedTable columns={columns} rows={data} hasDetail />
    </PkPage>
  )
}

export default InventoryOverviewPage

function createData(id, name, quantity, lastSixMonths, used, rate, left) {
  return {
    id,
    name,
    quantity,
    lastSixMonths,
    used,
    rate,
    left,
    detail: [
      { id: `${id}${id}`, name, quantity, lastSixMonths, used, rate, left },
      { id: `${id}${id}2`, name, quantity, lastSixMonths, used, rate, left },
    ],
  }
}
