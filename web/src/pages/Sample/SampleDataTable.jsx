import React from 'react'
import { Table, TableRow, TableCell } from '@mui/material'
import DataTableHead from '../../oldComponents/shared/tableHead'

export { Table as SampleDataTable, DataTableHead as SampleDataTableHead }

export const SampleDataTableRow = ({ sample, onClick, ...props }) => (
  <TableRow onClick={onClick} hover style={{ cursor: 'pointer' }} {...props}>
    <TableCell>{sample.sampleCollectionSite || 'N/A'}</TableCell>
    <TableCell>{sample.sampleCollectedOn}</TableCell>
    <TableCell>{sample.sampleCollectedBy || 'N/A'}</TableCell>
    <TableCell>{sample.sampleExternalId || 'N/A'}</TableCell>
    <TableCell>{sample.patientId || 'N/A'}</TableCell>
    <TableCell>{sample.dateUploadedToAspect}</TableCell>
    <TableCell>{sample.result}</TableCell>
    <TableCell>{sample.resultDate}</TableCell>
  </TableRow>
)
