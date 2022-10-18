import React from 'react'
import classnames from 'classnames/bind'
import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

const PlaceholderCell = () => <div className={cssClasses('placeholder__cell')} />

export default PlaceholderCell
