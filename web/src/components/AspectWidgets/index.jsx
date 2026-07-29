import React from 'react'
import { Grid, useMediaQuery, useTheme } from '@mui/material'
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
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm')) // phones (< 600px)
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')) // small tablets (600–900px)
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')) // tablets (900–1200px)

  const widgetCount = nonGroupedWidgets.length
  const desktopPerRow = widgetCount <= 6 ? widgetCount : 4
  // Wrap tiles into multiple rows on smaller screens instead of squishing them into one row.
  const tilesPerRow = isXs ? 2 : isSm ? 3 : isMd ? 4 : desktopPerRow
  const tileWidth = `${100 / Math.min(tilesPerRow, widgetCount || 1)}%`

  return (
    <Grid container spacing={2}>
      {widgetGroups && widgetGroups.length ? <Group data={widgetGroups} /> : null}
      {nonGroupedWidgets && nonGroupedWidgets.length
        ? nonGroupedWidgets.map(widget => (
            <Grid
              item
              key={widget.id}
              style={{ padding: 0, display: 'flex', flexBasis: tileWidth, maxWidth: tileWidth, minWidth: 0 }}
            >
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
