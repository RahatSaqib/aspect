import React, { useEffect, useState } from 'react'
import { func, object, oneOfType } from 'prop-types'
import { useQuery } from 'react-query'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import isEqual from 'lodash/isEqual'
import forEach from 'lodash/forEach'
import get from 'lodash/get'

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

import styles from './Table.css'

const cssClasses = classnames.bind(styles)

const Loading = () => (
  <div className={cssClasses('table__spinner')}>
    <CircularProgress />
  </div>
)

const AspectTable = ({ baseConfig, consts: CONSTS }) => {
  const intl = useIntl()
  const config = baseConfig(intl)
  const navigate = useNavigate()
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
  const [translatedData, setTranslatedData] = useState(false)

  const {
    error,
    isError,
    isLoading,
    isFetching,
    data = false,
  } = useQuery(
    [CONSTS.KEY, { params }],
    async ({ queryKey: [, { params }] }) => {
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
        navigate(`${pathname}?${newUrlParams}`)
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

  useEffect(() => {
    if (config && config.columns && data && data.data) {
      forEach(
        config.columns.filter(cfg => cfg.translate),
        cfg => {
          const { key } = cfg
          forEach(data.data, row => {
            row[key] = cfg.translate(row[key])
          })
        }
      )
      setTranslatedData(data)
    }
  }, [data, config])

  return isLoading || !translatedData ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <AspectTableCore
        config={config}
        tableData={translatedData}
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
