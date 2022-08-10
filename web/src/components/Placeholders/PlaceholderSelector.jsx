import React, { useState } from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'

import useI18n from '../../hooks/i18n/useI18n'
import IconProvider from '../IconProvider'
import { getMenuItems } from './utils'
import messages from './messages'
import styles from './Placeholders.css'

const cssClasses = classnames.bind(styles)

const PlaceholderSelector = ({ onSelect, onClose }) => {
  const { formatMessage } = useI18n()
  const [anchorEl, setAnchorEl] = useState(null)

  const isOpen = Boolean(anchorEl)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => {
    onClose()
    setAnchorEl(null)
  }

  const onSelectPlaceholder = placeholderId => {
    handleClose()
    onSelect(placeholderId)
  }

  return (
    <div className={cssClasses('container')}>
      <IconButton
        aria-expanded={isOpen.toString()}
        aria-haspopup="true"
        onClick={handleClick}
        title={formatMessage(messages.placeholdersTriggerButtonLabel)}
        className={cssClasses('trigger_button')}
        size="small"
      >
        <IconProvider icon="BsBraces" title={formatMessage(messages.placeholdersTriggerButtonLabel)} />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 250,
          },
        }}
      >
        {getMenuItems({ formatMessage }, onSelectPlaceholder)}
      </Menu>
    </div>
  )
}

PlaceholderSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default PlaceholderSelector
