import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { formatDate } from '../../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ResultTableRow = ({ intl, result, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {formatDate(result.get('endedOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleOriginSiteName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleId')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleGroup')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('resultText')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('resultWorkflowStatus')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('patientId')}
    </TableCell>
  </TableRow>
)

export default enhance(ResultTableRow)
