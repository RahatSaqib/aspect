import React from 'react'
import { Grid } from '@mui/material'
import PropTypes from 'prop-types'
import Group from './Group'
import { AspectWidget, EmptyWidget } from './Widget'

const EmptyWidgets = () => (
  <Grid container spacing={2}>
    {[0, 1, 2].map(key => (
      <Grid item sm={4} key={key}>
        <EmptyWidget />
      </Grid>
    ))}
  </Grid>
)

const AspectWidgets = ({ data: { widgetGroups, nonGroupedWidgets } }) => {
  return (
    <Grid container spacing={2}>
      {widgetGroups && widgetGroups.length ? <Group data={widgetGroups} /> : null}
      {nonGroupedWidgets && nonGroupedWidgets.length
        ? nonGroupedWidgets.map(widget => (
            <Grid item sm={4} key={widget.id} style={{ padding: 0 }}>
              <AspectWidget data={widget} />
            </Grid>
          ))
        : null}
    </Grid>
  )
}

AspectWidgets.propTypes = {
  data: PropTypes.shape({
    widgetGroups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    nonGroupedWidgets: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  }).isRequired,
}

export { AspectWidgets, EmptyWidgets }
