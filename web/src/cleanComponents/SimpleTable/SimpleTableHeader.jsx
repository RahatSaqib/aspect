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
        {columns.map(headCell => (
          <TableCell
            key={headCell.id}
            align="left"
            padding="normal"
            sortDirection={sortCol === headCell.id ? sortDir : false}
            style={{ width: `${headCell.width}%` }}
          >
            <TableSortLabel
              active={sortCol === headCell.id}
              direction={sortCol === headCell.id ? sortDir : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default SimpleTableHeader
