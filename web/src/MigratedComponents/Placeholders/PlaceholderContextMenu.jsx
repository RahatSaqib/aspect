import React from 'react'
import Menu from '@material-ui/core/Menu'
import PropTypes from 'prop-types'

import { getMenuItems } from './utils'
import useI18n from '../../Hooks/i18n/useI18n'

const PlaceholderContextMenu = ({ onClose, onSelect, open, position }) => {
  const intl = useI18n()

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position}
      sx={{ maxHeight: 300 }}
    >
      {getMenuItems(intl, onSelect)}
    </Menu>
  )
}

PlaceholderContextMenu.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  position: PropTypes.string.isRequired,
}

export default PlaceholderContextMenu
