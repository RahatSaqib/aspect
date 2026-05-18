import React, { useState, useEffect } from 'react'
import { TableBody, Table } from '@mui/material'
import intersectionWith from 'lodash/intersectionWith'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, DeviceApiKeyFilter } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import PermissionChecker from '../../../components/PermissionChecker'
import useDeviceApiKey from '../../../hooks/deviceApiKey/useDeviceApiKey'
import useDeviceApiKeyAssign from '../../../hooks/deviceApiKey/useDeviceApiKeyAssign'
import useDeviceApiKeyGenerate from '../../../hooks/deviceApiKey/useDeviceApiKeyGenerate'
import useDeviceApiKeyUpdate from '../../../hooks/deviceApiKey/useDeviceApiKeyUpdate'
import useExportDeviceApiKey from '../../../hooks/deviceApiKey/useExportDeviceApiKey'
import useFilterValues from '../../../hooks/useFilterValues'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import AspectCheckbox from '../../../oldComponents/shared/AspectCheckbox'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import DeviceApiKeyAssignerDialogForm from './DeviceApiKeyAssignerDialogForm'
import DeviceApiKeyGeneratorDialogForm from './DeviceApiKeyGeneratorDialogForm'
import styles from './DeviceApiKeyList.module.css'
import DeviceApiKeyTableRow from './DeviceApiKeyTableRow'
import messages from './messages'

const DEFAULT_GENERATOR_VALUES = { count: 1 }
const DEFAULT_ASSIGNER_VALUES = { deviceApiKeyIds: [] }

export const DeviceApiKeyList = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'createdOn', sortDir: 'desc' })({
    location,
  })

  const { isLoading, data, refetch } = useDeviceApiKey(
    { sortCol, sortDir, page: pageAt, size: pageSize, ...filters },
    { enabled: !!sortCol }
  )
  const { mutateAsync: generate } = useDeviceApiKeyGenerate()
  const { mutateAsync: assign } = useDeviceApiKeyAssign()
  const { mutate: update } = useDeviceApiKeyUpdate()

  useExportDeviceApiKey({ filters, sortCol, sortDir, page: pageAt, pageSize, ...download })

  const [dialogState, onChangeDialogState] = useState({
    generatorValues: DEFAULT_GENERATOR_VALUES,
    assignerValues: DEFAULT_ASSIGNER_VALUES,
    isGeneratorDialogOpen: false,
    isAssignerDialogOpen: false,
  })

  useEffect(() => {
    if (download.enabled) setDownload({ enabled: false })
  }, [download])

  const onExportClick = formatType => setDownload({ fileFormat: formatType, enabled: true })

  const selectableIds = (data?.data || []).map(d => d.id).sort()

  const onOpenGeneratorDialog = () => onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: true })
  const onCloseGeneratorDialog = () => onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false })
  const onOpenAssignerDialog = () => onChangeDialogState({ ...dialogState, isAssignerDialogOpen: true })
  const onCloseAssignerDialog = () => onChangeDialogState({ ...dialogState, isAssignerDialogOpen: false })
  const onGeneratorFormChange = generatorValues => onChangeDialogState({ ...dialogState, generatorValues })
  const onGenerate = generatorValues => {
    return generate(generatorValues, {
      onSuccess: () => {
        onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false, generatorValues: DEFAULT_GENERATOR_VALUES })
        refetch()
      },
    })
  }
  const onAssign = assignerValues => {
    return assign(assignerValues, {
      onSuccess: () => {
        onChangeDialogState({ ...dialogState, isAssignerDialogOpen: false, assignerValues: DEFAULT_ASSIGNER_VALUES })
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
  const onAssignerFormChange = assignerValues => onChangeDialogState({ ...dialogState, assignerValues })
  const onSelectAllChange = isInputChecked => {
    const nextDeviceApiKeyIds = isInputChecked ? selectableIds : []
    onChangeDialogState({
      ...dialogState,
      assignerValues: { ...dialogState.assignerValues, deviceApiKeyIds: nextDeviceApiKeyIds },
    })
  }
  const onSelectedChange = (e, isInputChecked) => {
    const { assignerValues } = dialogState
    const nextDeviceApiKeyIds = isInputChecked
      ? [...assignerValues.deviceApiKeyIds, e.target.dataset.deviceApiKeyId]
      : assignerValues.deviceApiKeyIds.filter(id => id !== e.target.dataset.deviceApiKeyId)
    let selectedDDL = {}
    if (nextDeviceApiKeyIds.length === 1) {
      const [firstElementId] = nextDeviceApiKeyIds
      selectedDDL = (data?.data || []).find(d => d.id.toString() === firstElementId)
    } else if (nextDeviceApiKeyIds.length > 1) {
      const selection = []
      nextDeviceApiKeyIds.forEach(id => {
        const { partnerId, siteId, countryId } = (data?.data || []).find(d => d.id.toString() === id)
        selection.push({ partnerId, siteId, countryId })
      })
      const [{ countryId, siteId, partnerId }] = intersectionWith(selection, isEqual)
      selectedDDL = { countryId, siteId, partnerId }
    }
    onChangeDialogState({ ...dialogState, assignerValues: { deviceApiKeyIds: nextDeviceApiKeyIds, ...selectedDDL } })
  }

  return isLoading ? null : (
    <>
      <DetailHeader name={intl.formatMessage(messages.title)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton onClick={onOpenGeneratorDialog} type="button" color="primary" variant="contained" browseButton>
            {intl.formatMessage(messages.generate)}
          </AspectButton>
        </PermissionChecker>
        <AspectButton
          type="button"
          color="primary"
          variant="contained"
          onClick={onOpenAssignerDialog}
          disabled={isEmpty(dialogState.assignerValues.deviceApiKeyIds)}
          browseButton
        >
          {intl.formatMessage(messages.assign)}
        </AspectButton>
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
          <DeviceApiKeyAssignerDialogForm
            count={dialogState.assignerValues.deviceApiKeyIds.length}
            isDialogOpen={dialogState.isAssignerDialogOpen}
            onChange={onAssignerFormChange}
            onCancel={onCloseAssignerDialog}
            onSubmit={onAssign}
            values={dialogState.assignerValues}
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
          {(data?.data || []).length === 0 ? (
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
                    {
                      key: 'id',
                      label: (
                        <AspectCheckbox
                          name="selectAll"
                          disabled={selectableIds.length === 0}
                          checked={selectableIds.length === dialogState.assignerValues.deviceApiKeyIds.length}
                          onChange={onSelectAllChange}
                        />
                      ),
                    },
                    { key: 'createdOn', label: intl.formatMessage(messages.createdOn), sortable: true },
                    { key: 'token', label: intl.formatMessage(messages.token), sortable: true },
                    { key: 'partner', label: intl.formatMessage(messages.partner), sortable: true },
                    { key: 'country', label: intl.formatMessage(messages.country), sortable: true },
                    { key: 'site', label: intl.formatMessage(messages.site), sortable: true },
                    { key: 'device', label: intl.formatMessage(messages.device), sortable: true },
                    { key: 'revoked', label: intl.formatMessage(messages.revoked), sortable: true },
                  ]}
                />
                <TableBody>
                  {data.data.map(deviceApiKey => (
                    <DeviceApiKeyTableRow
                      key={deviceApiKey.id}
                      intl={intl}
                      deviceApiKey={deviceApiKey}
                      disabled={!selectableIds.includes(deviceApiKey.id)}
                      checked={dialogState.assignerValues.deviceApiKeyIds.indexOf(deviceApiKey.id.toString()) !== -1}
                      onSelectedChange={onSelectedChange}
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
