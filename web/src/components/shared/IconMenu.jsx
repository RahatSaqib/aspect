import React, { Children, cloneElement, isValidElement, useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { IconButton, Menu } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import PropTypes from 'prop-types'

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

const IconMenu = ({ classes: classNameValues, label, icon, children }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenu = event => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClick =
    item =>
    ({ innerHandler }) => {
      const { value, onClick } = item.props

      if (innerHandler) {
        innerHandler()
      } else if (onClick) {
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
        className={classNames(classNameValues.iconButton)}
        onClick={handleMenu}
      >
        {cloneElement(icon, {
          className: classNames(icon.props.className, classNameValues.icon),
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
              className: classNames(menuItem.props.className, classNameValues.menuItem),
              onClick: handleClick(menuItem),
            })
          }
        })}
      </Menu>
    </div>
  )
}

IconMenu.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  icon: PropTypes.node,
}

IconMenu.defaultProps = {
  label: 'icon-menu',
  icon: <MoreVertIcon />,
}

export default withStyles(styles)(IconMenu)
