import React from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import styles from './DetailBackBar.css'

const cssClasses = classnames.bind(styles)

export const DetailBackBar = ({ onBackClick, title, children }) => (
  <div className={cssClasses('Container')}>
    <Button className={cssClasses('Container__Button--back')} onClick={onBackClick} color="primary">
      <MdKeyboardArrowLeft size={48} />
    </Button>
    <div className={cssClasses('Container__Title')}>{title}</div>
    <div>{children}</div>
  </div>
)

export default DetailBackBar
