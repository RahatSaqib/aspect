// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { compose } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import FlatButton from 'material-ui/FlatButton'
import Checkbox from 'material-ui/Checkbox'

// Our own imports
import {
  exportDeviceApiKeys,
  generateDeviceApiKeys,
  assignDeviceApiKeys,
  updateSingleDeviceApiKey,
  fetchDeviceApiKeys
} from '../DeviceApiKeyRedux'
import { ListFilterContainer } from '../../filter/list/ListFilter'
import { ListFilter, configureListFilter } from '../../filter/FilterRedux'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import styles from './DeviceApiKeyList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DeviceApiKeyGeneratorDialogForm from './DeviceApiKeyGeneratorDialogForm'
import DeviceApiKeyAssignerDialogForm from './DeviceApiKeyAssignerDialogForm'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceApiKeyList.title',
    defaultMessage: 'Device API Keys'
  },
  /* ---------------- Filter ----------------- */
  filterTemplate: {
    id: 'pages.DeviceApiKeyList.filterTemplate',
    defaultMessage: 'Viewing all device api keys<GEOGRAPHY><NAME>.'
  },
  filterTemplateOptional: {
    id: 'pages.DeviceApiKeyList.filterTemplateOptional',
    defaultMessage: 'Counting only <PARTNER_ID>.'
  },
  /* ---------------- Dialog ----------------- */
  generate: {
    id: 'pages.DeviceApiKeyList.generate',
    defaultMessage: 'Generate'
  },
  assign: {
    id: 'pages.DeviceApiKeyList.assign',
    defaultMessage: 'Assign'
  },
  /* ---------------- Table ----------------- */
  createdOn: {
    id: 'pages.DeviceApiKeyList.createdOn',
    defaultMessage: 'Created On'
  },
  token: {
    id: 'pages.DeviceApiKeyList.token',
    defaultMessage: 'Key'
  },
  partner: {
    id: 'pages.DeviceApiKeyList.partner',
    defaultMessage: 'Partner'
  },
  country: {
    id: 'pages.DeviceApiKeyList.country',
    defaultMessage: 'Country'
  },
  site: {
    id: 'pages.DeviceApiKeyList.site',
    defaultMessage: 'Site'
  },
  device: {
    id: 'pages.DeviceApiKeyList.device',
    defaultMessage: 'Device'
  },
  revoked: {
    id: 'pages.DeviceApiKeyList.revoked',
    defaultMessage: 'Revoked'
  }
})

const DEFAULT_GENERATOR_VALUES = { count: 1 }
const DEFAULT_ASSIGNER_VALUES = { deviceApiKeyIds: [] }

