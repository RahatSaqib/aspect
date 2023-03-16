import React, { useState } from 'react'
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  TableSortLabel,
} from '@mui/material'

function getComparator(order, orderBy) {
  const descendingComparator = (a, b, orderBy) => (b[orderBy] < a[orderBy] ? -1 : b[orderBy] > a[orderBy] ? 1 : 0)

  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const NestedTable = ({ columns, rows, hasDetail, isDetail }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState(columns[0].prop)
  const [open, setOpen] = useState(-1)
  const colors = isDetail ? ['#dadbdf', '#e6e6e6'] : ['#eef1f8', '#ffffff']

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

  const handleChangePage = (event, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((c, idx) => (
            <TableCell key={c.prop} align={idx !== 0 ? 'right' : undefined}>
              <TableSortLabel
                active={orderBy === c.prop}
                direction={orderBy === c.prop ? order : 'asc'}
                onClick={() => {
                  const isAsc = orderBy === c.prop && order === 'asc'
                  setOrder(isAsc ? 'desc' : 'asc')
                  setOrderBy(c.prop)
                  setPage(0)
                }}
              >
                {c.name}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {(rowsPerPage > 0
          ? rows.sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          : rows
        ).map((row, i) => (
          <>
            <TableRow sx={{ backgroundColor: colors[i % 2] }} onClick={() => setOpen(open === row.id ? -1 : row.id)}>
              <TableCell scope="row">{row.name}</TableCell>
              <TableCell align="right">{row.quantity}</TableCell>
              <TableCell align="right">{row.lastSixMonths}</TableCell>
              <TableCell align="right">{row.used}</TableCell>
              <TableCell align="right">{row.rate}</TableCell>
              <TableCell align="right">{row.left}</TableCell>
            </TableRow>
            {hasDetail ? (
              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell sx={{ p: 0 }} colSpan={7}>
                  <Collapse in={open === row.id} timeout="auto" unmountOnExit>
                    <Box sx={{ ml: 0.5, mr: 0.5, backgroundColor: colors[i % 2] }}>
                      <NestedTable columns={columns} rows={row.detail} isDetail />
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            ) : null}
          </>
        ))}

        {emptyRows > 0 && (
          <TableRow style={{ height: 44.5 * emptyRows }}>
            <TableCell colSpan={6} />
          </TableRow>
        )}
      </TableBody>
      {!isDetail ? (
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 20, { label: 'All', value: -1 }]}
              colSpan={6}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{ native: true }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  )
}

export default NestedTable
