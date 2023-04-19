import React, { useState, useEffect } from 'react'
import { TableBody, Table } from '@mui/material'
import classnames from 'classnames/bind'
import intersectionWith from 'lodash/intersectionWith'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import DeviceApiKeyFilter from '../../../cleanComponents/Filter/DeviceApiKeyFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import useDeviceApiKey from '../../../hooks/deviceApiKey/useDeviceApiKey'
import useDeviceApiKeyAssign from '../../../hooks/deviceApiKey/useDeviceApiKeyAssign'
import useDeviceApiKeyGenerate from '../../../hooks/deviceApiKey/useDeviceApiKeyGenerate'
import useDeviceApiKeyUpdate from '../../../hooks/deviceApiKey/useDeviceApiKeyUpdate'
import useExportDeviceApiKey from '../../../hooks/deviceApiKey/useExportDeviceApiKey'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import AspectCheckbox from '../../../oldComponents/shared/AspectCheckbox'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import DeviceApiKeyAssignerDialogForm from './DeviceApiKeyAssignerDialogForm'
import DeviceApiKeyGeneratorDialogForm from './DeviceApiKeyGeneratorDialogForm'
import styles from './DeviceApiKeyList.css'
import DeviceApiKeyTableRow from './DeviceApiKeyTableRow'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const DEFAULT_GENERATOR_VALUES = { count: 1 }
const DEFAULT_ASSIGNER_VALUES = { deviceApiKeyIds: [] }

export const DeviceApiKeyList = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const { mutation: generate } = useDeviceApiKeyGenerate()
  const { mutate: assign } = useDeviceApiKeyAssign()
  const { mutate: update } = useDeviceApiKeyUpdate()

  useExportDeviceApiKey({ filters, sortCol, sortDir, page: pageAt, pageSize, ...download })

  const [dialogState, onChangeDialogState] = useState({
    generatorValues: DEFAULT_GENERATOR_VALUES,
    assignerValues: DEFAULT_ASSIGNER_VALUES,
    isGeneratorDialogOpen: false,
    isAssignerDialogOpen: false,
  })
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'createdOn', sortDir: 'desc' })({
    location,
  })

  const { isLoading, data } = useDeviceApiKey(
    { sortCol, sortDir, page: pageAt, size: pageSize, ...filters },
    { enabled: !!sortCol }
  )

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
    generate(generatorValues, {
      onSuccess: () => {
        onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false, generatorValues: DEFAULT_GENERATOR_VALUES })
      },
    })
  }
  const onAssign = assignerValues => {
    assign(assignerValues, {
      onSuccess: () => {
        onChangeDialogState({ ...dialogState, isAssignerDialogOpen: false, assignerValues: DEFAULT_ASSIGNER_VALUES })
      },
    })
  }
  const onRevokedChange = e => update(e.target.dataset.deviceApiKeyId, { revoked: e.target.checked })
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
      const { siteId, countryId, partnerId } = (data?.data || []).find(d => d.id === firstElementId)
      selectedDDL = { siteId, countryId, partnerId }
    } else if (nextDeviceApiKeyIds.length > 1) {
      const selection = []
      nextDeviceApiKeyIds.forEach(id => {
        const { partnerId, siteId, countryId } = (data?.data || []).find(d => d.id === id)
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
        <AspectButton onClick={onOpenGeneratorDialog} type="button" color="primary" variant="contained" browseButton>
          {intl.formatMessage(messages.generate)}
        </AspectButton>
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
      <div className={cssClasses('Container')}>
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
        <DataTableCard key={`DataTableCard--table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExportClick}
              visible={(data?.data || []).length !== 0}
              reportName="DeviceApiKey"
            />
          </div>
          {(data?.data || []).length === 0 ? (
            <BrowseEmptyList navigate={navigate} location={location} />
          ) : (
            <>
              <Table className={cssClasses('DeviceApiKeyDataTable')}>
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
                  {(data?.data || []).map(deviceApiKey => (
                    <DeviceApiKeyTableRow
                      key={deviceApiKey.id}
                      intl={intl}
                      deviceApiKey={deviceApiKey}
                      disabled={!selectableIds.includes(deviceApiKey.id)}
                      checked={dialogState.assignerValues.deviceApiKeyIds.indexOf(deviceApiKey.id) !== -1}
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
