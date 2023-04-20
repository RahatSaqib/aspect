import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ClearIcon from '@mui/icons-material/Clear'
import RemoveIcon from '@mui/icons-material/Remove'
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
  IconButton,
} from '@mui/material'

function getComparator(order, orderBy) {
  const descendingComparator = (a, b, orderBy) => (b[orderBy] < a[orderBy] ? -1 : b[orderBy] > a[orderBy] ? 1 : 0)

  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const NestedTable = ({ columns, rows, isDetail }) => {
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

  const containChildren = rows && rows.some(r => (r.children || []).length)
  return rows ? (
    <Table>
      <TableHead>
        <TableRow>
          {containChildren ? <TableCell /> : null}
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
        ).map((row, i) => {
          const hasChildren = row?.children?.length > 0 ?? false
          const totalCols = hasChildren ? columns.length + 1 : columns.length
          return (
            <>
              <TableRow sx={{ backgroundColor: colors[i % 2] }}>
                {containChildren ? (
                  <TableCell>
                    {hasChildren ? (
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(open === row.id ? -1 : row.id)}
                      >
                        {open === row.id ? <RemoveIcon /> : <AddIcon />}
                      </IconButton>
                    ) : (
                      <IconButton aria-label="expand row" size="small">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </TableCell>
                ) : null}
                {columns.map((c, i) => (
                  <TableCell scope="row" key={c.prop} align={i !== 0 ? 'right' : undefined}>
                    {i === 0 ? row[row.type] : row[c.prop]}
                  </TableCell>
                ))}
              </TableRow>
              {hasChildren ? (
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                  <TableCell sx={{ pl: 0.5, pr: 0, pt: 0, pb: 0 }} colSpan={totalCols}>
                    <Collapse in={open === row.id} timeout="auto" unmountOnExit>
                      <Box sx={{ ml: 0.5, mr: 0.5, backgroundColor: colors[i % 2] }}>
                        <NestedTable columns={columns} rows={row.children} />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              ) : null}
            </>
          )
        })}

        {emptyRows > 0 && (
          <TableRow style={{ height: 44.5 * emptyRows }}>
            <TableCell colSpan={6} />
          </TableRow>
        )}
      </TableBody>
      {rows.length > rowsPerPage ? (
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 20, { label: 'All', value: -1 }]}
              colSpan={6}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  ) : null
}

export default NestedTable
