import React from 'react'
import { Card } from '@mui/material'
import styles from './DataTableCard.module.css'

const DataTableCard = props => <Card {...props} className={`${styles[props.className] ?? ''} ${styles.Card}`} />

export default DataTableCard
