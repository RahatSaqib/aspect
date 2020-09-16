import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import Button from '@material-ui/core/Button'
import { MdKeyboardArrowLeft } from 'react-icons/md'

const cssClasses = classnames.bind(require('./DetailBackBar.css'))

const enhance = identity

export const DetailBackBar = ({ onBackClick, title, children }) => (
  <div className={cssClasses('Container')}>
    <Button
      className={cssClasses('Container__Button--back')}
      onClick={onBackClick}
      color="primary"
    >
      <MdKeyboardArrowLeft />
    </Button>
    <div className={cssClasses('Container__Title')}>{title}</div>
    <div>{children}</div>
  </div>
)

export default enhance(DetailBackBar)
