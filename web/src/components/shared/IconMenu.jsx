import React, { Children, cloneElement, isValidElement, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  iconButton: {
    padding: 8,
  },
  icon: {
    color: theme.palette.grey[900],
    fontSize: '1.25rem',
  },
  menuItem: {
    minWidth: 'auto',
  },
})

const IconMenu = ({ classes: classesMap, label, icon, children }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenu = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClick = item => () => {
    const { value, onClick } = item.props
    if (onClick) {
      onClick(value)
    }
    handleClose()
  }

  return (
    <div>
      <IconButton
        aria-label={label}
        aria-owns={open ? 'icon-menu' : undefined}
        aria-haspopup="true"
        className={classNames(classesMap.iconButton)}
        onClick={handleMenu}
      >
        {cloneElement(icon, {
          className: classNames(icon.props.className, classesMap.icon),
        })}
      </IconButton>
      <Menu
        id="menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={open}
        onClose={handleClose}
      >
        {Children.map(children, menuItem => {
          if (isValidElement(menuItem)) {
            return cloneElement(menuItem, {
              className: classNames(
                menuItem.props.className,
                classesMap.menuItem
              ),
              onClick: handleClick(menuItem),
            })
          }
        })}
      </Menu>
    </div>
  )
}

IconMenu.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  icon: PropTypes.node,
}

IconMenu.defaultProps = {
  label: 'icon-menu',
  icon: <MoreVertIcon />,
}

export default withStyles(styles)(IconMenu)
