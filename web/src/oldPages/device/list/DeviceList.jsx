import React, { useEffect, useState } from 'react'
import {
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TableBody,
  TextField,
  Typography,
} from '@mui/material'
import classnames from 'classnames/bind'
import format from 'date-fns/format'
import subDays from 'date-fns/subDays'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useQuery, useQueryClient } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import ExportListButton from '../../../components/AspectExportListButton'
import { DEVICE_LIST } from '../../../components/QueryFetch/Device/index'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import useDeviceForSelect from '../../../hooks/device/useDeviceForSelect'
import useMergeDevices from '../../../hooks/device/useMergeDevices'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useAuthState } from '../../../providers/AuthProvider'
import PermissionsProvider from '../../../providers/PermissionsProvider/index'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
import { receiveListWithSet, Items } from '../../../utils/metaReducers/items'
import { receiveTableItems, Table } from '../../../utils/metaReducers/table'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import getExportableFile from '../DeviceQueries'
import { DeviceDataTable, DeviceDataTableHead, DeviceDataTableRow } from './DeviceDataTable'
import styles from './DeviceList.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)
const FILTERS_CONFIG = [
  {
    assayId: true,
    requiredPermissions: [],
  },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
  {
    deviceName: true,
    requiredPermissions: ['device'],
  },
  {
    deviceStatus: true,
    requiredPermissions: [],
  },
  {
    deviceMaintenanceStatus: true,
    requiredPermissions: [],
  },
  {
    deviceType: true,
    requiredPermissions: [],
  },
  {
    deviceApproval: true,
    requiredPermissions: [],
  },
  {
    issueTypeId: true,
    requiredPermissions: [],
  },
  {
    connectorStatus: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'name',
    'siteName',
    'maintenanceStatusI18nKey',
    'approvalStatusI18nKey',
    'availabilityRate',
    'errorRate',
    'createdOn',
    'lastPingOn',
    'resultCountLastMonth',
    'resultCountThisMonth',
    'deviceStatus',
    'connectorVersion',
    'lastResultConductedOn',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const { dateFormat } = getAspectDisplayPreferences().toJS()

const getColumns = intl => [
  {
    key: 'name',
    label: intl.formatMessage(messages.device),
    sortable: true,
  },
  {
    key: 'siteName',
    label: intl.formatMessage(messages.site),
    sortable: true,
    hiddenOn: 'lg',
  },
  {
    key: 'approvalStatusI18nKey',
    label: intl.formatMessage(messages.approvalStatus),
    sortable: true,
  },
  {
    key: 'deviceStatus',
    label: intl.formatMessage(messages.deviceStatus),
    sortable: true,
  },
  {
    key: 'maintenanceStatusI18nKey', // TODO: as the sorting occurs on the API, if we have this key in different languages, then probably the sorting won't work correctly
    label: intl.formatMessage(messages.maintenanceStatus),
    sortable: true,
  },
  {
    key: 'lastResultConductedOn',
    label: intl.formatMessage(messages.lastResultConductedOn),
    sortable: true,
  },
  {
    key: 'connectorStatus',
    sortable: false,
    label: intl.formatMessage(messages.connectorStatus),
  },
  {
    key: 'lastPingOn',
    sortable: true,
    label: intl.formatMessage(messages.lastSeen),
    tooltip: intl.formatMessage(messages.lastSeenDescription),
  },
  {
    key: 'connectorVersion',
    sortable: true,
    label: intl.formatMessage(messages.connectorVersion),
    hiddenOn: 'lg',
  },
  {
    key: 'issueCategory',
    label: intl.formatMessage(messages.issueCategory),
  },
  {
    key: 'availabilityRate',
    label: intl.formatMessage(messages.availabilityRate),
    sortable: false,
    tooltip: intl.formatMessage(messages.availabilityRateDescription),
    hiddenOn: 'lg',
  },
  {
    key: 'errorRate',
    label: intl.formatMessage(messages.errorRate),
    sortable: false,
    tooltip: intl.formatMessage(messages.errorRateDescription),
    hiddenOn: 'lg',
  },
  {
    key: 'createdOn',
    sortable: true,
    label: intl.formatMessage(messages.reportingFor),
    hiddenOn: 'lg',
  },
  {
    key: 'resultCountLastMonth',
    sortable: true,
    label: intl.formatMessage(messages.lastMonth),
    hiddenOn: 'lg',
    tooltip: intl.formatMessage(messages.resultCountDescription, {
      startDate: format(subDays(new Date(), 60 + 1), dateFormat),
      endDate: format(subDays(new Date(), 30 + 1), dateFormat),
    }),
  },
  {
    key: 'resultCountThisMonth',
    sortable: true,
    label: intl.formatMessage(messages.thisMonth),
    hiddenOn: 'lg',
    tooltip: intl.formatMessage(messages.resultCountDescription, {
      startDate: format(subDays(new Date(), 30), dateFormat),
      endDate: format(new Date(), dateFormat),
    }),
  },
]

export const DeviceListWithProps = ({
  intl,
  navigate,
  location,
  isLoading,
  items,
  sortCol,
  sortDir,
  reducedFilters,
  onExportClick,
  columns,
  total,
  pageAt,
  pageSize,
  displayPreferences,
  onRowClick,
  onAlertClick,
  isMergeDeviceModalOpen,
  setMergeDeviceModalOpen,
  deviceList,
  mergeDevices,
  sourceDevicesIds,
  setSourceDevicesIds,
  targetDeviceId,
  setTargetDeviceId,
  isConfirmationVisible,
  setConfirmationVisible,
  siteToMergeDevices,
  setSiteToMergeDevices,
  clearMergeDialog,
  deviceTypeToMerge,
  setDeviceTypeToMerge,
  params,
  queryClient,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.devicesTitle)} />
    <NavTitle title={intl.formatMessage(messages.devicesTitle)} />
    <BrowseFilters navigate={navigate} location={location} config={reducedFilters}>
      <PermissionsProvider permissions={['device:admin']}>
        <AspectButton
          onClick={() => {
            setConfirmationVisible(false)
            setMergeDeviceModalOpen(true)
          }}
          type="button"
          color="primary"
          variant="contained"
          browseButton
        >
          {intl.formatMessage(messages.mergeDevices)}
        </AspectButton>
      </PermissionsProvider>
    </BrowseFilters>
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />
      <ExportListButton onExport={onExportClick} visible={!items.currentIdList.isEmpty()} />
      {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
      {!items.currentIdList.isEmpty() && (
        <DeviceDataTable className={cssClasses('DeviceDataTable')}>
          <DeviceDataTableHead
            navigate={navigate}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={columns}
          />
          <TableBody>
            {!items.currentIdList.isEmpty() &&
              items.currentIdList
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
          navigate={navigate}
          location={location}
          paginatorStatus={messages.paginatorStatus}
          total={total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
    <Dialog open={isMergeDeviceModalOpen} onClose={() => setMergeDeviceModalOpen(false)}>
      <DialogTitle>{intl.formatMessage(messages.mergeDevices)}</DialogTitle>
      {!isConfirmationVisible ? (
        <>
          <DialogContent>
            {
              <DialogContentText>
                <span
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: intl.formatMessage(messages.mergeDeviceActionDescription) }}
                />
              </DialogContentText>
            }

            <Autocomplete
              multiple
              onChange={(_, values) => {
                const newSourceValues = values.map(v => +v.key)
                const newSourceSiteId = deviceList.find(o => o.key === values[0]?.key)?.siteId || null
                const newDeviceTypeToMergeId = deviceList.find(o => o.key === values[0]?.key)?.deviceTypeId || null
                setSourceDevicesIds(newSourceValues)
                setSiteToMergeDevices(newSourceSiteId)
                setDeviceTypeToMerge(newDeviceTypeToMergeId)
              }}
              options={
                deviceList?.filter(
                  o =>
                    +o.key !== targetDeviceId &&
                    (!siteToMergeDevices || o.siteId === siteToMergeDevices) &&
                    (!deviceTypeToMerge || o.deviceTypeId === deviceTypeToMerge)
                ) || []
              }
              getOptionLabel={option => option.value}
              renderOption={(props, option) => (
                <li {...props} key={option.key}>
                  {option.value}
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="standard"
                  label={intl.formatMessage(messages.sourceDevices)}
                  placeholder={intl.formatMessage(messages.sourceDevices)}
                />
              )}
            />

            <Autocomplete
              onChange={(_, value) => {
                setTargetDeviceId(+value?.key || null)
              }}
              options={
                deviceList?.filter(
                  o =>
                    !sourceDevicesIds.includes(+o.key) &&
                    (!siteToMergeDevices || o.siteId === siteToMergeDevices) &&
                    (!deviceTypeToMerge || o.deviceTypeId === deviceTypeToMerge)
                ) || []
              }
              getOptionLabel={option => option.value}
              renderOption={(props, option) => (
                <li {...props} key={option.key}>
                  {option.value}
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="standard"
                  label={intl.formatMessage(messages.targetDevice)}
                  placeholder={intl.formatMessage(messages.targetDevice)}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <AspectButton
              onClick={() => {
                clearMergeDialog()
                setMergeDeviceModalOpen(false)
              }}
            >
              {intl.formatMessage(messages.button_Cancel)}
            </AspectButton>

            <AspectButton
              disabled={!sourceDevicesIds.length > 0 || !targetDeviceId}
              onClick={() => {
                setConfirmationVisible(true)
              }}
            >
              {intl.formatMessage(messages.button_Merge)}
            </AspectButton>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>
            <Typography variant="body1">
              {
                <span
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: intl.formatMessage(messages.mergeDevicesConfirmationTitle) }}
                />
              }
            </Typography>
          </DialogTitle>
          <DialogContent>{intl.formatMessage(messages.confirmToProceed)}</DialogContent>
          <DialogActions>
            <AspectButton
              onClick={() => {
                setMergeDeviceModalOpen(false)
                setConfirmationVisible(false)
              }}
            >
              {intl.formatMessage(messages.button_Cancel)}
            </AspectButton>
            <AspectButton
              onClick={() => {
                mergeDevices(
                  { sourceDevicesIds, targetDeviceId },
                  { onSuccess: () => queryClient.invalidateQueries([DEVICE_LIST.KEY, { params }]) }
                )
                clearMergeDialog()
                setMergeDeviceModalOpen(false)
              }}
            >
              {intl.formatMessage(messages.buttonConfirmMerge)}
            </AspectButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  </div>
)

export const DeviceList = () => {
  const { data: deviceList } = useDeviceForSelect({ onlyResultDevices: true })
  const { mutate: mergeDevices } = useMergeDevices()
  const intl = useI18n()
  const navigate = useNavigate()
  const {
    jwt: { permissions: userPermissions },
    displayPreferences,
  } = useAuthState()
  const location = useLocation()

  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(new Table())
  const [total, setTotal] = useState()
  const [sourceDevicesIds, setSourceDevicesIds] = useState([])
  const [targetDeviceId, setTargetDeviceId] = useState()

  const [isMergeDeviceModalOpen, setMergeDeviceModalOpen] = useState(false)
  const [isConfirmationVisible, setConfirmationVisible] = useState(false)
  const [siteToMergeDevices, setSiteToMergeDevices] = useState()
  const [deviceTypeToMerge, setDeviceTypeToMerge] = useState()
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})
  const queryClient = useQueryClient()

  // >>>>>> Constants <<<<<<
  const { sortCol, sortDir, page, size } = pagination
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...pagination, ...filters }

  const onRowClick = ({
    currentTarget: {
      dataset: { deviceId },
    },
  }) => navigate(`/browse/device/${deviceId}`)

  const onAlertClick = event => {
    event.stopPropagation()
    const {
      currentTarget: {
        dataset: { deviceId },
      },
    } = event
    navigate(`/browse/device/${deviceId}/alerts`)
  }

  // >>>>>> Queries <<<<<<
  const {
    data = false,
    isError,
    error,
    isLoading,
  } = useQuery(
    [DEVICE_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: DEVICE_LIST.ENDPOINT,
        params: { ...params, hasResults: 1 },
      }),
    { enabled: !isEmpty(params) }
  )

  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    if (!isLoading && data) {
      const { data: list, total: totalItems } = data
      setItems(receiveListWithSet(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      setTable(receiveTableItems(table, totalItems))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'name',
    })
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setFilters(getFilters(filtersParams))
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      return getExportableFile(filtersParams, formatType, sortCol, sortDir, 0, total, 'devices')
    }
  }

  const clearMergeDialog = () => {
    setSourceDevicesIds([])
    setTargetDeviceId(null)
    setSiteToMergeDevices(null)
    setDeviceTypeToMerge(null)
    setConfirmationVisible(false)
  }

  if (isError) {
    throw new Error(error)
  }

  const baseProps = {
    intl,
    navigate,
    location,
    isLoading,
    items,
    sortCol,
    sortDir,
    columns: getColumns(intl),
    reducedFilters,
    onExportClick,
    table,
    total,
    pageAt: page,
    pageSize: size,
    displayPreferences,
    onRowClick,
    onAlertClick,
    isMergeDeviceModalOpen,
    setMergeDeviceModalOpen,
    deviceList,
    mergeDevices,
    sourceDevicesIds,
    targetDeviceId,
    setSourceDevicesIds,
    setTargetDeviceId,
    isConfirmationVisible,
    setConfirmationVisible,
    siteToMergeDevices,
    setSiteToMergeDevices,
    clearMergeDialog,
    deviceTypeToMerge,
    setDeviceTypeToMerge,
    params,
    queryClient,
  }
  return <DeviceListWithProps {...baseProps} />
}

export default DeviceList
