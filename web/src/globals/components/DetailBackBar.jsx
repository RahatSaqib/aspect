import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Button } from 'react-toolbox/lib/button'
import KeyboardArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'

const cssClasses = classnames.bind(require('./DetailBackBar.css'))

const enhance = _.identity

const themes = {
  Button: {
    flat: cssClasses('Button--flat'),
    primary: cssClasses('Button--primary'),
  },
}

export const DetailBackBar = ({ onBackClick, title, children }) => (
  <div className={cssClasses('Container')}>
    <Button
      className={cssClasses('Container__Button--back')}
      onClick={onBackClick}
      primary
      theme={themes.Button}
    >
      <KeyboardArrowLeft />
    </Button>
    <div className={cssClasses('Container__Title')}>{title}</div>
    <div>{children}</div>
  </div>
)

export default enhance(DetailBackBar)
