// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

// Our own imports
import { GroupedDataTable } from '../../components/shared/GroupedDataTable'
import { fetchInventoryItems } from '../InventoryRedux'
import styles from './InventoryItemsList.css'
import { fetchConsumables } from '../../consumable/ConsumableRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

const messages = defineMessages({
  title: {
    id: 'pages.InventoryItemsList.title',
    defaultMessage: 'Inventory on Hand'
  },
  siteName: {
    id: 'pages.InventoryItemsList.siteName',
    defaultMessage: 'Site Name'
  },
  consumableName: {
    id: 'pages.InventoryItemsList.consumableName',
    defaultMessage: 'Consumable'
  },
  quantityOnHand: {
    id: 'pages.InventoryItemsList.quantityOnHand',
    defaultMessage: 'Quantity on Hand'
  },
  expiresOn: {
    id: 'pages.InventoryItemsList.expiresOn',
    defaultMessage: 'Expires On'
  }
})

export class InventoryItemsList extends PureComponent {

  static propTypes = {
    fetchConsumables: PropTypes.func.isRequired,
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    items: PropTypes.object,
    intl: PropTypes.object.isRequired,
    fetchInventoryItems: PropTypes.func.isRequired,
    consumables: PropTypes.object
  }

  state = {
    filters: this.props.table.get('filters')
  }

  componentWillMount() {
    const { setPageTitle, intl: { formatMessage } } = this.props
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    const { fetchConsumables, consumables } = this.props
    fetchConsumables(false, consumables)
  }

  handleFetch = (...args) => {
    this.props.fetchInventoryItems(this.props.table.filters, ...args)
  }

  filterInventoryItemsChange = (key, value, callback) => {
    this.setState({ filters: this.state.filters.set(key, value) }, callback)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Add group by site & consumable
    this.props.fetchInventoryItems(
      this.state.filters, undefined, undefined, undefined, undefined)
  }

  handleConsumableChange = (event, index, value) => {
    this.setState({ filters: this.state.filters.set('consumableId', value) },
      () => this.handleSubmit(event))
  }

  resetInventoryItems = () => {
    this.setState({ filters: this.state.filters.set('siteName', '').set('consumableId', '') })
    this.props.fetchInventoryItems()
  }

  render() {
    const { intl, consumables } = this.props
    const { formatMessage, formatDate } = intl

    const consumablesLoading = consumables ? consumables.get('loading') : false

    const columns = [{
      fieldName: 'siteName',
      headerText: formatMessage(messages.siteName),
      groupChildren: {
        fieldName: 'inventoryItems',
        columns: [{
          fieldName: 'consumableName',
          headerText: formatMessage(messages.consumableName)
        }, {
          fieldName: 'quantityOnHand',
          headerText: formatMessage(messages.quantityOnHand)
        }, {
          fieldName: 'expiresOn',
          headerText: formatMessage(messages.expiresOn),
          format: data => formatDate(data, { format: 'user-timezone' })
        }]
      }
    }]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={this.handleSubmit}>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild>
              <TextField
                value={this.state.filters.get('siteName')}
                id="siteName"
                onChange={(event, value) => this.filterInventoryItemsChange('siteName', value)}
                className={styles['Toolbar__TextField--filter']}
                hintText="Filter by Location"
              />
              <ForkedSelectField
                name="consumableId"
                style={{ margin: '5px 0 0 15px' }}
                value={this.state.filters.get('consumableId')}
                label={formatMessage(messages.consumableName)}
                hintText={formatMessage(messages.consumableName)}
                disabled={consumablesLoading || _.isEmpty(consumables)}
                onChange={(e, i, v) => { this.handleConsumableChange(e, i, v) }}
              >
                {
                  consumables.get('items') &&
                  consumables.get('items').map(consumable =>
                    <MenuItem key={consumable.get('id')} value={consumable.get('id')} primaryText={consumable.get('name')} />)
                }
              </ForkedSelectField>
              <RaisedButton label="Filter" primary onTouchTap={this.handleSubmit} />
            </ToolbarGroup>
            <ToolbarGroup lastChild>
              <IconMenu
                iconButtonElement={
                  <IconButton touch>
                    <NavigationExpandMoreIcon />
                  </IconButton>
                }
              >
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={this.resetInventoryItems} />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>
        <GroupedDataTable
          selectable
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
          messages={messages}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.inventory.items,
    table: state.inventory.table,
    consumables: state.consumable
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchInventoryItems, fetchConsumables }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
