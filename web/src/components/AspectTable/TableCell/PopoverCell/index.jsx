import React, { Fragment, useState } from 'react'
import { Button, Popover } from '@mui/material'
import classnames from 'classnames/bind'
import { array, number, object, oneOfType, string } from 'prop-types'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render a popover cell
 */

const PopoverCell = ({ children, label }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <Fragment>
      <Button onClick={handleClick}>
        {label}
        <IconProvider icon="MdKeyboardArrowDown" className={cssClasses('popover-cell__icon')} />
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        classes={{
          paper: cssClasses('popover-cell__paper'),
        }}
      >
        {children}
      </Popover>
    </Fragment>
  )
}

PopoverCell.defaultProps = {
  children: null,
}

PopoverCell.propTypes = {
  children: oneOfType([array, string, number, object]),
  label: oneOfType([array, string, number]).isRequired,
}

export default PopoverCell
