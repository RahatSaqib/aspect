import React, { Fragment, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useTable, useSortBy, usePagination } from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TablePagination from '@material-ui/core/TablePagination'

import TableColumnHeader from './TableColumnHeader'
import { buildColumnsFromData } from './Helpers'

function AspectTable({ tableData: data, config }) {
  const columns = useMemo(() => buildColumnsFromData(config), [config])
  const {
    getTableProps,
    gotoPage,
    headerGroups,
    page,
    pageCount,
    prepareRow,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable({ columns, data }, useSortBy, usePagination)

  const handleChangePage = (event, newPage) => {
    gotoPage(newPage)
  }

  function handleChangeRowsPerPage(event) {
    setPageSize(Number(event.target.value))
  }

  return data ? (
    <Fragment>
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map(({ headers, getHeaderGroupProps }) => (
            <TableRow {...getHeaderGroupProps()}>
              {headers.map(
                ({
                  getHeaderProps,
                  getSortByToggleProps,
                  isSorted,
                  isSortedDesc,
                  render,
                }) => {
                  return (
                    <TableCell {...getHeaderProps(getSortByToggleProps())}>
                      <TableColumnHeader
                        render={render('Header')}
                        isSorted={isSorted}
                        isSortedDesc={isSortedDesc}
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
            const { getRowProps, cells } = row
            return (
              <TableRow {...getRowProps()}>
                {cells.map(({ getCellProps, render }) => {
                  return (
                    <TableCell {...getCellProps()}>{render('Cell')}</TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={pageSize}
        page={pageIndex}
        backIconButtonProps={{
          'aria-label': 'Previous Page',
        }}
        nextIconButtonProps={{
          'aria-label': 'Next Page',
        }}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Fragment>
  ) : null
}

AspectTable.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default AspectTable
