import React, { useState, useEffect } from 'react'
import { LinearProgress, TableBody, Table } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, DeviceApiKeyFilter } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import PermissionChecker from '../../../components/PermissionChecker'
import AspectButton from '../../../components/shared/AspectButton'
import DataTableCard from '../../../components/shared/DataTableCard'
import DataTableHead from '../../../components/shared/tableHead'
import useDeviceApiKey from '../../../hooks/deviceApiKey/useDeviceApiKey'
import useDeviceApiKeyGenerate from '../../../hooks/deviceApiKey/useDeviceApiKeyGenerate'
import useDeviceApiKeyUpdate from '../../../hooks/deviceApiKey/useDeviceApiKeyUpdate'
import useExportDeviceApiKey from '../../../hooks/deviceApiKey/useExportDeviceApiKey'
import useFilterValues from '../../../hooks/useFilterValues'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import DeviceApiKeyGeneratorDialogForm from './DeviceApiKeyGeneratorDialogForm'
import styles from './DeviceApiKeyList.module.css'
import DeviceApiKeyTableRow from './DeviceApiKeyTableRow'
import messages from './messages'

const DEFAULT_GENERATOR_VALUES = { count: 1 }

const normalizeDeviceApiKeyFilters = filters => {
  const normalizedFilters = { ...filters }

  delete normalizedFilters.countryId

  if (!normalizedFilters.deviceApiKeyToken) return normalizedFilters

  return {
    ...normalizedFilters,
    deviceApiKeyToken: normalizedFilters.deviceApiKeyToken.replace(/-/g, ''),
  }
}

export const DeviceApiKeyList = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const normalizedFilters = normalizeDeviceApiKeyFilters(filters)
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'createdOn', sortDir: 'desc' })({
    location,
  })

  const { isLoading, data, refetch } = useDeviceApiKey(
    { sortCol, sortDir, page: pageAt, size: pageSize, ...normalizedFilters },
    { enabled: !!sortCol }
  )
  const { mutateAsync: generate } = useDeviceApiKeyGenerate()
  const { mutate: update } = useDeviceApiKeyUpdate()

  useExportDeviceApiKey({ filters: normalizedFilters, sortCol, sortDir, page: pageAt, pageSize, ...download })

  const [dialogState, onChangeDialogState] = useState({
    generatorValues: DEFAULT_GENERATOR_VALUES,
    isGeneratorDialogOpen: false,
  })

  useEffect(() => {
    if (download.enabled) setDownload({ enabled: false })
  }, [download])

  const onExportClick = formatType => setDownload({ fileFormat: formatType, enabled: true })

  const onOpenGeneratorDialog = () => onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: true })
  const onCloseGeneratorDialog = () => onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false })
  const onGeneratorFormChange = generatorValues => onChangeDialogState({ ...dialogState, generatorValues })
  const onGenerate = generatorValues => {
    return generate(generatorValues, {
      onSuccess: () => {
        onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false, generatorValues: DEFAULT_GENERATOR_VALUES })
        refetch()
      },
    })
  }
  const onRevokedChange = e => {
    const {
      dataset: { deviceApiKeyId },
      checked,
    } = e.target
    const revokeValues = { deviceApiKeyId, data: { revoked: checked } }
    update(revokeValues)
  }

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.title)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton onClick={onOpenGeneratorDialog} type="button" color="primary" variant="contained" browseButton>
            {intl.formatMessage(messages.generate)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.title)} />
        <DeviceApiKeyFilter />
        <div>
          <DeviceApiKeyGeneratorDialogForm
            isDialogOpen={dialogState.isGeneratorDialogOpen}
            onChange={onGeneratorFormChange}
            onCancel={onCloseGeneratorDialog}
            onSubmit={onGenerate}
            values={dialogState.generatorValues}
            intl={intl}
          />
        </div>
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExportClick}
              visible={(data?.data || []).length !== 0}
              reportName="DeviceApiKey"
            />
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : (data?.data || []).length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <Table className={styles.DeviceApiKeyDataTable}>
                <DataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={[
                    { key: 'createdOn', label: intl.formatMessage(messages.createdOn), sortable: true },
                    { key: 'token', label: intl.formatMessage(messages.token), sortable: true },
                    { key: 'partner', label: intl.formatMessage(messages.partner), sortable: true },
                    { key: 'country', label: intl.formatMessage(messages.country), sortable: true },
                    { key: 'site', label: intl.formatMessage(messages.siteDevicePairs), sortable: true },
                    { key: 'revoked', label: intl.formatMessage(messages.revoked), sortable: true },
                  ]}
                />
                <TableBody>
                  {data.data.map(deviceApiKey => (
                    <DeviceApiKeyTableRow
                      key={deviceApiKey.id}
                      intl={intl}
                      deviceApiKey={deviceApiKey}
                      onRevokedChange={onRevokedChange}
                    />
                  ))}
                </TableBody>
              </Table>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                intl={intl}
                paginatorStatus={messages.paginatorStatus}
                total={data.total}
                pageAt={pageAt}
                pageSize={pageSize}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default DeviceApiKeyList
