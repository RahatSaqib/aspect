import React from 'react'
import PropTypes from 'prop-types'
import identity from 'lodash/identity'

import CircleIcon from '@mui/icons-material/Circle'
import { Tooltip } from '@mui/material/index'

const enhance = identity

const StatusIcon = ({ status, title }) => {
  const statusToColor = {
    success: '#99D25D',
    warning: '#F7B500',
    error: '#DB3018',
  }
  const color = statusToColor[status]

  return (
    <Tooltip title={title}>
      <CircleIcon style={{ color }} />
    </Tooltip>
  )
}

StatusIcon.propTypes = {
  status: PropTypes.string,
  title: PropTypes.string,
}

StatusIcon.defaultProps = {
  status: 'success',
  title: '',
}

export default enhance(StatusIcon)
