import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import IconButton from '@material-ui/core/IconButton'
import Card from '@material-ui/core/Card'
import { MdFileDownload } from 'react-icons/md'
import TableBody from '@material-ui/core/TableBody'
import Table from '@material-ui/core/Table'
import { fetchResults, exportResults } from '../ResultRedux'

import DataTableHead from '../../components/shared/tableHead'
import {
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import requirePermissions from '../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('../list/ResultList.css'))

const messages = defineMessages({
  paginatorStatus: {
    id: 'component.historyResults.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# result}
      other {# results}
    }`,
  },
})
const FILTERS_CONFIG = {
  assayAndResultCategory: true,
  geography: true,
  state: true,
  lga: true,
  date: true,
  patientOrResearchId: true,
  sampleId: true,
  errorCode: true,
  siteName: true,
  sampleOriginSite: true,
  workflowStatus: true,
}

const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'endedOn',
    'deviceName',
    'sampleOriginSiteName',
    'sampleId',
    'errorCode',
    'patientId',
  ],
})

const enhanceResults = compose(
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  }),
  connect(
    state => ({
      items: state.result.items,
      table: state.result.table,
    }),
    bindActionCreators.bind(null, {
      fetchResults,
      exportResults,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      match,
      location,
      fetchResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        filtersParams.set('deviceId', match.params.deviceId)
        fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onExportClick: ({
      location,
      exportResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportResults(
          filtersParams,
          formatType,
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },

    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { resultId },
      },
    }) => history.push(`/browse/result/${resultId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const Results = ({
  intl,
  history,
  location,
  sortDir,
  sortCol,
  pageAt,
  pageSize,
  // injected by recompose
  items,
  table,
  columns,
  onExportClick,
  onRowClick,
}) => (
  <section className={cssClasses('Section')}>
    <Card className={cssClasses('Section__Content')}>
      <header className={cssClasses('Header')}>
        <div className={cssClasses('Header__Title')}>Test history</div>
        <div className={cssClasses('Header__Actions')}>
          <IconButton onClick={onExportClick}>
            <MdFileDownload />
          </IconButton>
        </div>
      </header>
      <div>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <Table selectable={false} className={cssClasses('ResultDataTable')}>
            <DataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={columns}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(result => (
                  <TableRow
                    key={result.get('id')}
                    onClick={onRowClick}
                    data-result-id={result.get('id')}
                  >
                    {columns &&
                      _.map(columns, elem => (
                        <TableCell>
                          {elem.formatter
                            ? elem.formatter(result.get(elem.key))
                            : result.get(elem.key)}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </div>
    </Card>
  </section>
)

export default enhanceResults(Results)
