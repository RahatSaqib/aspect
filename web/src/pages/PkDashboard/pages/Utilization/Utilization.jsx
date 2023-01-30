import React, { useState } from 'react'
import { Container, Grid, Card, CardContent } from '@mui/material'
import DetailHeader from '../../../../components/DetailHeader'
import useI18n from '../../../../hooks/useI18n'
import PeriodSelector from '../../../../oldPages/dashboard/Graphs/PeriodSelector'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import NestedTable from '../../components/NestedTable'
import messages from '../../PkDashboard.Messages'

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

  return (
    <>
      <DetailHeader name={formatMessage(messages.utilizationTitle)} disableBack />
      <Container maxWidth sx={{ pb: 3, maxHeight: 'calc(100vh - 64px)', overflow: 'scroll' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} style={{ padding: '16px 8px 0' }}>
            <Card>
              <CardContent>
                <div style={{ width: '50%', float: 'right' }}>
                  <PeriodSelector onChange={setFilter} initialValue={DATE_RANGE_OPTIONS.LAST_MONTH} />
                </div>
                <NestedTable columns={columns} rows={data} hasDetail />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
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
    detail: [
      { id: `${id}${id}`, name, quantity, lastSixMonths, used, rate, left },
      { id: `${id}${id}2`, name, quantity, lastSixMonths, used, rate, left },
    ],
  }
}
