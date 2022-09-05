import React from 'react'
import Card from '@mui/material/Card'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import styles from './DataTableCard.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const DataTableCard = props => <Card {...props} className={cssClasses(props.className, 'Card')} />

export default enhance(DataTableCard)
