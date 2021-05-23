import React from 'react'
import classnames from 'classnames/bind'
import AspectLink from '../../MigratedComponents/AspectLink'
import { buildURL, getFiltersObjectFromLocation } from '../../MigratedComponents/AspectLink/helpers'
import { useLocation } from 'react-router-dom'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

import ReporterLinkCell from './ReporterLinkCell'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const ReporterTableRow = ({ reporter, ...restProps }) => {
  const location = useLocation()
  // Get current filters - Needed for adding the selected date filters
  const currentFilters = getFiltersObjectFromLocation(location)
  const LinkToResults = ({ params, children }) => (
    <AspectLink
      to={buildURL('/browse/result', {
        filters: {
          reportableSiteName: reporter.get('siteName'),
          onlyReportableResults: true,
          onlyTreatmentRequired: true,
          ...currentFilters,
          ...params,
        },
      })}
    >
      {children}
    </AspectLink>
  )

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>
        <ReporterLinkCell data={reporter} />
      </TableCell>
      <TableCell>{reporter.get('totalResults')}</TableCell>
      <TableCell>{reporter.get('delivered')}</TableCell>
      <TableCell>
        <LinkToResults params={{ onlyTreatmentRequired: true, treatmentStatus: 'AwaitingTreatment' }}>
          {reporter.get('requiresTreatment')}
        </LinkToResults>
      </TableCell>
      <TableCell>{reporter.get('onTreatment')}</TableCell>
      <TableCell>
        <LinkToResults params={{ onlyEverTransferred: true }}>
          {reporter.get('transferred')}
        </LinkToResults>
      </TableCell>
      <TableCell>{reporter.get('notPossible')}</TableCell>
      <TableCell>{reporter.get('notOnTreatment')}</TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
