import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import Card from '@material-ui/core/Card'

const cssClasses = classnames.bind(require('./DataTableCard.css'))

const enhance = identity

const DataTableCard = props => (
  <Card {...props} className={cssClasses(props.className, 'Card')} />
)

export default enhance(DataTableCard)