export class DeviceApiKeyList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    intl: intlShape.isRequired,
    fetchDeviceApiKeys: PropTypes.func.isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    configureListFilter: PropTypes.func.isRequired,
    exportDeviceApiKeys: PropTypes.func.isRequired,
    generateDeviceApiKeys: PropTypes.func.isRequired,
    assignDeviceApiKeys: PropTypes.func.isRequired,
    updateSingleDeviceApiKey: PropTypes.func.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
  }

  state = {
    generatorValues: DEFAULT_GENERATOR_VALUES,
    assignerValues: DEFAULT_ASSIGNER_VALUES,
    isGeneratorDialogOpen: false,
    isAssignerDialogOpen: false
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl: { formatMessage } } = this.props
    setPageTitle(formatMessage(messages.title))
    configureListFilter({
      geography: true,
      state: false,
      partnerId: true,
      deviceName: true,
      siteName: true,
    })
  }

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  getSelectableIds() {
    const { items } = this.props
    return items.currentIdList
      .filter(id => this.itemSelectable(items.byId.get(id)))
      .toJS()
  }

  handleClickExport = (formatType) => {
    this.props.exportDeviceApiKeys(
      formatType,
      this.props.table.sortCol,
      this.props.table.sortDir,
      this.props.table.page,
      this.props.table.pageSize
    )
  }

  handleOpenGeneratorDialog = () => {
    this.setState({ isGeneratorDialogOpen: true })
  }

  handleCloseGeneratorDialog = () => {
    this.setState({ isGeneratorDialogOpen: false })
  }

  handleOpenAssignerDialog = () => {
    this.setState({ isAssignerDialogOpen: true })
  }

  handleCloseAssignerDialog = () => {
    this.setState({ isAssignerDialogOpen: false })
  }

  handleGeneratorFormChange = generatorValues => this.setState({ generatorValues })

  handleGenerate = (generatorValues) => {
    this.props.generateDeviceApiKeys(generatorValues)
      .then(() => {
        this.handleCloseGeneratorDialog()
        this.handleGeneratorFormChange(DEFAULT_GENERATOR_VALUES)
        this.handleFetch()
      })
  }

  handleAssigerFormChange = assignerValues => this.setState({ assignerValues })

  handleAssign = (assignerValues) => {
    this.props.assignDeviceApiKeys(assignerValues)
      .then(() => {
        this.handleCloseAssignerDialog()
        this.handleAssigerFormChange(DEFAULT_ASSIGNER_VALUES)
        this.handleFetch()
      })
  }

  handleFetch = (...args) => {
    this.props.fetchDeviceApiKeys(...args)
  }

  handleSelectAll = (event, isInputChecked) => {
    const selectableIds = this.getSelectableIds()
    const nextDeviceApiKeyIds = (
      isInputChecked ?
      selectableIds :
      []
    )
    this.setState({
      assignerValues: {
        ...this.state.assignerValues,
        deviceApiKeyIds: nextDeviceApiKeyIds
      }
    })
  }

  handleSelect = (event) => {
    const { assignerValues } = this.state
    const { deviceApiKeyId } = event.target.dataset
    const nextDeviceApiKeyIds = (
      assignerValues.deviceApiKeyIds.indexOf(deviceApiKeyId) !== -1 ?
      assignerValues.deviceApiKeyIds.filter(id => id !== deviceApiKeyId) :
      [...assignerValues.deviceApiKeyIds, deviceApiKeyId]
    )
    this.setState({
      assignerValues: {
        ...this.state.assignerValues,
        deviceApiKeyIds: nextDeviceApiKeyIds
      }
    })
  }

  handleRevoke = (event, revoked) => {
    const { deviceApiKeyId } = event.target.dataset

    this.props.updateSingleDeviceApiKey(deviceApiKeyId, {
      revoked
    })
  }

  itemSelectable = item => !item.get('device')

  render() {
    const { intl } = this.props
    const { assignerValues } = this.state
    const { formatMessage, formatDate } = intl
    const selectableIds = this.getSelectableIds()
    const columns = [
      { db: 'id',
        sortable: false,
        title: (
          <Checkbox
            name="selectAll"
            disabled={_.isEmpty(selectableIds)}
            checked={
              !_.isEmpty(assignerValues.deviceApiKeyIds) &&
              _.isEqual(selectableIds, assignerValues.deviceApiKeyIds)
            }
            onCheck={this.handleSelectAll}
          />
        ),
        extraProps: { style: { width: '5%' } },
        format: (data, row) =>
          <Checkbox
            name="selected"
            data-device-Api-Key-Id={row.get('id')}
            disabled={!this.itemSelectable(row)}
            checked={assignerValues.deviceApiKeyIds.indexOf(row.get('id')) !== -1}
            onCheck={this.handleSelect}
          /> },
      { db: 'createdOn',
        title: formatMessage(messages.createdOn),
        extraProps: { style: { width: '10%' } },
        format: data => formatDate(data) },
      { db: 'token',
        title: formatMessage(messages.token),
        extraProps: { style: { width: '25%' } } },
      { db: 'partner',
        title: formatMessage(messages.partner) },
      { db: 'country',
        title: formatMessage(messages.country) },
      { db: 'site',
        title: formatMessage(messages.site) },
      { db: 'device',
        title: formatMessage(messages.device) },
      { db: 'revoked',
        title: formatMessage(messages.revoked),
        format: (data, row) =>
          <Checkbox
            name="revoked"
            style={{ textAlign: 'center' }}
            data-device-Api-Key-Id={row.get('id')}
            checked={data > 0}
            onCheck={this.handleRevoke}
          /> },
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
          filterTemplateOptional={formatMessage(messages.filterTemplateOptional)}
          onClickExport={this.handleClickExport}
        />
        <div>
          <FlatButton
            label={formatMessage(messages.generate)}
            onTouchTap={this.handleOpenGeneratorDialog}
          />
          <FlatButton
            label={formatMessage(messages.assign)}
            onTouchTap={this.handleOpenAssignerDialog}
            disabled={_.isEmpty(assignerValues.deviceApiKeyIds)}
          />
          <DeviceApiKeyGeneratorDialogForm
            isDialogOpen={this.state.isGeneratorDialogOpen}
            onChange={this.handleGeneratorFormChange}
            onCancel={this.handleCloseGeneratorDialog}
            onSubmit={this.handleGenerate}
            values={this.state.generatorValues}
            intl={intl}
          />
          <DeviceApiKeyAssignerDialogForm
            count={assignerValues.deviceApiKeyIds.length}
            isDialogOpen={this.state.isAssignerDialogOpen}
            onChange={this.handleAssigerFormChange}
            onCancel={this.handleCloseAssignerDialog}
            onSubmit={this.handleAssign}
            values={assignerValues}
            intl={intl}
          />
        </div>
        <DataTableWithEmptyList
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.deviceApiKey.items,
    table: state.deviceApiKey.table,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchDeviceApiKeys,
    exportDeviceApiKeys,
    generateDeviceApiKeys,
    assignDeviceApiKeys,
    updateSingleDeviceApiKey,
    configureListFilter
  }, dispatch)
}

const enhance = compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)

export const DeviceApiKeyListContainer = enhance(DeviceApiKeyList)
