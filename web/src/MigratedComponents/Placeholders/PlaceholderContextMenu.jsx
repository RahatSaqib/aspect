import React from 'react'
import Menu from '@material-ui/core/Menu'

import { getMenuItems } from './config'
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

export default PlaceholderContextMenu
