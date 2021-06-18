import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import Immutable from 'immutable'
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

const AspectVertMenuItem = ({
  icon,
  disabled = false,
  text,
  action,
  params,
  separator = false,
}) => (
  <Fragment>
    <MenuItem
      disabled={disabled}
      onClick={() => {
        action(params)
      }}
      className={cssClasses('menu-item')}
    >
      {icon && (
        <ListItemIcon>
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
      {actions.map(props => (
        <AspectVertMenuItem {...props} params={params} />
      ))}
    </IconMenu>
  ) : null

AspectVertMenuItem.defaultProps = {
  icon: null,
  disabled: false,
  separator: false,
}

AspectVertMenuItem.propTypes = {
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  text: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  params: PropTypes.oneOfType([PropTypes.object]).isRequired,
  separator: PropTypes.bool,
}

AspectVertMenu.propTypes = {
  actions: PropTypes.instanceOf(Immutable.Record).isRequired,
  params: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectVertMenu
