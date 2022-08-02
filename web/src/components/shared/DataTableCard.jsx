import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import Card from '@material-ui/core/Card'

import styles from './DataTableCard.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const DataTableCard = props => <Card {...props} className={cssClasses(props.className, 'Card')} />

export default enhance(DataTableCard)
