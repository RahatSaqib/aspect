import React, { Fragment, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
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

import TableColumnHeader from './TableHeader/TableColumnHeader'
import TableColumnOrderButtons from './TableHeader/TableColumnOrderButtons'
import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import TableColumnGroupBy from './TableHeader/TableColumnGroupBy'
import TableColumnHideButton from './TableHeader/TableColumnHideButton'

import Cell from './TableCell/Cell'
import GroupedCell from './TableCell/GroupedCell'
import PlaceholderCell from './TableCell/PlaceholderCell'

import AspectTablePagination from './TablePagination'
import { buildColumnsFromData, getCurrentColumnIndexAndShift } from './Helpers'

const AspectTable = ({ tableData: data, config }) => {
  const { name } = config
  const {
    columns,
    initialSortBy,
    columnOrder: { allow: allowColumnReOrder, initialOrder } = false,
  } = useMemo(() => buildColumnsFromData(config), [config])

  const table = useTable(
    { columns, data },
    useColumnOrder,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination
  )

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
  } = table

  const handleChangeRowsPerPage = val => {
    setPageSize(typeof val !== 'number' ? data.length : Number(val))
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

  return data ? (
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
              {headers.map(
                (
                  {
                    canSort,
                    canGroupBy,
                    disableHide,
                    getHeaderProps,
                    getGroupByToggleProps,
                    getSortByToggleProps,
                    id,
                    isGrouped,
                    isSorted,
                    isSortedDesc,
                    render,
                    width,
                  },
                  index
                ) => {
                  return (
                    <TableCell
                      {...getHeaderProps(
                        getSortByToggleProps(),
                        getGroupByToggleProps()
                      )}
                      style={{ width: `${width}%` }}
                    >
                      <TableColumnHeader
                        width={width}
                        render={render('Header')}
                        canSort={canSort}
                        canGroupBy={canGroupBy}
                        isSorted={isSorted}
                        isSortedDesc={isSortedDesc}
                        headerOrderComponent={() =>
                          allowColumnReOrder ? (
                            <TableColumnOrderButtons
                              headerIndex={index}
                              headersLength={headers.length}
                              handleChangeColumnOrder={handleChangeColumnOrder}
                            />
                          ) : null
                        }
                        headerVisibilityComponent={() =>
                          !disableHide ? (
                            <TableColumnHideButton
                              headerIndex={id}
                              handleHideColumnToggle={handleHideColumnToggle}
                            />
                          ) : null
                        }
                        headerGroupByComponent={() =>
                          canGroupBy ? (
                            <TableColumnGroupBy
                              headerIndex={id}
                              handleGroupByColumnToggle={
                                handleGroupByColumnToggle
                              }
                              isGrouped={isGrouped}
                            />
                          ) : null
                        }
                      />
                    </TableCell>
                  )
                }
              )}
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
                {cells.map(
                  ({
                    getCellProps,
                    column: { format = false },
                    render,
                    isGrouped,
                    isAggregated,
                    isPlaceholder,
                    value,
                  }) => {
                    return (
                      <TableCell {...getCellProps()}>
                        {isGrouped ? (
                          <GroupedCell
                            format={format}
                            getToggleRowExpandedProps={
                              getToggleRowExpandedProps
                            }
                            isExpanded={isExpanded}
                            render={render}
                            subRows={subRows}
                            value={value}
                          />
                        ) : isAggregated ? (
                          render('Aggregated')
                        ) : isPlaceholder ? (
                          <PlaceholderCell />
                        ) : (
                          <Cell render={render} format={format} value={value} />
                        )}
                      </TableCell>
                    )
                  }
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <AspectTablePagination
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={data.length}
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
  ) : null
}

AspectTable.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default AspectTable
