import React from 'react'
import useI18n from '../../../../hooks/useI18n'
import NestedTable from '../../components/NestedTable'
import PkPage from '../../components/PkPage'
import messages from '../../PkDashboard.Messages'

const DeviceCoveragePage = () => {
  const { formatMessage } = useI18n()

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
    <PkPage title={formatMessage(messages.coverageTitle)}>
      <NestedTable columns={columns} rows={data} hasDetail />
    </PkPage>
  )
}

export default DeviceCoveragePage

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
