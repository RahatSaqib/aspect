import React, { Fragment, useState } from 'react'
import { array, func, number, object, oneOfType, string } from 'prop-types'
import Button from '@material-ui/core/Button'
import Popover from '@material-ui/core/Popover'
import classnames from 'classnames/bind'

import IconProvider from '../../../IconProvider'
import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render a popover cell
 */

const PopoverCell = ({ column, value }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  if (!value) {
    return '-'
  }

  return (
    <Fragment>
      <Button onClick={handleClick}>
        {column.popoverLabel({ value })}
        <IconProvider
          icon="MdKeyboardArrowDown"
          className={cssClasses('popover-cell__icon')}
        />
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
        {column.popoverContent({ value })}
      </Popover>
    </Fragment>
  )
}

PopoverCell.propTypes = {
  /**
    Definitions of cell column
   */
  column: oneOfType([object, func]).isRequired,
  /**
    Value for the cell to render
  */
  value: oneOfType([array, string, number]).isRequired,
}

export default PopoverCell
