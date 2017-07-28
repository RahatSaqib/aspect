// const BrowseCard = props => <Card {...props} className={cssClasses(props.className, 'Card')} />
import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Card } from 'react-toolbox/lib/card'

const cssClasses = classnames.bind(require('./BrowseCard.css'))

const enhance = _.identity

const BrowseCard = props =>
  <Card {...props} className={cssClasses(props.className, 'Card')} />

export default enhance(BrowseCard)
