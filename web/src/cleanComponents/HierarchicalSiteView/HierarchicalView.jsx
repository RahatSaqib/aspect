import React, { useState } from 'react'
import { Card, Stack, Switch, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import AspectVertMenu from '../../components/AspectVertMenu'
import { ExpandedHierarchicalSiteView } from './ExpandedHierarchicalSiteView'
import { HierarchicalSiteView } from './HierarchicalSiteView'
import { HierarchicalWarehouseView } from './HierarchicalWarehouseView'
import messages from './messages'

export function HierarchicalView(props) {
  const { isWarehouseView, setIsWarehouseView } = props
  const { formatMessage } = useIntl()
  const [expanded, setExpanded] = useState(false)

  return (
    <Card sx={{ minWidth: 300, py: 2, maxHeight: 640, overflowY: 'auto' }}>
      <Stack flexDirection="row">
        <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
          {formatMessage(messages.geographical)}
          <Switch checked={isWarehouseView} onChange={event => setIsWarehouseView(event.currentTarget.checked)} />
          {formatMessage(messages.warehouse)}
        </Typography>
        <AspectVertMenu
          actions={[
            {
              text: formatMessage(messages.expandAll),
              action: () => setExpanded(true),
            },
            {
              text: formatMessage(messages.collapseAll),
              action: () => setExpanded(false),
            },
          ]}
        />
      </Stack>

      {isWarehouseView ? (
        <HierarchicalWarehouseView expanded={expanded} {...props} />
      ) : expanded ? (
        <ExpandedHierarchicalSiteView {...props} />
      ) : (
        <HierarchicalSiteView {...props} />
      )}
    </Card>
  )
}
