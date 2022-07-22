// Imports from packages
import isString from 'lodash/isString'
import reduce from 'lodash/reduce'
import omit from 'lodash/omit'
import keys from 'lodash/keys'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'

import styles from './pure-grids-responsive-min.css'

const pureGridPropTypes = {
  xs: PropTypes.string,
  sm: PropTypes.string,
  md: PropTypes.string,
  lg: PropTypes.string,
  xl: PropTypes.string,
}

const keyToPrefixMappings = {
  xs: 'pure-u',
  sm: 'pure-u-sm',
  md: 'pure-u-md',
  lg: 'pure-u-lg',
  xl: 'pure-u-xl',
}

export function getClassNames(props) {
  const initial = isString(props.className) ? [props.className] : []

  return reduce(
    pureGridPropTypes,
    (acc, unused, key) => {
      const value = props[key]
      if (isString(value)) {
        acc.push(styles[`${keyToPrefixMappings[key]}-${value}`])
      }
      return acc
    },
    initial
  )
}

const enhance = compose(
  setPropTypes({
    className: PropTypes.string,
  }),
  pure
)

export const Unit = props => (
  <div {...omit(props, keys(pureGridPropTypes))} className={getClassNames(props).join(' ')}>
    {props.children}
  </div>
)

export default enhance(Unit)
