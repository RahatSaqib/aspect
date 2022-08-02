import React from 'react'
import classnames from 'classnames/bind'

import MenuItem from '@material-ui/core/MenuItem'

import groupedOptions from './config'
import IconProvider from '../IconProvider'
import messages from './messages'
import styles from './Placeholders.css'

const cssClasses = classnames.bind(styles)

export const getMenuItems = ({ formatMessage }, onSelect) => {
  return [
    <div key="placeholders-header" className={cssClasses('menu-header')}>
      {formatMessage(messages.placeholdersInsertPlaceholderFor)}
    </div>,
    groupedOptions({ formatMessage }).map(({ label, options }) => (
      <div key={label}>
        <MenuItem classes={{ root: cssClasses('menu-section-header') }} dense disabled>
          {label}
        </MenuItem>
        {options.map(({ id, name }) => {
          const title = `Insert placeholder {{${id}}}`
          return (
            <MenuItem
              key={`${label}-${id}`}
              classes={{
                root: cssClasses('menu-item'),
              }}
              dense
              onClick={() => onSelect(id)}
              title={title}
            >
              <IconProvider icon="BsBraces" title={title} className={cssClasses('menu-item-icon')} />
              {name}
            </MenuItem>
          )
        })}
      </div>
    )),
  ]
}

export default groupedOptions
