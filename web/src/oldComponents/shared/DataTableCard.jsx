import React from 'react'
import { Card } from '@mui/material'
import classnames from 'classnames/bind'
import styles from './DataTableCard.module.css'

const cssClasses = classnames.bind(styles)

const DataTableCard = props => <Card {...props} className={cssClasses(props.className, 'Card')} />

export default DataTableCard
