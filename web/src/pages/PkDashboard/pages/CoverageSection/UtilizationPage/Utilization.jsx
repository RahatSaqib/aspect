import React, { useState } from 'react'
import { Typography } from '@mui/material'
import useI18n from '../../../../../hooks/useI18n'
import PeriodSelector from '../../../../../oldPages/dashboard/Graphs/PeriodSelector'
import DATE_CONSTS from '../../../../../utils/consts/DateTime/CONSTS'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import UtilizationGraph from '../../../components/UtilizationGraph'
import messages from '../../../PkDashboard.Messages'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const UtilizationPage = () => {
  const { formatMessage } = useI18n()
  const [, setFilter] = useState()

  const data = new Array(111).fill({}).map((i, idx) => createData(idx, `City ${idx}`, 159, 6, 24, 9, 5))

  const columns = [
    { name: 'Name', prop: 'name' },
    { name: 'Current Qty.', prop: 'quantity' },
    { name: 'Last 6 Months', prop: 'lastSixMonths' },
    { name: 'Used', prop: 'used' },
    { name: 'Consumption Rate', prop: 'rate' },
    { name: 'Days Left', prop: 'left' },
  ]

  const datum = [
    { total: 'Total', 2017: 19, 2018: 19, 2019: 23 },
    { province: 'Pakistan', 2017: 22, 2018: 80, 2019: 75 },
    { province: 'BTAN', 2017: 20, 2018: 80, 2019: 75 },
    { province: 'KP', 2017: 21, 2018: 80, 2019: 75 },
    { province: 'Punjab', 2017: 19, 2018: 80, 2019: 75 },
    { province: 'Sindh', 2017: 25, 2018: 80, 2019: 75 },
  ]

  const indexByFirst = 'total'
  const dataFirst = datum.filter(r => !!r[indexByFirst])
  const keyFirst = Object.keys(dataFirst[0]).filter(k => k !== indexByFirst)

  const indexByRest = 'province'
  const dataRest = datum.filter(r => !!r[indexByRest])
  const keyRest = Object.keys(dataRest[0]).filter(k => k !== indexByRest)

  return (
    <PkPage
      isMocked
      title={formatMessage(messages.utilizationTitle)}
      filter={<PeriodSelector onChange={setFilter} initialValue={DATE_RANGE_OPTIONS.LAST_MONTH} />}
    >
      <NestedTable columns={columns} rows={data} hasDetail />
      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        National Trends in Annual Utilization Rates
      </Typography>
      <div style={{ height: '300px', marginTop: 32 }}>
        <UtilizationGraph data={dataFirst} keys={keyFirst} indexBy={indexByFirst} />
      </div>
      <Typography variant="h5" color="primary" style={{ margin: '32px 16px' }}>
        Provincial Trends in Annual Utilization Rates
      </Typography>
      <div style={{ height: '800px', marginTop: 32 }}>
        <UtilizationGraph data={dataRest} keys={keyRest} indexBy={indexByRest} />
      </div>
    </PkPage>
  )
}

export default UtilizationPage

function createData(id, name, quantity, lastSixMonths, used, rate, left) {
  return {
    id,
    name,
    quantity,
    lastSixMonths,
    used,
    rate,
    left,
    children: [
      { id: `${id}${id}`, name, quantity, lastSixMonths, used, rate, left },
      { id: `${id}${id}2`, name, quantity, lastSixMonths, used, rate, left },
    ],
  }
}
