import React from 'react'
import { Container, Grid, Card, CardContent } from '@mui/material'
import InventoryTable from './InventoryTable'

const InventoryOverviewPage = () => {
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
    <Container maxWidth sx={{ pb: 3, maxHeight: 'calc(100vh - 64px)', overflow: 'scroll' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ padding: '16px 8px 0' }}>
          <Card>
            <CardContent>
              <InventoryTable columns={columns} rows={data} hasDetail />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
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
      { name, quantity, lastSixMonths, used, rate, left },
    ],
  }
}
