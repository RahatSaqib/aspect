import React from 'react'
import classnames from 'classnames/bind'
import AspectLink from '../../MigratedComponents/AspectLink'
import { buildLink } from '../../MigratedComponents/AspectLink/helpers'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

import ReporterLinkCell from './ReporterLinkCell'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const LinkToResults = ({ params, children }) => <AspectLink to={buildLink('/browse/result', params)}>{children}</AspectLink>

const ReporterTableRow = ({ reporter, ...restProps }) => {
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>
        <ReporterLinkCell data={reporter} />
      </TableCell>
      <TableCell>{reporter.get('totalResults')}</TableCell>
      <TableCell>{reporter.get('delivered')}</TableCell>
      <TableCell><LinkToResults params={{ filters: { onlyTreatmentRequired: true } }}>{reporter.get('requiresTreatment')}</LinkToResults></TableCell>
      <TableCell>{reporter.get('onTreatment')}</TableCell>
      <TableCell><LinkToResults params={{ filters: { onlyEverTransferred: true } }}>{reporter.get('transferred')}</LinkToResults></TableCell>
      <TableCell>{reporter.get('notPossible')}</TableCell>
      <TableCell>{reporter.get('notOnTreatment')}</TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
