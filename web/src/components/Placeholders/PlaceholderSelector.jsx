import React, { useState } from 'react'
import { IconButton, Menu, MenuItem } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import usePlaceholder from '../../hooks/notification/usePlaceholder'
import useI18n from '../../hooks/useI18n'
import IconProvider from '../IconProvider'
import messages from './messages'
import styles from './Placeholders.css'

const cssClasses = classnames.bind(styles)

const PlaceholderSelector = ({ onSelect, onClose, filter }) => {
  const { formatMessage } = useI18n()
  const [anchorEl, setAnchorEl] = useState(null)
  const { isLoading, data } = usePlaceholder()

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

  const paperStyle = { style: { maxHeight: 300, width: 250 } }

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
      {!isLoading ? (
        <Menu
          id="long-menu"
          MenuListProps={{ 'aria-labelledby': 'long-button' }}
          anchorEl={anchorEl}
          open={isOpen}
          onClose={handleClose}
          PaperProps={paperStyle}
        >
          <div key="placeholders-header" className={cssClasses('menu-header')}>
            {formatMessage(messages.placeholdersInsertPlaceholderFor)}
          </div>
          {data
            .filter(item => (filter.type ? item.notificationTypeWhitelist.includes(filter.type) : item))
            .map(p => (
              <div key={p.labelI18nKey}>
                <MenuItem classes={{ root: cssClasses('menu-section-header') }} dense disabled>
                  {formatMessage(messages[p.labelI18nKey])}
                </MenuItem>
                {(p.labelI18nKey === 'placeholderCustomFields'
                  ? p.options.filter(o =>
                      filter.assay && !isEmpty(o.assayWhitelist) ? o.assayWhitelist.includes(filter.assay) : o
                    )
                  : p.options
                ).map(({ id, nameI18nKey, name }) => {
                  const title = `Insert placeholder {{${id}}}`
                  return (
                    <MenuItem
                      key={`${p.labelI18nKey}-${id}`}
                      classes={{ root: cssClasses('menu-item') }}
                      dense
                      onClick={() => onSelectPlaceholder(id)}
                      title={title}
                    >
                      <IconProvider icon="BsBraces" title={title} className={cssClasses('menu-item-icon')} />
                      {messages[nameI18nKey] ? formatMessage(messages[nameI18nKey]) : name}
                    </MenuItem>
                  )
                })}
              </div>
            ))}
        </Menu>
      ) : null}
    </div>
  )
}

export default PlaceholderSelector
