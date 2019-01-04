import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import {
  compose,
  withProps,
  withState,
  withHandlers,
  lifecycle,
} from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import Button from '@material-ui/core/Button'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
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
import {
  DeviceApiKeyDataTable,
  DeviceApiKeyDataTableHead,
  DeviceApiKeyDataTableRow,
} from './DeviceApiKeyDataTable'

const cssClasses = classnames.bind(require('./DeviceApiKeyList.css'))

const messages = defineMessages({
  title: {
    id: 'pages.DeviceApiKeyList.title',
    defaultMessage: 'Device API Keys',
  },
  /* ---------------- Filter ----------------- */
  filterTemplate: {
    id: 'pages.DeviceApiKeyList.filterTemplate',
    defaultMessage: 'Viewing all device api keys<GEOGRAPHY><NAME>.',
  },
  filterTemplateOptional: {
    id: 'pages.DeviceApiKeyList.filterTemplateOptional',
    defaultMessage: 'Counting only <PARTNER_ID>.',
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
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  },
]
const DEFAULT_GENERATOR_VALUES = { count: 1 }
const DEFAULT_ASSIGNER_VALUES = { deviceApiKeyIds: [] }

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'id',
    'createdOn',
    'token',
    'partner',
    'country',
    'site',
    'device',
    'revoked',
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
      sortCol: 'createdOn',
      sortDir: 'desc',
    })
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
    onInitialLoad: ({
      location,
      fetchDeviceApiKeys,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchDeviceApiKeys(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onExportClick: ({
      location,
      exportDeviceApiKeys,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportDeviceApiKeys(
          filtersParams,
          formatType,
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
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
  }),
  withState('dialogState', 'onChangeDialogState', {
    generatorValues: DEFAULT_GENERATOR_VALUES,
    assignerValues: DEFAULT_ASSIGNER_VALUES,
    isGeneratorDialogOpen: false,
    isAssignerDialogOpen: false,
  }),
  withProps(({ items }) => ({
    selectableIds: items.currentIdList
      .filter(id => !items.byId.getIn([id, 'device']))
      .sort(),
  })),
  withHandlers({
    onOpenGeneratorDialog: ({ dialogState, onChangeDialogState }) => () =>
      onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: true }),
    onCloseGeneratorDialog: ({ dialogState, onChangeDialogState }) => () =>
      onChangeDialogState({ ...dialogState, isGeneratorDialogOpen: false }),
    onOpenAssignerDialog: ({ dialogState, onChangeDialogState }) => () =>
      onChangeDialogState({ ...dialogState, isAssignerDialogOpen: true }),
    onCloseAssignerDialog: ({ dialogState, onChangeDialogState }) => () =>
      onChangeDialogState({ ...dialogState, isAssignerDialogOpen: false }),
    onGeneratorFormChange: ({
      dialogState,
      onChangeDialogState,
    }) => generatorValues =>
      onChangeDialogState({ ...dialogState, generatorValues }),
    onGenerate: ({
      generateDeviceApiKeys,
      onInitialLoad,
      dialogState,
      onChangeDialogState,
    }) => generatorValues => {
      generateDeviceApiKeys(generatorValues).then(() => {
        onChangeDialogState({
          ...dialogState,
          isGeneratorDialogOpen: false,
          generatorValues: DEFAULT_GENERATOR_VALUES,
        })
        onInitialLoad()
      })
    },
    onAssignerFormChange: ({
      dialogState,
      onChangeDialogState,
    }) => assignerValues =>
      onChangeDialogState({ ...dialogState, assignerValues }),
    onAssign: ({
      assignDeviceApiKeys,
      onInitialLoad,
      dialogState,
      onChangeDialogState,
    }) => assignerValues => {
      assignDeviceApiKeys(assignerValues).then(() => {
        onChangeDialogState({
          ...dialogState,
          isAssignerDialogOpen: false,
          assignerValues: DEFAULT_ASSIGNER_VALUES,
        })
        onInitialLoad()
      })
    },
    onSelectAllChange: ({
      selectableIds,
      dialogState,
      onChangeDialogState,
    }) => isInputChecked => {
      const nextDeviceApiKeyIds = isInputChecked ? selectableIds.toJS() : []

      onChangeDialogState({
        ...dialogState,
        assignerValues: {
          ...dialogState.assignerValues,
          deviceApiKeyIds: nextDeviceApiKeyIds,
        },
      })
    },

    onSelectedChange: ({ dialogState, onChangeDialogState }) => (
      { target: { dataset: { deviceApiKeyId } } },
      isInputChecked
    ) => {
      const { assignerValues } = dialogState
      const nextDeviceApiKeyIds = isInputChecked
        ? [...assignerValues.deviceApiKeyIds, deviceApiKeyId]
        : assignerValues.deviceApiKeyIds.filter(id => id !== deviceApiKeyId)

      onChangeDialogState({
        ...dialogState,
        assignerValues: {
          ...dialogState.assignerValues,
          deviceApiKeyIds: nextDeviceApiKeyIds,
        },
      })
    },

    onRevokedChange: ({ updateSingleDeviceApiKey }) => (event, revoked) => {
      const { target: { dataset: { deviceApiKeyId } } } = event
      updateSingleDeviceApiKey(deviceApiKeyId, {
        revoked,
      })
    },
  })
)

export const DeviceApiKeyList = ({
  intl,
  history,
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
  dialogState: {
    generatorValues,
    assignerValues,
    isGeneratorDialogOpen,
    isAssignerDialogOpen,
  },
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
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
      onClickExport={onExportClick}
    />
    <div>
      <Button onClick={onOpenGeneratorDialog}>
        {intl.formatMessage(messages.generate)}
      </Button>
      <Button
        onClick={onOpenAssignerDialog}
        disabled={_.isEmpty(assignerValues.deviceApiKeyIds)}
      >
        {intl.formatMessage(messages.assign)}
      </Button>
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
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <DeviceApiKeyDataTable
          selectable={false}
          className={cssClasses('DeviceApiKeyDataTable')}
        >
          <DeviceApiKeyDataTableHead
            history={history}
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
                    checked={selectableIds.equals(
                      Immutable.List(assignerValues.deviceApiKeyIds).sort()
                    )}
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
                  checked={
                    assignerValues.deviceApiKeyIds.indexOf(
                      deviceApiKey.get('id')
                    ) !== -1
                  }
                  onSelectedChange={onSelectedChange}
                  onRevokedChange={onRevokedChange}
                />
              ))}
          </TableBody>
        </DeviceApiKeyDataTable>
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

export default enhance(DeviceApiKeyList)
