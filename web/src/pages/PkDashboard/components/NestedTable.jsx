import React, { useState } from 'react'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material'

function addDepth(items) {
  const tree = { children: items }
  const stack = [[tree, 0]]
  let n
  while (stack?.length) {
    n = stack.length
    const [node, i] = stack[n - 1]
    if (i < node?.children?.length) {
      stack.push([node.children[i], 0])
      // eslint-disable-next-line no-plusplus
      stack[n - 1][1]++
    } else {
      stack.pop()
      node.depth = n
    }
  }

  return tree?.children
}

function getComparator(order, orderBy) {
  const descendingComparator = (a, b, orderBy) => (b[orderBy] < a[orderBy] ? -1 : b[orderBy] > a[orderBy] ? 1 : 0)

  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const NestedTable = ({ columns, rows, isDetail, perPage = 10 }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(perPage)
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

  return rows ? (
    <Table style={{ tableLayout: 'fixed' }}>
      {!isDetail ? (
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
      ) : null}
      <TableBody>
        {(rowsPerPage > 0
          ? rows.sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          : rows
        ).map((row, i) => {
          const hasChildren = row?.children?.length > 0 ?? false
          return (
            <>
              <TableRow sx={{ backgroundColor: colors[i % 2] }} onClick={() => setOpen(open === row.id ? -1 : row.id)}>
                {columns.map((c, i) => (
                  <TableCell
                    width="10%"
                    scope={i === 0 ? 'row' : undefined}
                    style={{ paddingLeft: row?.depth * 7.5 }}
                    key={c.prop}
                    align={i !== 0 ? 'right' : undefined}
                  >
                    {i === 0 ? (
                      <Box display="flex">
                        <Box sx={{ opacity: hasChildren ? 1 : 0, display: 'flex', alignItems: 'center' }}>
                          {open === row.id ? <ExpandLess /> : <ExpandMore />}
                        </Box>
                        <span>{row[c.prop]}</span>
                      </Box>
                    ) : (
                      row[c.prop]
                    )}
                  </TableCell>
                ))}
              </TableRow>
              {hasChildren ? (
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                  <TableCell sx={{ p: 0 }} colSpan={columns?.length}>
                    <Collapse in={open === row.id} timeout="auto" unmountOnExit>
                      <Box sx={{ backgroundColor: colors[i % 2] }}>
                        <NestedTable perPage={rowsPerPage} columns={columns} isDetail rows={row.children} />
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
            <TableCell colSpan={columns?.length + 1} />
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

export default props => {
  const { rows, ...rest } = props
  return <NestedTable rows={addDepth(rows ?? [])} {...rest} />
}
