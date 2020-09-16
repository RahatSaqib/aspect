import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'

import { groupWidgets } from '../../MigratedComponents/AspectWidgets/Helpers'
import AspectWidgets from '../../MigratedComponents/AspectWidgets'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import {
  HOME_WIDGETS,
  OPERATIONAL_DATA_WIDGETS,
} from '../../MigratedComponents/QueryFetch/Dashboard/index'

export const SummaryStatus = ({ className, dashboard }) => {
  const QUERY_CONFIG =
    dashboard === 'home' ? HOME_WIDGETS : OPERATIONAL_DATA_WIDGETS

  const [widgets, setWidgets] = useState(false)

  const {
    isLoading,
    isError,
    data: { data: widgetData } = false,
    error,
  } = useQuery(QUERY_CONFIG.KEY, async () =>
    fetchWrapperForQueries({
      endpoint: QUERY_CONFIG.ENDPOINT,
    })
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (widgetData) {
      setWidgets(groupWidgets(widgetData, dashboard))
    }
  }, [widgetData, dashboard])

  return (
    <div className={className}>
      {!isLoading && !isError && widgets ? (
        <AspectWidgets data={widgets} />
      ) : null}
    </div>
  )
}

SummaryStatus.defaultProps = {
  dashboard: 'home',
}

SummaryStatus.propTypes = {
  className: PropTypes.string.isRequired,
  dashboard: PropTypes.string,
}

export default SummaryStatus
