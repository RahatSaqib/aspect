import React from 'react'
import classnames from 'classnames/bind'
import { useLocation } from 'react-router-dom'
import AspectLink from '../../../components/AspectLink'
import { buildURL, getFiltersObjectFromLocation } from '../../../components/AspectLink/helpers'

import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'

import ReporterLinkCell from './ReporterLinkCell'

import styles from '../../../oldComponents/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const ReporterTableRow = ({ reporter, ...restProps }) => {
  const location = useLocation()
  // Get current filters - Needed for adding the selected date filters
  const currentFilters = getFiltersObjectFromLocation(location)
  const LinkToResults = ({ params = {}, children }) => (
    <AspectLink
      to={buildURL('/browse/result', {
        filters: {
          ...currentFilters,
          ...params,
          /**
           * when both `reportableSiteName` and `reportableSiteId` are specified then
           * it means we fetch from API data for concrete site Id, and use name as initial text
           * value for AutoComplete in filter panel and as label for filter button.
           * So:
           * - reportableSiteName - for initialInputValue in AutoComplete and to show in filter button
           * - reportableSiteId - for payload to fetch data
           */
          reportableSiteName: reporter.get('siteName'),
          reportableSiteId: reporter.get('siteId'),
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
        <LinkToResults
          params={{
            onlyReportableResults: true,
          }}
        >
          {reporter.get('totalResults')}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{
            onlyDownloadedByReporter: true,
            onlyReportableResults: true,
            onlyTreatmentRequired: false,
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
