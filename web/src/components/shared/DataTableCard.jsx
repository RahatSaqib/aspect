import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Card } from 'react-toolbox/lib/card'

const cssClasses = classnames.bind(require('./DataTableCard.css'))

const enhance = _.identity

const DataTableCard = props => (
  <Card {...props} className={cssClasses(props.className, 'Card')} />
)

export default enhance(DataTableCard)
