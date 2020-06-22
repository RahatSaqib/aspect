import React, { Fragment } from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./colordemo.css'))

const ColorBlock = ({ itemVal, itemKey }) => (
  <div
    className={cssClasses('color__demo--block')}
    style={{ background: itemVal }}
  >
    <div className={cssClasses('color__demo--value')}>{itemVal}</div>
    <div className={cssClasses('color__demo--key')}>{itemKey}</div>
  </div>
)

const ColorDemo = ({ vars }) => (
  <Fragment>
    <h4 className={cssClasses('color__demo--h4')}>Base Colors</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars).map(key =>
        !key.includes('--aspect') ? (
          <ColorBlock itemVal={vars[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <h4 className={cssClasses('color__demo--h4')}>Color Overrides</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars[key]} itemKey={key} />
        ) : null
      )}
    </div>
  </Fragment>
)

export default ColorDemo
