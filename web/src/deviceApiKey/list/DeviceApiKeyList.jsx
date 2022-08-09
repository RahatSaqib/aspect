import flowRight from 'lodash/flowRight'
import intersectionWith from 'lodash/intersectionWith'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withState, withHandlers, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@mui/material/TableBody'

import { makeSortPageSelector, makeSearchParamsSanitizer, composeSanitizer } from '../../shared/selectors/searchParams'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import AspectCheckbox from '../../components/shared/AspectCheckbox'
import {
  exportDeviceApiKeys,
  generateDeviceApiKeys,
  assignDeviceApiKeys,
  updateSingleDeviceApiKey,
  fetchDeviceApiKeys,
} from '../DeviceApiKeyRedux'
import DeviceApiKeyGeneratorDialogForm from './DeviceApiKeyGeneratorDialogForm'
import DeviceApiKeyAssignerDialogForm from './DeviceApiKeyAssignerDialogForm'
import { DeviceApiKeyDataTable, DeviceApiKeyDataTableHead, DeviceApiKeyDataTableRow } from './DeviceApiKeyDataTable'
import ExportListButton from '../../globals/components/ExportListButton'
import AspectButton from '../../components/shared/AspectButton'

import styles from './DeviceApiKeyList.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  title: {
    id: 'pages.DeviceApiKeyList.title',
    defaultMessage: 'Device API Keys',
  },
  /* ---------------- Dialog ----------------- */
  generate: {
    id: 'pages.DeviceApiKeyList.generate',
    defaultMessage: 'Generate',
  },
  assign: {
    id: 'pages.DeviceApiKeyList.assign',
    defaultMessage: 'Assign',
  },
  /* ---------------- Table ----------------- */
  createdOn: {
    id: 'pages.DeviceApiKeyList.createdOn',
    defaultMessage: 'Created On',
  },
  token: {
    id: 'pages.DeviceApiKeyList.token',
    defaultMessage: 'Key',
  },
  partner: {
    id: 'pages.DeviceApiKeyList.partner',
    defaultMessage: 'Partner',
  },
  country: {
    id: 'pages.DeviceApiKeyList.country',
    defaultMessage: 'Country',
  },
  site: {
    id: 'pages.DeviceApiKeyList.site',
    defaultMessage: 'Site',
  },
  device: {
    id: 'pages.DeviceApiKeyList.device',
    defaultMessage: 'Device',
  },
  revoked: {
    id: 'pages.DeviceApiKeyList.revoked',
    defaultMessage: 'Revoked',
  },
  paginatorStatus: {
    id: 'pages.DeviceApiKeyList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# device API key}
      other {# device API keys}
    }`,
  },
})

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: false, requiredPermissions: [] },
  { partnerId: true, requiredPermissions: [] },
  { deviceName: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
]
const DEFAULT_GENERATOR_VALUES = { count: 1 }
const DEFAULT_ASSIGNER_VALUES = { deviceApiKeyIds: [] }

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['id', 'createdOn', 'token', 'partner', 'country', 'site', 'device', 'revoked'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const enhance = compose(
  injectIntl,
  withProps(
    makeSortPageSelector({
      sortCol: 'createdOn',
      sortDir: 'desc',
    }),
    ({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      return {
        filters: getFilters(filtersParams),
      }
    }
  ),
  connect(
    state => ({
      items: state.deviceApiKey.items,
      table: state.deviceApiKey.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchDeviceApiKeys,
      exportDeviceApiKeys,
      generateDeviceApiKeys,
      assignDeviceApiKeys,
      updateSingleDeviceApiKey,
    })
  ),
  withHandlers({
    onInitialLoad:
      ({ location, fetchDeviceApiKeys, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          fetchDeviceApiKeys(filtersParams, sortCol, sortDir, pageAt, pageSize)
        }
      },

    onExportClick:
      ({ location, exportDeviceApiKeys, sortCol, sortDir, table, pageAt }) =>
      formatType => {
        const format = formatType.id
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          exportDeviceApiKeys(
            filtersParams,
            format,
            sortCol,
            sortDir,
            pageAt,
            table.get('total') > 0 ? table.get('total') : 1,
            'deviceApiKey'
          )
        }
      },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
      const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, this.props.userPermissions)
      this.setState({
        reducedFilters,
      })
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  }),
  withState('dialogState', 'onChangeDialogState', {
    generatorValues: DEFAULT_GENERATOR_VALUES,
    assignerValues: DEFAULT_ASSIGNER_VALUES,
    isGeneratorDialogOpen: false,
    isAssignerDialogOpen: false,
  }),
  withProps(({ items }) => ({
    selectableIds: items.currentIdList.filter(id => !items.byId.getIn([id, 'device'])).sort(),
  })),
  withHandlers({
    onOpenGeneratorDialog:
      ({ dialogState, onChangeDialogState }) =>
      () =>
        onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: true }),
    onCloseGeneratorDialog:
      ({ dialogState, onChangeDialogState }) =>
      () =>
        onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false }),
    onOpenAssignerDialog:
      ({ dialogState, onChangeDialogState }) =>
      () =>
        onChangeDialogState({ ...dialogState, isAssignerDialogOpen: true }),
    onCloseAssignerDialog:
      ({ dialogState, onChangeDialogState }) =>
      () =>
        onChangeDialogState({ ...dialogState, isAssignerDialogOpen: false }),
    onGeneratorFormChange:
      ({ dialogState, onChangeDialogState }) =>
      generatorValues =>
        onChangeDialogState({ ...dialogState, generatorValues }),
    onGenerate:
      ({ generateDeviceApiKeys, onInitialLoad, dialogState, onChangeDialogState }) =>
      generatorValues => {
        generateDeviceApiKeys(generatorValues).then(() => {
          onChangeDialogState({
            ...dialogState,
            isGeneratorDialogOpen: false,
            generatorValues: DEFAULT_GENERATOR_VALUES,
          })
          onInitialLoad()
        })
      },
    onAssignerFormChange:
      ({ dialogState, onChangeDialogState }) =>
      assignerValues =>
        onChangeDialogState({ ...dialogState, assignerValues }),
    onAssign:
      ({ assignDeviceApiKeys, onInitialLoad, dialogState, onChangeDialogState }) =>
      assignerValues => {
        assignDeviceApiKeys(assignerValues).then(() => {
          onChangeDialogState({
            ...dialogState,
            isAssignerDialogOpen: false,
            assignerValues: DEFAULT_ASSIGNER_VALUES,
          })
          onInitialLoad()
        })
      },
    onSelectAllChange:
      ({ selectableIds, dialogState, onChangeDialogState }) =>
      isInputChecked => {
        const nextDeviceApiKeyIds = isInputChecked ? selectableIds.toJS() : []
        onChangeDialogState({
          ...dialogState,
          assignerValues: {
            ...dialogState.assignerValues,
            deviceApiKeyIds: nextDeviceApiKeyIds,
          },
        })
      },

    onSelectedChange:
      ({ dialogState, onChangeDialogState, items }) =>
      (
        {
          target: {
            dataset: { deviceApiKeyId },
          },
        },
        isInputChecked
      ) => {
        const { assignerValues } = dialogState
        const nextDeviceApiKeyIds = isInputChecked
          ? [...assignerValues.deviceApiKeyIds, deviceApiKeyId]
          : assignerValues.deviceApiKeyIds.filter(id => id !== deviceApiKeyId)
        let selectedDDL = {}
        if (nextDeviceApiKeyIds.length === 1) {
          const [firstElementId] = nextDeviceApiKeyIds
          const { siteId, countryId, partnerId } = items.byId.get(firstElementId).toJS()
          selectedDDL = {
            siteId,
            countryId,
            partnerId,
          }
        } else if (nextDeviceApiKeyIds.length > 1) {
          const selection = []
          nextDeviceApiKeyIds.forEach(id => {
            const { partnerId, siteId, countryId } = items.byId.get(id).toJS()
            selection.push({ partnerId, siteId, countryId })
          })
          const [{ countryId, siteId, partnerId }] = intersectionWith(selection, isEqual)
          selectedDDL = { countryId, siteId, partnerId }
        }
        onChangeDialogState({
          ...dialogState,
          assignerValues: {
            deviceApiKeyIds: nextDeviceApiKeyIds,
            ...selectedDDL,
          },
        })
      },

    onRevokedChange:
      ({ updateSingleDeviceApiKey }) =>
      event => {
        const {
          target: {
            dataset: { deviceApiKeyId },
          },
        } = event
        updateSingleDeviceApiKey(deviceApiKeyId, {
          revoked: event.target.checked,
        })
      },
  })
)

export const DeviceApiKeyList = ({
  intl,
  navigate,
  location,
  table,
  items,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onExportClick,
  selectableIds,
  dialogState: { generatorValues, assignerValues, isGeneratorDialogOpen, isAssignerDialogOpen },
  onOpenGeneratorDialog,
  onCloseGeneratorDialog,
  onOpenAssignerDialog,
  onCloseAssignerDialog,
  onGeneratorFormChange,
  onGenerate,
  onAssignerFormChange,
  onAssign,
  onSelectAllChange,
  onSelectedChange,
  onRevokedChange,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <NavTitle title={intl.formatMessage(messages.title)} />
    <BrowseFilters
      navigate={navigate}
      location={location}
      intl={intl}
      config={reducedFilters}
      onClickExport={onExportClick}
    >
      <AspectButton onClick={onOpenGeneratorDialog} type="button" color="primary" variant="contained" browseButton>
        {intl.formatMessage(messages.generate)}
      </AspectButton>
      <AspectButton
        type="button"
        color="primary"
        variant="contained"
        onClick={onOpenAssignerDialog}
        disabled={isEmpty(assignerValues.deviceApiKeyIds)}
        browseButton
      >
        {intl.formatMessage(messages.assign)}
      </AspectButton>
    </BrowseFilters>
    <div>
      <DeviceApiKeyGeneratorDialogForm
        isDialogOpen={isGeneratorDialogOpen}
        onChange={onGeneratorFormChange}
        onCancel={onCloseGeneratorDialog}
        onSubmit={onGenerate}
        values={generatorValues}
        intl={intl}
      />
      <DeviceApiKeyAssignerDialogForm
        count={assignerValues.deviceApiKeyIds.length}
        isDialogOpen={isAssignerDialogOpen}
        onChange={onAssignerFormChange}
        onCancel={onCloseAssignerDialog}
        onSubmit={onAssign}
        values={assignerValues}
        intl={intl}
      />
    </div>
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      <ExportListButton
        onExcelClick={onExportClick}
        onCsvClick={onExportClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="DeviceApiKey"
      />
      {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
      {!items.currentIdList.isEmpty() && (
        <DeviceApiKeyDataTable className={cssClasses('DeviceApiKeyDataTable')}>
          <DeviceApiKeyDataTableHead
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
                    disabled={selectableIds.isEmpty()}
                    checked={selectableIds.equals(Immutable.List(assignerValues.deviceApiKeyIds).sort())}
                    onChange={onSelectAllChange}
                  />
                ),
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.createdOn),
                sortable: true,
              },
              {
                key: 'token',
                label: intl.formatMessage(messages.token),
                sortable: true,
              },
              {
                key: 'partner',
                label: intl.formatMessage(messages.partner),
                sortable: true,
              },
              {
                key: 'country',
                label: intl.formatMessage(messages.country),
                sortable: true,
              },
              {
                key: 'site',
                label: intl.formatMessage(messages.site),
                sortable: true,
              },
              {
                key: 'device',
                label: intl.formatMessage(messages.device),
                sortable: true,
              },
              {
                key: 'revoked',
                label: intl.formatMessage(messages.revoked),
                sortable: true,
              },
            ]}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(deviceApiKey => (
                <DeviceApiKeyDataTableRow
                  key={deviceApiKey.get('id')}
                  intl={intl}
                  deviceApiKey={deviceApiKey}
                  disabled={!selectableIds.includes(deviceApiKey.get('id'))}
                  checked={assignerValues.deviceApiKeyIds.indexOf(deviceApiKey.get('id')) !== -1}
                  onSelectedChange={onSelectedChange}
                  onRevokedChange={onRevokedChange}
                />
              ))}
          </TableBody>
        </DeviceApiKeyDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          navigate={navigate}
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

export default enhance(DeviceApiKeyList)
