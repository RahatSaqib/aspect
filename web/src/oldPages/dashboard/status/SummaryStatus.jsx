import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'

import { groupWidgets } from '../../../components/AspectWidgets/Helpers'
import { AspectWidgets, EmptyWidgets } from '../../../components/AspectWidgets'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import SUMMARY_STATUS_WIDGETS from '../../../components/QueryFetch/Dashboard/index'

export const SummaryStatus = ({ className, dashboard }) => {
  const [widgets, setWidgets] = useState(false)
  const {
    isLoading,
    isError,
    data: { data: widgetData } = false,
    error,
  } = useQuery([SUMMARY_STATUS_WIDGETS.KEY, { dashboard }], async () =>
    fetchWrapperForQueries({
      endpoint: SUMMARY_STATUS_WIDGETS.ENDPOINT,
      params: { dashboard },
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
      {isLoading && !widgets ? <EmptyWidgets /> : null}
      {!isLoading && widgets ? <AspectWidgets data={widgets} /> : null}
    </div>
  )
}

SummaryStatus.defaultProps = {
  dashboard: 'home',
  className: '',
}

SummaryStatus.propTypes = {
  className: PropTypes.string,
  dashboard: PropTypes.string,
}

export default SummaryStatus
