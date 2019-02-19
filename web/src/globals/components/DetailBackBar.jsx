import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Button from '@material-ui/core/Button'
import KeyboardArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'

const cssClasses = classnames.bind(require('./DetailBackBar.css'))

const enhance = _.identity

export const DetailBackBar = ({ onBackClick, title, children }) => (
  <div className={cssClasses('Container')}>
    <Button
      className={cssClasses('Container__Button--back')}
      onClick={onBackClick}
      color="primary"
    >
      <KeyboardArrowLeft />
    </Button>
    <div className={cssClasses('Container__Title')}>{title}</div>
    <div>{children}</div>
  </div>
)

export default enhance(DetailBackBar)
