import React from 'react'
import PropTypes from 'prop-types'

import Popover from '@material-ui/core/Popover'

const LegendPopOver = ({ key, open, anchorEl, message }) => {
  return (
    <Popover
      id={`legend-popover-${key}`}
      // className={classes.popover}
      // classes={{
      //   paper: classes.paper
      // }}
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      disableRestoreFocus
    >
      message
    </Popover>
  )
}

export default LegendPopOver
