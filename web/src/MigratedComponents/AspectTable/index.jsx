import React, { useEffect, useState } from 'react'
import { func, object, oneOfType } from 'prop-types'
import { usePaginatedQuery } from 'react-query'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import isEqual from 'lodash/isEqual'

import fetchWrapperForQueries from '../QueryFetch'
import ErrorBoundary from '../ErrorBoundary'

import AspectTableCore from './TableCore'

import {
  allowOnlyAPIKeys,
  determineSortDirection,
  getColumnIdFromFilterKey,
  getParamsFromUrl,
  removeNullFromCollection,
  useUrlQuery,
} from './Helpers'
import { replaceRouteParams } from '../QueryFetch/Helpers'

const cssClasses = classnames.bind(require('./Table.css'))

const Loading = () => (
  <div className={cssClasses('table__spinner')}>
    <CircularProgress />
  </div>
)

const AspectTable = ({ baseConfig, consts: CONSTS }) => {
  const intl = useIntl()
  const config = baseConfig(intl)
  const { push } = useHistory()
  const { ...routeParams } = useParams()
  const { pathname, search } = useLocation()
  const query = useUrlQuery(search)
  const {
    columnOrder: { initialOrder = false, initialOrderDesc = false },
  } = config
  const {
    size: urlSize = false,
    page: urlPage = 0,
    sortCol: urlSortCol = initialOrder ? initialOrder[0] : null,
    sortDir: urlSortDir = initialOrderDesc === true ? 'desc' : 'asc',
    filters: urlFilters = null,
  } = getParamsFromUrl(query, search)
  const [allowReset, setAllowReset] = useState(false)
  const [filters, setFilters] = useState(urlFilters)
  const [size, setSize] = useState(urlSize || 10)
  const [sortCol, setSortCol] = useState(urlSortCol)
  const [sortDir, setSortDir] = useState(urlSortDir)
  const [page, setPage] = useState(urlPage)
  const [params, setParams] = useState(
    removeNullFromCollection({ size, sortCol, sortDir, page, filters })
  )

  const {
    error,
    isError,
    isLoading,
    isFetching,
    resolvedData: data = false,
  } = usePaginatedQuery(
    [CONSTS.KEY, { params }],
    async (_queryId, { params }) => {
      return fetchWrapperForQueries({
        endpoint: replaceRouteParams(CONSTS.ENDPOINT, routeParams),
        params: allowOnlyAPIKeys(params),
      })
    },
    {
      keepPreviousData: true,
    }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (params) {
      const newUrlParams = new URLSearchParams(params).toString()
      const urlParams = getParamsFromUrl(query, search)
      if (!isEqual(urlParams, params)) {
        push(`${pathname}?${newUrlParams}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    if (!isEqual(params, { size, sortCol, sortDir, page, filters })) {
      setParams(
        removeNullFromCollection({ size, sortCol, sortDir, page, filters })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, size, sortCol, sortDir, page])

  useEffect(() => {
    if (filters !== urlFilters) {
      setFilters(urlFilters)
    }
  }, [filters, urlFilters])

  const handleClearParams = () => {
    setAllowReset(!allowReset)
  }

  return isLoading || !data ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <AspectTableCore
        config={config}
        tableData={data}
        params={params}
        pageCount={Math.ceil(data.total / size)}
        isFetching={isFetching}
        initialState={removeNullFromCollection({
          pageSize: size,
          sortBy: [
            {
              id: sortCol,
              desc: determineSortDirection(sortDir),
            },
          ],
          pageIndex: page,
          allowReset,
          filters: getColumnIdFromFilterKey(config, filters),
        })}
        setters={{
          handleClearParams,
          setSize,
          setSortCol,
          setSortDir,
          setPage,
        }}
      />
    </ErrorBoundary>
  )
}

AspectTable.propTypes = {
  /**
   Config input for table
 */
  baseConfig: func.isRequired,
  /**
   Consts required for data fetching
 */
  consts: oneOfType([object]).isRequired,
}

export default AspectTable
