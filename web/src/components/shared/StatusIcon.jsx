import React from 'react'
import PropTypes from 'prop-types'
import identity from 'lodash/identity'

import CircleIcon from '@material-ui/icons/Circle'

const enhance = identity

const StatusIcon = ({ status }) => {
  const statusToColor = {
    success: '#99D25D',
    warning: '#F7B500',
    error: '#DB3018',
  }
  const color = statusToColor[status]

  return <CircleIcon style={{ color }} />
}

StatusIcon.propTypes = {
  status: PropTypes.string,
}

StatusIcon.defaultProps = {
  status: 'success',
}

export default enhance(StatusIcon)
