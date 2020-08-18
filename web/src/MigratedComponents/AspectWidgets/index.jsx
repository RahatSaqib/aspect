import React from 'react'
import PropTypes from 'prop-types'

import AspectLink from '../../components/shared/AspectLink'

const formatMessage = (a, b, c, d) => {
  console.log({ a, b, c, d })
  return d
}

const AspectWidgets = props => {
  console.log(props)
  return <div>widget!</div>
}

AspectWidgets.propTypes = {}

export default AspectWidgets
