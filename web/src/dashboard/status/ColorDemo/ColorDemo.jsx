import React, { Fragment } from 'react'
import classnames from 'classnames/bind'

import styles from './colordemo.css'

const cssClasses = classnames.bind(styles)

const ColorBlock = ({ itemVal, itemKey }) => (
  <div
    className={cssClasses('color__demo--block')}
    style={{ background: itemVal.color }}
  >
    <div className={cssClasses('color__demo--value')}>{itemVal.name}</div>
    <div className={cssClasses('color__demo--key')}>{itemKey}</div>
  </div>
)

const ColorDemo = ({
  name1,
  name2,
  name3,
  vars1,
  vars2,
  vars3,
  vars4,
  vars5,
  vars6,
}) => (
  <Fragment>
    <h4 className={cssClasses('color__demo--h4')}>{name3}</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars5).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars5[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars6).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars6[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <h4 className={cssClasses('color__demo--h4')}>{name2}</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars4).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars4[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <h4 className={cssClasses('color__demo--h4')}>{name1}</h4>
    {/* <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars).map(key =>
        !key.includes('--aspect') ? (
          <ColorBlock itemVal={vars[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <h4 className={cssClasses('color__demo--h4')}>Color Overrides</h4> */}
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars1).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars1[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars2).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars2[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars3).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars3[key]} itemKey={key} />
        ) : null
      )}
    </div>
    <h4 className={cssClasses('color__demo--h4')}>{name2}</h4>
    <div className={cssClasses('color__demo--container')}>
      {Object.keys(vars4).map(key =>
        key.includes('--aspect-color') ? (
          <ColorBlock itemVal={vars4[key]} itemKey={key} />
        ) : null
      )}
    </div>
  </Fragment>
)

export default ColorDemo
