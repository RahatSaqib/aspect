import classnames from 'classnames'
import React from 'react'
import { compose } from 'recompose'
import { themr } from 'react-css-themr'
import theme from 'react-toolbox/lib/input/theme.css'
import { INPUT } from 'react-toolbox/lib/identifiers'

const enhance = compose(themr(INPUT, theme))

const FormGroup = ({ theme, label, htmlFor, children }) => (
  <div className={theme.input}>
    <div
      id={htmlFor}
      className={classnames(theme.inputElement, theme.filled)}
      style={{ borderBottom: 'none' }}
    >
      {children}
    </div>
    <label className={theme.label} htmlFor={htmlFor}>
      {label}
    </label>
  </div>
)

export default enhance(FormGroup)
