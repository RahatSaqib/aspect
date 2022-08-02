import React from 'react'
import PropTypes from 'prop-types'
import AspectDropDown from '.'
import messages from '../../consumable/messages'

const config = {
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
  defaultSelectedOption: true,
  messages,
}

const ConsumableDropdown = ({ action }) => <AspectDropDown props={config} action={action} />

ConsumableDropdown.propTypes = {
  action: PropTypes.func.isRequired,
}

export default ConsumableDropdown
