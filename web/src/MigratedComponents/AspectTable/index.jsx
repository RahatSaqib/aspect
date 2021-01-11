import React, { Fragment, useMemo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { usePaginatedQuery } from 'react-query'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import isEqual from 'lodash/isEqual'
import keys from 'lodash/keys'

import {
  useTable,
  useSortBy,
  usePagination,
  useColumnOrder,
  useGroupBy,
  useExpanded,
} from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import fetchWrapperForQueries from '../QueryFetch'
import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import TableHeaderRow from './TableHeader/TableHeaderRow'
import TableBodyRow from './TableBody/TableBodyRow'

import AspectTablePagination from './TablePagination'
import {
  buildColumnsFromData,
  getCurrentColumnIndexAndShift,
  getParamsFromUrl,
  shapeTableParamsForApi,
} from './Helpers'

const cssClasses = classnames.bind(require('./Table.css'))

const AspectTableCore = ({ config, tableData, params }) => {
  const history = useHistory()
  const location = useLocation()
  const { total, data } = tableData
  const { name } = config
  const {
    columns,
    initialSortBy,
    columnOrder: { allow: allowColumnReOrder, initialOrder } = false,
    contextualMenu: ContextualMenu,
  } = useMemo(() => buildColumnsFromData(config), [config])

  const {
    canNextPage,
    canPreviousPage,
    getTableProps,
    gotoPage,
    headerGroups,
    nextPage,
    page,
    pageCount,
    prepareRow,
    previousPage,
    setColumnOrder,
    setPageSize,
    setSortBy,
    toggleGroupBy,
    toggleHideColumn,
    visibleColumns,
    state: {
      pageIndex,
      pageSize,
      sortBy,
      columnOrder,
      hiddenColumns,
      groupBy,
      expanded,
    },
  } = useTable(
    { columns, data },
    useColumnOrder,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination
  )

  const handleChangeRowsPerPage = val => {
    setPageSize(typeof val !== 'number' ? total : Number(val))
  }

  const handleChangeColumnOrder = (e, direction, index) => {
    e.stopPropagation()
    setColumnOrder(
      getCurrentColumnIndexAndShift(visibleColumns, direction, index)
    )
  }

  const handleHideColumnToggle = (e, id) => {
    e.stopPropagation()
    toggleHideColumn(id)
  }

  const handleGroupByColumnToggle = (e, id) => {
    e.stopPropagation()
    toggleGroupBy(id)
  }

  useEffect(() => {
    if (!sortBy.length && initialSortBy) {
      setSortBy([initialSortBy])
    }
  }, [sortBy, setSortBy, initialSortBy])

  useEffect(() => {
    if (visibleColumns && allowColumnReOrder && !columnOrder.length) {
      setColumnOrder(initialOrder)
    }
  }, [
    visibleColumns,
    allowColumnReOrder,
    columnOrder,
    initialOrder,
    setColumnOrder,
  ])

  useEffect(() => {
    async function buildAndSetParams() {
      const { page = 0, size, sortCol, sortDir } = await shapeTableParamsForApi(
        {
          pageIndex,
          pageSize,
          sortBy,
          initialOrder,
        }
      )

      if (
        !isEqual(
          {
            page,
            size,
            sortCol,
            sortDir,
          },
          params
        )
      ) {
        const newUrlParams = new URLSearchParams({
          page,
          size,
          sortCol,
          sortDir,
        }).toString()
        // window.location.search = newUrlParams
        window.history.pushState(null, '', newUrlParams)
        // history.replace({ pathname, search: newUrlParams })
        // console.log(history)

        // push(`${pathname}?${newUrlParams}`)
      }

      // setParamsToUrl({
      //   page,
      //   size,
      //   sortCol,
      //   sortDir,
      // })
    }
    if (data && data.length) {
      buildAndSetParams()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, sortBy, initialOrder])

  return (
    <Fragment>
      {hiddenColumns && hiddenColumns.length ? (
        <TableHiddenColumns
          columns={columns}
          hiddenColumns={hiddenColumns}
          handleHideColumnToggle={handleHideColumnToggle}
        />
      ) : null}
      <Table {...getTableProps()} style={{ tableLayout: 'auto' }}>
        <TableHead>
          {headerGroups.map(({ headers, getHeaderGroupProps }) => (
            <TableRow {...getHeaderGroupProps()}>
              <TableHeaderRow
                allowColumnReOrder={allowColumnReOrder}
                handleChangeColumnOrder={handleChangeColumnOrder}
                handleHideColumnToggle={handleHideColumnToggle}
                handleGroupByColumnToggle={handleGroupByColumnToggle}
                headers={headers}
              />
              {ContextualMenu ? <TableCell /> : null}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {page.map(row => {
            prepareRow(row)
            const {
              getRowProps,
              cells,
              getToggleRowExpandedProps,
              isExpanded,
              subRows,
            } = row
            return (
              <TableRow {...getRowProps()}>
                <TableBodyRow
                  cells={cells}
                  getToggleRowExpandedProps={getToggleRowExpandedProps}
                  isExpanded={isExpanded}
                  subRows={subRows}
                />
                {ContextualMenu ? (
                  <TableCell>
                    <ContextualMenu item={row} />
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <AspectTablePagination
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={total}
        expanded={expanded}
        gotoPage={gotoPage}
        groupBy={groupBy}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        name={name}
        nextPage={nextPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        previousPage={previousPage}
        page={page}
      />
    </Fragment>
  )
}

AspectTableCore.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

const Loading = () => (
  <div className={cssClasses('table__spinner')}>
    <CircularProgress />
  </div>
)

function useUrlQuery() {
  return new URLSearchParams(useLocation().search)
}

const AspectTable = ({ baseConfig, consts: CONSTS }) => {
  const intl = useIntl()
  const urlQuery = useUrlQuery()
  const config = baseConfig(intl)
  const history = useHistory()
  const { search } = useLocation()
  const prms = useParams()

  const [params, setParams] = useState(false)
  const [paramsToUrl, setParamsToUrl] = useState(false)

  const {
    error,
    isError,
    isLoading,
    isFetching,
    resolvedData: data = false,
  } = usePaginatedQuery(
    [CONSTS.KEY, { params }],
    async (_queryId, { params }) => {
      console.log(params, window.performance.now())
      return fetchWrapperForQueries({
        endpoint: CONSTS.ENDPOINT,
        params,
      })
    }
    // {
    //   onSuccess: ({ total: totalRes, data: dataRes }) => {
    //     if (!isEqual(dataRes, data.data)) {
    //       setData({ total: totalRes, data: dataRes })
    //     }
    //   },
    // }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    console.log(search)

    const paramsFromUrl = getParamsFromUrl(urlQuery, search)
    if (!isEqual(params, paramsFromUrl)) {
      setParams(paramsFromUrl)
    }
  }, [search, urlQuery])

  // useEffect(() => {
  // if (paramsToUrl) {
  //   const paramsFromUrl = getParamsFromUrl(urlQuery, keys(paramsToUrl))
  //   console.log(params, paramsFromUrl, window.performance.now())
  //   if (!params && !isEqual(params, paramsFromUrl)) {
  //     setParams(paramsFromUrl)
  //   }
  // }
  // const trueUrlParams = getParamsFromUrl(urlQuery, keys(paramsToUrl))
  // if (paramsToUrl && !isEqual(params, trueUrlParams)) {
  //   console.log(paramsToUrl, trueUrlParams, window.performance.now())
  //   setParams(getParamsFromUrl(urlQuery, keys(paramsToUrl)))
  // }
  // }, [params, paramsToUrl])

  return !data || isLoading ? (
    <Loading />
  ) : (
    <AspectTableCore config={config} tableData={data} params={params} />
  )
}

export default AspectTable
