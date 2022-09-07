import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Unit } from '../../oldComponents/pureGrids'
import Group from './Group'
import { AspectWidget, EmptyWidget } from './Widget'

const EmptyWidgets = () =>
  [0, 1, 2, 3].map(key => (
    <Unit key={key} sm="1-2" lg="1-4">
      <EmptyWidget />
    </Unit>
  ))

const AspectWidgets = ({ data: { widgetGroups, nonGroupedWidgets } }) => {
  return (
    <Fragment>
      {widgetGroups && widgetGroups.length ? <Group data={widgetGroups} /> : null}
      {nonGroupedWidgets && nonGroupedWidgets.length
        ? nonGroupedWidgets.map(widget => (
            <Unit key={widget.id} sm="1-2" lg="1-4">
              <AspectWidget data={widget} />
            </Unit>
          ))
        : null}
    </Fragment>
  )
}

AspectWidgets.propTypes = {
  data: PropTypes.shape({
    widgetGroups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    nonGroupedWidgets: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  }).isRequired,
}

export { AspectWidgets, EmptyWidgets }
