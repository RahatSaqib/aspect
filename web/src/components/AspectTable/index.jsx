import React, { useEffect, useState, useMemo } from 'react'
import { func, array, object, oneOfType } from 'prop-types'
import { useQuery } from 'react-query'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import classnames from 'classnames/bind'
import isEqual from 'lodash/isEqual'

import fetchWrapperForQueries from '../QueryFetch'
import ErrorBoundary from '../ErrorBoundary'

import AspectTableCore from './TableCore'

import { allowOnlyAPIKeys, determineSortDirection, getColumnIdFromFilterKey, removeNullFromCollection } from './Helpers'
import { replaceRouteParams } from '../QueryFetch/Helpers'
import {
  DEFAULT_PAGE_AT,
  DEFAULT_PAGE_SIZE,
  makeSearchParamsSanitizer,
  makeSortPageSelector,
} from '../../utils/selectors/searchParams'
import { getFilters, sanitizeFiltersStringBy } from '../../oldComponents/filter/utils'

import styles from './Table.css'
import useI18n from '../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const Loading = () => (
  <div className={cssClasses('table__spinner')}>
    <CircularProgress />
  </div>
)

// ------------------------------------
const getDefaultSortCol = config => {
  const { columnOrder: { initialOrder = false } = {} } = config
  return initialOrder ? initialOrder[0] : null
}
// ------------------------------------
const getDefaultSortDir = config => {
  const { columnOrder: { initialOrderDesc = false } = {} } = config
  return initialOrderDesc === true ? 'desc' : 'asc'
}
// ------------------------------------
/**
 * Using 2 stable props (config, FILTERS_CONFIG) and 1 variable (location)
 * return sanitized pagination and filters from url
 */
const getCurrentState = ({ config, FILTERS_CONFIG, location }) => {
  /**
   * see example of table config in
   * `web/src/components/Notifications/List/config.jsx`.
   * Here `config` is result of execution of `baseConfig(...)`.
   */
  const { columns } = config
  /**
   * Prepare func to allow sorting by correct columns only.
   * If `sortCol` has incorrect column name then use 1st allowed
   * column and set `sanitized = true`.
   */
  const searchSanitizer = makeSearchParamsSanitizer({
    availableSortCol: columns.map(({ key }) => key),
  })
  /**
   * Prepare func to allow filtering by correct fields only.
   * If `filters` contain incorrect field names - remove them
   * and set `sanitized = true`.
   */
  const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
  /**
   * Run prepared funcs and return correct `searchParams` and `filtersParams`
   */
  const { sanitized: searchSanitized, value: searchParams } = searchSanitizer(location)
  const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
  /**
   * Set correct filters
   */
  if (filtersSanitized) {
    searchParams.set('filters', filtersParams)
  }
  /**
   * Get correct pagination/sorting props for params to use by react-query.
   * Notice that for location we use sanitized `searchParams`
   */
  const sortPage = makeSortPageSelector({
    /**
     * defaults for sorting params come from `config`
     */
    sortCol: getDefaultSortCol(config),
    sortDir: getDefaultSortDir(config),
  })
  const { sortCol, sortDir, pageAt: page, pageSize: size } = sortPage({ location: { search: searchParams.toString() } })

  return {
    // params to use by react-query
    size,
    page,
    sortCol,
    sortDir,
    filters: getFilters(filtersParams),
    // when true - enforces to re-navigate to url with correct query params
    shouldRelocate: !!(searchSanitized || filtersSanitized),
    // correct query params
    searchParams,
  }
}
// ------------------------------------
const toRelocate = (navigate, location, currentState, newState, setStates) => {
  if (
    currentState.shouldRelocate ||
    newState.shouldRelocate ||
    currentState.size !== newState.size ||
    currentState.page !== newState.page ||
    currentState.sortCol !== newState.sortCol ||
    currentState.sortDir !== newState.sortDir ||
    !isEqual(currentState.filters, newState.filters)
  ) {
    setStates()
    navigate(
      {
        ...location,
        search: `?${newState.searchParams.toString()}`,
      },
      { replace: true }
    )
  }
}
// ------------------------------------
const AspectTable = ({ baseConfig, FILTERS_CONFIG, consts: CONSTS, onClickRow }) => {
  const intl = useI18n()
  const config = useMemo(() => baseConfig(intl), [baseConfig, intl])
  const navigate = useNavigate()
  const { ...routeParams } = useParams()
  const location = useLocation()
  const [currentState, setCurrentState] = useState(getCurrentState({ config, FILTERS_CONFIG, location }))
  const [allowReset, setAllowReset] = useState(false)
  const { filters } = currentState

  const [size, setSize] = useState(currentState.size)
  const [sortCol, setSortCol] = useState(currentState.sortCol)
  const [sortDir, setSortDir] = useState(currentState.sortDir)
  const [page, setPage] = useState(currentState.page)
  const params = useMemo(
    () => removeNullFromCollection({ size, sortCol, sortDir, page, ...filters }),
    [page, size, sortCol, sortDir, filters]
  )

  useEffect(() => {
    /**
     * Pass this condition only when
     * `page`, `size`, `sortCol`, `sortDir` were changed from AspectTableCore
     */
    if (
      page === currentState.page &&
      size === currentState.size &&
      sortDir === currentState.sortDir &&
      sortCol === currentState.sortCol
    ) {
      return
    }

    /**
     * Set params in `searchParams`
     */
    const { searchParams } = currentState
    const updateSearchParams = (name, value, shouldDelete) => {
      if (shouldDelete) searchParams.delete(name)
      else searchParams.set(name, value)
    }
    updateSearchParams('page', page, page === DEFAULT_PAGE_AT)
    updateSearchParams('size', size, size === DEFAULT_PAGE_SIZE)
    updateSearchParams('sortCol', sortCol, !sortCol || sortCol === getDefaultSortCol(config))
    updateSearchParams('sortDir', sortDir, !sortDir || sortDir === getDefaultSortDir(config))

    const newState = getCurrentState({
      config,
      FILTERS_CONFIG,
      location: {
        ...location,
        search: `?${searchParams.toString()}`,
      },
    })

    toRelocate(navigate, location, currentState, newState, () => {
      setCurrentState(newState)
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortCol, sortDir])

  useEffect(() => {
    const newState = getCurrentState({
      config,
      FILTERS_CONFIG,
      location,
    })

    toRelocate(navigate, location, currentState, newState, () => {
      setPage(newState.page)
      setSize(newState.size)
      setSortCol(newState.sortCol)
      setSortDir(newState.sortDir)
      setCurrentState(newState)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

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
        onClickRow={onClickRow}
      />
    </ErrorBoundary>
  )
}

AspectTable.defaultProps = {
  onClickRow: null,
  FILTERS_CONFIG: [],
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

  onClickRow: func,

  FILTERS_CONFIG: oneOfType([array]),
}

export default AspectTable
