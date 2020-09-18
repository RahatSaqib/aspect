import PropTypes from 'prop-types'
import React from 'react'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import Divider from '@material-ui/core/Divider'
import classnames from 'classnames/bind'
import IconProvider from '../IconProvider'
import IconMenu from '../../components/shared/IconMenu'

const cssClasses = classnames.bind(require('./AspectVertMenu.css'))

const AspectVertMenuItem = ({
  icon,
  disabled = false,
  text,
  action,
  params,
  separator = false,
}) => (
  <>
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
  </>
)

const AspectVertMenu = ({ actions, params }) => {
  if (actions)
    return (
      <IconMenu icon={<MoreVertIcon />} className={cssClasses('menu')}>
        {actions.map(props => (
          <AspectVertMenuItem {...props} params={params} />
        ))}
      </IconMenu>
    )
  return null
}

AspectVertMenu.propTypes = {
  actions: PropTypes.shape({
    icon: PropTypes.string,
    text: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
  }),
  params: PropTypes.oneOf(['PropTypes.Object']).isRequired,
}

export default AspectVertMenu
