import React from 'react'
import PropTypes from 'prop-types'
import AspectDropDown from '../MigratedComponents/AspectDropDown'
import messages from './messages'

const config = {
  selectedValue: 'Consumable',
  endpoint: '/dashboard/inventory-item',
  state: 'data.inventoryConsumableSummaryList',
  component: AspectDropDown,
  identifier: 'consumableExternalId',
  data: null,
  sortByKeys: ['consumableName'],
  keyMapping: {
    idKey: 'consumableExternalId',
  },
  isClearable: false,
  defaultSelectedOption: {
    key: 'consumableExternalId',
    value: 'GxMtbRifCartridge',
  },
  messages,
}

const ConsumableDropdown = ({ action }) => (
  <AspectDropDown props={config} action={action} />
)

ConsumableDropdown.propTypes = {
  action: PropTypes.func.isRequired,
}

export default ConsumableDropdown
