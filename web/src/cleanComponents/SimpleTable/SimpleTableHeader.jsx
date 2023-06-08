import React from 'react'
import { TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material'

const SimpleTableHeader = ({ columns, sortCol, setSortCol, sortDir, setSortDir }) => {
  const createSortHandler = property => () => {
    const isAsc = sortCol === property && sortDir === 'asc'
    setSortDir(isAsc ? 'desc' : 'asc')
    setSortCol(property)
  }

  return (
    <TableHead>
      <TableRow>
        {columns.map((col, i) => (
          <TableCell
            key={i}
            align="left"
            padding="normal"
            sortDirection={sortCol === col.id ? sortDir : false}
            style={{ width: `${col.width}%` }}
          >
            <TableSortLabel
              active={sortCol === col.id}
              direction={sortCol === col.id ? sortDir : 'asc'}
              onClick={createSortHandler(col.id)}
            >
              {col.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default SimpleTableHeader
