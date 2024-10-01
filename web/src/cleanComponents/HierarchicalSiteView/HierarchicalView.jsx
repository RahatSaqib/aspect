import React, { useState } from 'react'
import { Card, Switch, Typography } from '@mui/material'
import { HierarchicalSiteView } from './HierarchicalSiteView'
import { HierarchicalWarehouseView } from './HierarchicalWarehouseView'

export function HierarchicalView(props) {
  const [isWarehouseView, setIsWarehouseView] = useState(false)

  return (
    <Card sx={{ minWidth: 300, p: 2, maxHeight: 640, overflowY: 'auto' }}>
      <Typography variant="body2" color="textSecondary">
        Geographical
        <Switch checked={isWarehouseView} onChange={event => setIsWarehouseView(event.currentTarget.checked)} />
        Warehouse
      </Typography>
      {isWarehouseView ? <HierarchicalWarehouseView {...props} /> : <HierarchicalSiteView {...props} />}
    </Card>
  )
}
