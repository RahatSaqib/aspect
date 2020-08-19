import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import filter from 'lodash/filter'
import get from 'lodash/get'
import remove from 'lodash/remove'

import _ from 'lodash'

import flowRight from 'lodash/flowRight'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import map from 'lodash/map'
import Immutable from 'immutable'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Card from '@material-ui/core/Card'

import AspectWidgets from '../../MigratedComponents/AspectWidgets'

import LinearProgress from '../../components/shared/DelayShowingProgressBar'
import { Unit } from '../../components/pureGrids'
import { fetchStatDashboard } from '../DashboardRedux'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'
import AspectTooltip from '../../components/shared/AspectTooltip'
import AspectLink from '../../components/shared/AspectLink'
import IconProvider from '../../MigratedComponents/IconProvider'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'

const cssClasses = classnames.bind(require('./Status.css'))

/**
 * TODO: https://ops.systemone.id/browse/ASP-1521
 * Correct filters to page navigation
 *
 * TODO: https://ops.systemone.id/browse/ASP-1522
 * Refactor lifecycles and code-reuse
 */

// Order of widget groups - values must correspond to WIDGET_GROUP_KEYS in 'api/seeds/fixtures/dashboardWidgetsBase.js'
// which in their turn correspond keys in 'web/src/dashboard/status/messages.js'
const availableGroupI18nKeys = [
  'summaryWidgetGroupConnectivity',
  'summaryWidgetGroupInventory',
  'summaryWidgetGroupDevices',
  'summaryWidgetGroupService',
]

const groupWidgets = (data, dashboard) => {
  const widgetGroups = []
  const nonGroupedWidgets = data
  availableGroupI18nKeys.map(group => {
    const items = filter(data, item => {
      const { dashboards } = item
      const match = get(JSON.parse(dashboards), `${dashboard}.groupI18nKey`)
      return match === group ? item : false
    })
    if (items && items.length) {
      widgetGroups.push({ groupI18nKey: group, items })
      const removeItems = map(items, 'id')
      remove(nonGroupedWidgets, obj => removeItems.includes(obj.id))
    }
    return widgetGroups
  })
  return { widgetGroups, nonGroupedWidgets }
}

export const SummaryStatus = ({ intl, className, dashboard }) => {
  const [widgets, setWidgets] = useState(false)

  const { isLoading, isError, data, error } = useQuery(
    `${dashboard}Widgets`,
    async () =>
      fetchWrapperForQueries(`/dashboard/summary?dashboard=${dashboard}`)
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (data) {
      setWidgets(groupWidgets(data, dashboard))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className={className}>
      {!isLoading && !isError && widgets ? (
        <AspectWidgets data={widgets} />
      ) : null}
    </div>
  )
}

export default SummaryStatus
