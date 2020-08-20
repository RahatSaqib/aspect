import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'

import { groupWidgets } from '../../MigratedComponents/AspectWidgets/Helpers'
import AspectWidgets from '../../MigratedComponents/AspectWidgets'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'

/**
 * TODO: https://ops.systemone.id/browse/ASP-1521
 * Correct filters to page navigation
 *
 * TODO: https://ops.systemone.id/browse/ASP-1522
 * Refactor lifecycles and code-reuse
 */

export const SummaryStatus = ({ className, dashboard }) => {
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
  }, [data, dashboard])

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
