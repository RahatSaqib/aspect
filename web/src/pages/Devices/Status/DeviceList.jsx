import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  TableBody,
  TextField,
  Typography,
} from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DetailHeader, DeviceListFilter, TableContainer } from '../../../components'
import ExportListButton from '../../../components/AspectExportListButton'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import { getAspectDisplayPreferences } from '../../../components/LocalStorage'
import PermissionChecker from '../../../components/PermissionChecker'
import { DEVICE_LIST } from '../../../components/QueryFetch/Device/index'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import AspectButton from '../../../components/shared/AspectButton'
import DataTableCard from '../../../components/shared/DataTableCard'
import { useDeviceForSelect } from '../../../hooks/device/useDeviceForSelect'
import useMergeDevices from '../../../hooks/device/useMergeDevices'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import { DeviceDataTable, DeviceDataTableHead, DeviceDataTableRow } from './DeviceDataTable'
import styles from './DeviceList.module.css'
import getExportableFile from './DeviceQueries'
import messages from './messages'

const { dateFormat } = getAspectDisplayPreferences()

const getColumns = formatMessage => [
  { key: 'name', label: formatMessage(messages.device), sortable: true },
  { key: 'siteName', label: formatMessage(messages.site), sortable: true, hiddenOn: 'lg' },
  { key: 'approvalStatusI18nKey', label: formatMessage(messages.approvalStatus), sortable: true },
  {
    key: 'deviceStatus',
    label: formatMessage(messages.deviceStatus),
    sortable: true,
    tooltip: formatMessage(messages.deviceStatusDescription),
  },
  // TODO: as the sorting occurs on the API, if we have this key in different languages, then probably the sorting won't work correctly
  { key: 'maintenanceStatusI18nKey', label: formatMessage(messages.maintenanceStatus), sortable: true },
  { key: 'lastResultConductedOn', label: formatMessage(messages.lastResultConductedOn), sortable: true },
  {
    key: 'connectorStatus',
    sortable: false,
    label: formatMessage(messages.connectorStatus),
    tooltip: formatMessage(messages.connectorStatusDescription),
  },
  {
    key: 'lastPingOn',
    sortable: true,
    label: formatMessage(messages.lastSeen),
    tooltip: formatMessage(messages.lastSeenDescription),
  },
  { key: 'connectorVersion', sortable: true, label: formatMessage(messages.connectorVersion), hiddenOn: 'lg' },
  {
    key: 'availabilityRate',
    label: formatMessage(messages.availabilityRate),
    sortable: false,
    tooltip: formatMessage(messages.availabilityRateDescription),
    hiddenOn: 'lg',
  },
  {
    key: 'errorRate',
    label: formatMessage(messages.errorRate),
    sortable: false,
    tooltip: formatMessage(messages.errorRateDescription),
    hiddenOn: 'lg',
  },
  { key: 'createdOn', sortable: true, label: formatMessage(messages.reportingFor), hiddenOn: 'lg' },
  {
    key: 'resultCountLastMonth',
    sortable: true,
    label: formatMessage(messages.lastMonth),
    hiddenOn: 'lg',
    tooltip: formatMessage(messages.resultCountDescription, {
      startDate: format(startOfMonth(subMonths(new Date(), 1)), dateFormat),
      endDate: format(endOfMonth(subMonths(new Date(), 1)), dateFormat),
    }),
  },
  {
    key: 'resultCountThisMonth',
    sortable: true,
    label: formatMessage(messages.thisMonth),
    hiddenOn: 'lg',
    tooltip: formatMessage(messages.resultCountDescription, {
      startDate: format(startOfMonth(new Date()), dateFormat),
      endDate: format(new Date(), dateFormat),
    }),
  },
]

const getAvailableTargetDevices = (deviceList, sourceDevicesIds, siteToMergeDevices, deviceTypeToMerge) => {
  return (
    deviceList?.filter(
      o =>
        !sourceDevicesIds.includes(o.id) &&
        (!siteToMergeDevices || o.siteId === siteToMergeDevices) &&
        (!deviceTypeToMerge || o.deviceTypeId === deviceTypeToMerge)
    ) || []
  )
}

