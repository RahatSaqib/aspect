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
  pure,
} from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Checkbox } from 'react-toolbox/lib/checkbox'

import FlatButton from 'material-ui/FlatButton'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
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

const FILTERS_CONFIG = {
  geography: true,
  state: false,
  partnerId: true,
  deviceName: true,
  siteName: true,
}
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
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
  searchSanitizer
)

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      items: state.deviceApiKey.items,
      table: state.deviceApiKey.table,
    }),
    bindActionCreators.bind(null, {
      fetchDeviceApiKeys,
      exportDeviceApiKeys,
      generateDeviceApiKeys,
      assignDeviceApiKeys,
      updateSingleDeviceApiKey,
    })
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'createdOn',
      sortDir: 'desc',
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

    onHeadColumnClick: ({ history, location, sortCol, sortDir }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
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
      } = filtersSanitizer(searchParams.get('filters'))
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
      isInputChecked,
      { target: { dataset: { deviceApiKeyId } } }
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

    onRevokedChange: ({ updateSingleDeviceApiKey }) => (
      revoked,
      { target: { dataset: { deviceApiKeyId } } }
    ) => {
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
  onHeadColumnClick,
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
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <NavTitle title={intl.formatMessage(messages.title)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
      onClickExport={onExportClick}
    />
    <div>
      <FlatButton
        label={intl.formatMessage(messages.generate)}
        onTouchTap={onOpenGeneratorDialog}
      />
      <FlatButton
        label={intl.formatMessage(messages.assign)}
        onTouchTap={onOpenAssignerDialog}
        disabled={_.isEmpty(assignerValues.deviceApiKeyIds)}
      />
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
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <DeviceApiKeyDataTable
          selectable={false}
          className={cssClasses('DeviceApiKeyDataTable')}
        >
          <DeviceApiKeyDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'id',
                label: (
                  <Checkbox
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
                onClick: onHeadColumnClick,
              },
              {
                key: 'token',
                label: intl.formatMessage(messages.token),
                onClick: onHeadColumnClick,
              },
              {
                key: 'partner',
                label: intl.formatMessage(messages.partner),
                onClick: onHeadColumnClick,
              },
              {
                key: 'country',
                label: intl.formatMessage(messages.country),
                onClick: onHeadColumnClick,
              },
              {
                key: 'site',
                label: intl.formatMessage(messages.site),
                onClick: onHeadColumnClick,
              },
              {
                key: 'device',
                label: intl.formatMessage(messages.device),
                onClick: onHeadColumnClick,
              },
              {
                key: 'revoked',
                label: intl.formatMessage(messages.revoked),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(deviceApiKey =>
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
            )}
        </DeviceApiKeyDataTable>}
      {!items.currentIdList.isEmpty() &&
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />}
    </DataTableCard>
  </div>

export default enhance(DeviceApiKeyList)
