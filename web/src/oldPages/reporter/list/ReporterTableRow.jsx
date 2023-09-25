import React from 'react'
import classnames from 'classnames/bind'
import { useLocation } from 'react-router-dom'
import AspectLink from '../../../components/AspectLink'
import { buildURL } from '../../../components/AspectLink/helpers'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../oldComponents/shared/tableBody'
import { useFilterUpdate, useFilterValues } from '../../../providers/FilterProvider'
import ReporterLinkCell from './ReporterLinkCell'

const cssClasses = classnames.bind(styles)
const destinationPath = '/browse/result'

const ReporterTableRow = ({ reporter, ...restProps }) => {
  const [update] = useFilterUpdate()
  const location = useLocation()
  const currentFilters = useFilterValues(location.pathname)
  const LinkToResults = ({ params = {}, children }) => (
    <AspectLink
      onClick={() =>
        update(
          {
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
          destinationPath
        )
      }
      to={buildURL(destinationPath)}
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
