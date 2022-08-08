import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import Divider from '@material-ui/core/Divider'
import classnames from 'classnames/bind'
import IconProvider from '../IconProvider'
import IconMenu from '../../components/shared/IconMenu'

import styles from './AspectVertMenu.css'

const cssClasses = classnames.bind(styles)

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
      className={cssClasses('menu-item')}
    >
      {icon && (
        <ListItemIcon className={cssClasses('menu-item-icon')} style={{ color }}>
          <IconProvider icon={icon} />
        </ListItemIcon>
      )}
      <ListItemText inset primary={text} />
    </MenuItem>
    {separator && <Divider className={cssClasses('divider')} />}
  </Fragment>
)

const AspectVertMenu = ({ actions, params }) =>
  actions ? (
    <IconMenu icon={<MoreVertIcon />} className={cssClasses('menu')}>
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
