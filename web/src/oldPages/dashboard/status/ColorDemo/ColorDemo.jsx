import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import styles from './colordemo.css'

const cssClasses = classnames.bind(styles)

const ColorBlock = ({ itemVal, itemKey }) => (
  <div className={cssClasses('color__demo--block')} style={{ background: itemVal.color }}>
    <div className={cssClasses('color__demo--value')}>{itemVal.name}</div>
    <div className={cssClasses('color__demo--key')}>{itemKey}</div>
  </div>
)

const ColorDemo = ({ name1, vars1 }) => (
  <Fragment>
    <h4 className={cssClasses('color__demo--h4')}>{name1}</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars1).map(key =>
        key.includes('--aspect-color') ? <ColorBlock itemVal={vars1[key]} itemKey={key} /> : null
      )}
    </div>
  </Fragment>
)

export default ColorDemo