const DeviceList = () => {
  const { data: deviceList } = useDeviceForSelect({ onlyResultDevices: true, showUndeployedDevices: true })
  const { mutate: mergeDevices } = useMergeDevices()
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const { displayPreferences } = useAuthState()
  const location = useLocation()
  const clearMergeDialog = () => {
    setSourceDevicesIds([])
    setTargetDevice(null)
    setSiteToMergeDevices(null)
    setDeviceTypeToMerge(null)
    setConfirmationVisible(false)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [sourceDevicesIds, setSourceDevicesIds] = useState([])
  const [targetDevice, setTargetDevice] = useState(null)
  const targetDeviceId = useMemo(() => +targetDevice?.id || null, [targetDevice])
  const filters = useFilterValues(location.pathname)
  const [isMergeDeviceModalOpen, setMergeDeviceModalOpen] = useState(false)
  const [isConfirmationVisible, setConfirmationVisible] = useState(false)
  const [siteToMergeDevices, setSiteToMergeDevices] = useState()
  const [isProcessingMergeDevices, setProcessingMergeDevices] = useState(false)
  const [deviceTypeToMerge, setDeviceTypeToMerge] = useState()
  const [pagination, setPagination] = useState({})

  const { sortCol, sortDir, page, size } = pagination
  const params = { ...pagination, ...filters }

  const onRowClick = useCallback(
    ({
      currentTarget: {
        dataset: { deviceId },
      },
    }) => gotoWithReturnUrl(`/browse/device/list/${deviceId}`, navigate, location),
    [navigate, location]
  )

  const {
    data,
    isError,
    error,
    isLoading: tableLoading,
    refetch,
  } = useQuery(
    [DEVICE_LIST.KEY, { params }],
    async () => fetchWrapperForQueries({ endpoint: DEVICE_LIST.ENDPOINT, params: { ...params, hasResults: 1 } }),
    { enabled: !isEmpty(pagination) }
  )

  const devices = data?.data ?? []
  const total = data?.total

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  useEffect(() => {
    const sortPage = makeSortPageSelector({ sortCol: 'name' })
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
  }, [location])

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filters, formatType, sortCol, sortDir, total, 'devices')
      .then(response => {
        setIsLoading(false)
        return response
      })
      .catch(error => {
        setIsLoading(false)
        throw error
      })
  }

  const getMergeDevicesErrorMessage = useCallback(
    mergeError => {
      const errorKeyCode = mergeError?.data?.errorKeyCode
      return errorKeyCode && messages[errorKeyCode]
        ? formatMessage(messages[errorKeyCode])
        : formatMessage(messages.devicesMergeFailed)
    },
    [formatMessage]
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <>
      <DetailHeader name={formatMessage(messages.devicesTitle)} disableBack>
        <PermissionChecker permissions={['device:admin']}>
          <AspectButton
            onClick={() => {
              setConfirmationVisible(false)
              setMergeDeviceModalOpen(true)
            }}
            type="button"
            color="primary"
            variant="contained"
            browseButton
            disabled={isProcessingMergeDevices}
          >
            {formatMessage(isProcessingMergeDevices ? messages.mergingDevices : messages.mergeDevices)}
            {isProcessingMergeDevices ? (
              <CircularProgress size="16px" thickness={5} disableShrink sx={{ color: '#fff', marginLeft: '15px' }} />
            ) : null}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.devicesTitle)} />
        <DeviceListFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <ExportListButton onExport={onExportClick} visible={devices.length > 0} />
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : devices.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <div style={{ overflowY: 'hidden', overflowX: 'scroll' }}>
                <TableContainer>
                  <DeviceDataTable className={styles.DeviceDataTable}>
                    <DeviceDataTableHead
                      navigate={navigate}
                      location={location}
                      sortColumnKey={sortCol}
                      sortColumnDir={sortDir}
                      columns={getColumns(formatMessage)}
                    />
                    <TableBody>
                      {devices.map(device => (
                        <DeviceDataTableRow
                          key={device.id}
                          device={device}
                          onClick={onRowClick}
                          displayPreferences={displayPreferences}
                          data-device-id={device.id}
                        />
                      ))}
                    </TableBody>
                  </DeviceDataTable>
                </TableContainer>
              </div>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                paginatorStatus={messages.paginatorStatus}
                total={total}
                pageAt={page}
                pageSize={size}
              />
            </>
          )}
        </DataTableCard>
        <Dialog open={isMergeDeviceModalOpen} onClose={() => setMergeDeviceModalOpen(false)}>
          <DialogTitle>{formatMessage(messages.mergeDevices)}</DialogTitle>
          {!isConfirmationVisible ? (
            <>
              <DialogContent>
                {
                  <DialogContentText>
                    <span
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: formatMessage(messages.mergeDeviceActionDescription) }}
                    />
                  </DialogContentText>
                }

                <Autocomplete
                  multiple
                  onChange={(_, values) => {
                    const newSourceValues = values.map(v => v.id)
                    const newSourceSiteId = deviceList.find(o => o.id === values[0]?.id)?.siteId || null
                    const newDeviceTypeToMergeId = deviceList.find(o => o.id === values[0]?.id)?.deviceTypeId || null

                    /**
                     * get new list of available target devices after changing selected source devices
                     */
                    const targetDevices = getAvailableTargetDevices(
                      deviceList,
                      newSourceValues,
                      newSourceSiteId,
                      newDeviceTypeToMergeId
                    )
                    if (
                      /**
                       * target device selected but is not a member of new targetDevices list
                       */
                      (targetDeviceId && !targetDevices.find(o => o.id === targetDeviceId)) ||
                      /**
                       * removed all from Source devices
                       */
                      isEmpty(newSourceValues)
                    ) {
                      setTargetDevice(null)
                    }

                    setSourceDevicesIds(newSourceValues)
                    setSiteToMergeDevices(newSourceSiteId)
                    setDeviceTypeToMerge(newDeviceTypeToMergeId)
                  }}
                  options={
                    deviceList?.filter(
                      o =>
                        o.id !== targetDeviceId &&
                        (!siteToMergeDevices || o.siteId === siteToMergeDevices) &&
                        (!deviceTypeToMerge || o.deviceTypeId === deviceTypeToMerge)
                    ) || []
                  }
                  getOptionLabel={option => option.name}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                  renderInput={params => (
                    <TextField
                      {...params}
                      variant="standard"
                      label={formatMessage(messages.sourceDevices)}
                      placeholder={formatMessage(messages.sourceDevices)}
                    />
                  )}
                />

                <Autocomplete
                  onChange={(_, value) => {
                    setTargetDevice(value || null)
                  }}
                  options={getAvailableTargetDevices(
                    deviceList,
                    sourceDevicesIds,
                    siteToMergeDevices,
                    deviceTypeToMerge
                  )}
                  disabled={isEmpty(sourceDevicesIds)}
                  getOptionLabel={option => option.name}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                  renderInput={params => (
                    <TextField
                      {...params}
                      variant="standard"
                      label={formatMessage(messages.targetDevice)}
                      placeholder={formatMessage(messages.targetDevice)}
                    />
                  )}
                  value={targetDevice}
                />
              </DialogContent>
              <DialogActions>
                <AspectButton
                  onClick={() => {
                    clearMergeDialog()
                    setMergeDeviceModalOpen(false)
                  }}
                >
                  {formatMessage(messages.button_Cancel)}
                </AspectButton>
                <AspectButton
                  disabled={!(sourceDevicesIds.length > 0 && targetDeviceId)}
                  onClick={() => {
                    setConfirmationVisible(true)
                  }}
                >
                  {formatMessage(messages.button_Merge)}
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
                      dangerouslySetInnerHTML={{ __html: formatMessage(messages.mergeDevicesConfirmationDescription) }}
                    />
                  }
                </Typography>
              </DialogTitle>
              <DialogContent>{formatMessage(messages.confirmToProceed)}</DialogContent>
              <DialogActions>
                <AspectButton
                  onClick={() => {
                    setMergeDeviceModalOpen(false)
                    setConfirmationVisible(false)
                  }}
                >
                  {formatMessage(messages.button_Cancel)}
                </AspectButton>
                <AspectButton
                  onClick={() => {
                    mergeDevices(
                      { sourceDevicesIds, targetDeviceId },
                      {
                        onSuccess: () => {
                          refetch()
                          setProcessingMergeDevices(false)
                          toast.success(formatMessage(messages.devicesMergedSuccessfully))
                        },
                        onError: error => {
                          setProcessingMergeDevices(false)
                          toast.error(getMergeDevicesErrorMessage(error))
                        },
                      }
                    )
                    clearMergeDialog()
                    setMergeDeviceModalOpen(false)
                    setProcessingMergeDevices(true)
                  }}
                >
                  {formatMessage(messages.buttonConfirmMerge)}
                </AspectButton>
              </DialogActions>
            </>
          )}
        </Dialog>
      </div>
    </>
  )
}

export default DeviceList
