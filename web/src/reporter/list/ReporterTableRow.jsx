import React from 'react'
import classnames from 'classnames/bind'
import { useLocation } from 'react-router-dom'
import AspectLink from '../../MigratedComponents/AspectLink'
import {
  buildURL,
  getFiltersObjectFromLocation,
} from '../../MigratedComponents/AspectLink/helpers'

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
  const LinkToResults = ({ params = {}, children }) => (
    <AspectLink
      to={buildURL('/browse/result', {
        filters: {
          reportableSiteName: reporter.get('siteName'),
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
      <TableCell>
        <LinkToResults>{reporter.get('totalResults')}</LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyReportableResults: true,
            onlyTreatmentRequired: true,
          }}
        >
          {reporter.get('delivered')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyReportableResults: true,
            onlyTreatmentRequired: true,
          }}
        >
          {reporter.get('requiresTreatment')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyTreatmentRequired: true,
            treatmentStatus: 'OnTreatment',
          }}
        >
          {reporter.get('onTreatment')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyEverTransferred: true,
            onlyTreatmentRequired: true,
          }}
        >
          {reporter.get('transferred')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyReportableResults: true,
            onlyTreatmentRequired: true,
            treatmentStatus: 'NotPossible',
          }}
        >
          {reporter.get('notPossible')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyReportableResults: true,
            onlyTreatmentRequired: true,
            treatmentStatus: 'AwaitingTreatment',
          }}
        >
          {reporter.get('notOnTreatment')}
        </LinkToResults>
      </TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
