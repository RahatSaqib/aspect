import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps,withState, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import CloudDownloadIcon  from '@material-ui/icons/CloudDownload' 
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { stringify } from 'querystring'
import { mergeToFiltersParams } from '../../filter/utils'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import config from '../../config'
import { fetchDevices, exportDevices } from '../DeviceRedux'
import {
  DeviceDataTable,
  DeviceDataTableHead,
  DeviceDataTableRow,
} from './DeviceDataTable'
import messages from './messages'

const cssClasses = classnames.bind(require('./DeviceList.css'))
const FILTERS_CONFIG = [
  {
    assayAndResultCategory: true,
    requiredPermissions: ['assay:view', 'assay:admin', 'assay:edit'],
  },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  },
  { date: true, requiredPermissions: [] },
  {
    deviceName: true,
    requiredPermissions: [],
  },
  {
    deviceType: true,
    requiredPermissions: [],
  },
  {
    deviceStatus: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'name',
    'status',
    'availabilityRate',
    'errorRate',
    'createdOn',
    'lastSeen',
    'lastMonth',
    'thisMonth',
  ],
})

const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps( 
    makeSortPageSelector({
      sortCol: 'name',
    }),({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      return {
        filters: _.fromPairs([...filtersParams.entries()]),
      }
    }
  ),
  connect(
    state => ({
      items: state.device.items,
      table: state.device.table,
      userPermissions: state.user.jwt.permissions,
      displayPreferences: state.user.displayPreferences,
    }),
    bindActionCreators.bind(null, {
      fetchDevices,
      exportDevices,
    })
  ),
  withState('anchorEl','setAnchorEl',false),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchDevices,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchDevices(
          filtersParams,
          { hasResults: 1 },
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },
    onPopoverClick:(({setAnchorEl})=>(event)=>{setAnchorEl(event.currentTarget)}),
    onPopoverClose:(({setAnchorEl})=>()=>{setAnchorEl(null)}),
    onExcelClick: ({
      location,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
    
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      const filterMerged = mergeToFiltersParams({hasResult:1, format:'xlsx'}, filtersParams)
      const filters = _.fromPairs([...filterMerged.entries()])
      if (!sanitized) {
        console.log('aca')
       const url= `${config.aspectApi}/device/export?${stringify({
          sortCol,
          sortDir,
          page: pageAt,
          size: pageSize,
          ...filters,
        })}`
        var a =document.getElementById('ReportAnchorLink')
        a.href = url
        a.click()

      
      }
    },
   
    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { deviceId },
      },
    }) => history.push(`/browse/device/${deviceId}`),
    onAlertClick: ({ history }) => event => {
      event.stopPropagation()
      const {
        currentTarget: {
          dataset: { deviceId },
        },
      } = event
      history.push(`/browse/device/${deviceId}/alerts`)
    },
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
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })
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

export const DeviceList = ({
  intl,
  history,
  location,
  table,
  items,
  displayPreferences,
  // --- injected by recompose ---
  onPopoverClick,
  onPopoverClose,
  onExcelClick,
  anchorEl,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onExportClick,
  onRowClick,
  onAlertClick,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.devicesTitle)} />
    <NavTitle title={intl.formatMessage(messages.devicesTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
      onClickExport={onExportClick}
      askConfirmationForExport={table.total > 1000}
    />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      <div>
      <IconButton variant="contained" onClick={onPopoverClick} className={classnames('DownloadButton')}>
        <CloudDownloadIcon></CloudDownloadIcon>
      </IconButton>
      <Popover
      id='simple-popover'
      open={Boolean(anchorEl)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      anchorEl={anchorEl}
      className={classnames('Popover')}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      onClose={onPopoverClose}
      >

      <ol style={{listStyleType: 'none', padding:'5px',margin:'5px 30px 5px 30px'}}>
      <li> <a inverse onClick={onExcelClick}> Excel</a></li>
      <li>CSV</li>
      <a id={'ReportAnchorLink'}></a>
    </ol>
  
        
      </Popover>
    </div>
      {!items.currentIdList.isEmpty() && (
        <DeviceDataTable
          selectable={false}
          className={cssClasses('DeviceDataTable')}
        >
          <DeviceDataTableHead
            compact
            columns={[
              {
                key: 'empty',
                colSpan: 7,
              },
              {
                key: 'tests',
                colSpan: 2,
                label: intl.formatMessage(messages.numberOfTests),
              },
            ]}
          />
          <DeviceDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.devicesTitle),
                sortable: true,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                sortable: true,
              },
              {
                key: 'availabilityRate',
                label: intl.formatMessage(messages.availabilityRate),
                sortable: false,
              },
              {
                key: 'errorRate',
                label: intl.formatMessage(messages.errorRate),
                sortable: false,
              },
              {
                key: 'issueCategory',
                label: intl.formatMessage(messages.issueCategory),
              },
              {
                key: 'createdOn',
                sortable: true,
                label: intl.formatMessage(messages.reportingFor),
              },
              {
                key: 'lastSeen',
                sortable: true,
                label: intl.formatMessage(messages.lastSeen),
              },
              {
                key: 'lastMonth',
                sortable: true,
                label: intl.formatMessage(messages.lastMonth),
              },
              {
                key: 'thisMonth',
                sortable: true,
                label: intl.formatMessage(messages.thisMonth),
              },
            ]}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(device => (
                <DeviceDataTableRow
                  key={device.get('id')}
                  intl={intl}
                  device={device}
                  onClick={onRowClick}
                  onAlertClick={onAlertClick}
                  displayPreferences={displayPreferences}
                  data-device-id={device.get('id')}
                />
              ))}
          </TableBody>
        </DeviceDataTable>
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
    </DataTableCard>
  </div>
)

export default enhance(DeviceList)