import React, { Fragment } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import IconMenu from '../../components/shared/IconMenu'
import IconProvider from '../IconProvider'
import styles from './AspectVertMenu.module.css'

const AspectVertMenuItem = ({ icon, color, disabled = false, text, action, params, separator = false, onClick }) => (
  <Fragment>
    <MenuItem
      style={{ color }}
      disabled={disabled}
      onClick={() => {
        if (onClick) {
          // when passing-in props have onClick - run it
          onClick({
            innerHandler: () => {
              action(params)
            },
          })
        } else {
          action(params)
        }
      }}
      className={styles.menu_item}
    >
      {icon && (
        <ListItemIcon className={styles.menu_item_icon} style={{ color }}>
          <IconProvider icon={icon} />
        </ListItemIcon>
      )}
      <ListItemText inset primary={text} />
    </MenuItem>
    {separator && <Divider className={styles.divider} />}
  </Fragment>
)

const AspectVertMenu = ({ actions, params }) =>
  actions ? (
    <IconMenu icon={<MoreVertIcon />} className={styles.menu}>
      {actions.map(item => (
        <AspectVertMenuItem key={`${item.icon}-${item.text}`} {...item} params={params} />
      ))}
    </IconMenu>
  ) : null

AspectVertMenuItem.defaultProps = {
  icon: null,
  disabled: false,
  separator: false,
  params: null,
  onClick: null,
  color: null,
}

AspectVertMenuItem.propTypes = {
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  text: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  params: PropTypes.oneOfType([PropTypes.object]),
  separator: PropTypes.bool,
  color: PropTypes.string,
}

AspectVertMenu.defaultProps = {
  params: null,
}

AspectVertMenu.propTypes = {
  actions: PropTypes.arrayOf(AspectVertMenuItem).isRequired,
  params: PropTypes.oneOfType([PropTypes.object]),
}

export default AspectVertMenu
