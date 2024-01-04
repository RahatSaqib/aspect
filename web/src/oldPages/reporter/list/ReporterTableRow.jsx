import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import useFilterValues from '../../../hooks/useFilterValues'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../oldComponents/shared/tableBody'
import { buildURL } from './helpers'
import btnStyles from './ReporterList.module.css'

const destinationPath = '/browse/result'

const ReporterTableRow = ({ reporter, ...restProps }) => {
  const [update] = useFilterUpdate()
  const location = useLocation()
  const currentFilters = useFilterValues(location.pathname)
  const LinkToResults = ({ params = {}, children }) => (
    <Link
      to={buildURL(destinationPath)}
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
            reportableSiteName: reporter.siteName,
            reportableSiteId: reporter.siteId,
          },
          destinationPath
        )
      }
    >
      {children}
    </Link>
  )

  return (
    <TableRow {...restProps} className={styles[restProps.className]}>
      <TableCell>
        <Link to={`/browse/site/${reporter.siteId}`} {...restProps} className={btnStyles.site__details}>
          {reporter.siteName}
        </Link>
      </TableCell>
      <TableCell>
        <LinkToResults params={{ onlyReportableResults: true }}>{reporter.totalResults}</LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{ onlyDownloadedByReporter: true, onlyReportableResults: true, onlyTreatmentRequired: false }}
        >
          {reporter.delivered}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{ onlyDownloadedByReporter: true, onlyReportableResults: true, onlyTreatmentRequired: true }}
        >
          {reporter.requiresTreatment}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults
          params={{ onlyDownloadedByReporter: true, onlyTreatmentRequired: true, treatmentStatus: 'OnTreatment' }}
        >
          {reporter.onTreatment}
        </LinkToResults>
      </TableCell>
      <TableCell>
        <LinkToResults params={{ onlyDownloadedByReporter: true, onlyTreatmentRequired: true }}>
          {reporter.transferred}
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
          {reporter.notPossible}
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
          {reporter.notOnTreatment}
        </LinkToResults>
      </TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
