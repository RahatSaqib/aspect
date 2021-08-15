import React from 'react'
import classnames from 'classnames/bind'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'

import useI18n from '../../Hooks/i18n/useI18n'
import IconProvider from '../IconProvider'
import { getMenuItems } from './config'
import messages from './messages'
import styles from './Placeholders.css'

const cssClasses = classnames.bind(styles)

const PlaceholderSelector = ({ onSelect, onClose }) => {
  const { formatMessage } = useI18n()
  const [anchorEl, setAnchorEl] = React.useState(null)

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
        aria-expanded={isOpen ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        title={formatMessage(messages.placeholdersTriggerButtonLabel)}
        className={cssClasses('trigger_button')}
        size="small"
      >
        <IconProvider
          icon="BsBraces"
          title={formatMessage(messages.placeholdersTriggerButtonLabel)}
        />
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

export default PlaceholderSelector
