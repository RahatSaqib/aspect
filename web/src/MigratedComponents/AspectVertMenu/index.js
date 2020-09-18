import IconMenu from '../../components/shared/IconMenu'
import IconProvider from '../IconProvider'

import React from 'react'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import Divider from '@material-ui/core/Divider';
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./AspectVertMenu.css'))

const AspectVertMenuItem = ({ icon, text, action, params, separator = false }) => (
  <>
    <MenuItem onClick={() => { action(params) }} className={cssClasses('menu-item')}>
      {icon && <ListItemIcon>
        <IconProvider icon={icon}></IconProvider>
      </ListItemIcon>
      }
      <ListItemText
        inset
        primary={text}
      />
    </MenuItem>
    {separator && <Divider className={cssClasses('divider')} />}
  </>
)

const AspectVertMenu = ({ actions, params }) => {
  if (actions)
    return (
      <IconMenu icon={<MoreVertIcon />} className={cssClasses('menu')}>
        {actions.map(props => (<AspectVertMenuItem {...props} params={params} />))}
      </IconMenu>
    )
  else
    return null
}

export default AspectVertMenu