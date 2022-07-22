// Imports from packages
import curry from 'lodash/curry'
import isString from 'lodash/isString'
import reduce from 'lodash/reduce'
import isBoolean from 'lodash/isBoolean'
import keys from 'lodash/keys'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export const makeGetClassNames = curry((pureGridPropTypes, keyToClassNameMappings, props) => {
  const initial = isString(props.className) ? [props.className] : []

  return reduce(
    pureGridPropTypes,
    (acc, unused, key) => {
      const value = props[key]
      if (isBoolean(value) && value) {
        acc.push(keyToClassNameMappings[key])
      }
      return acc
    },
    initial
  )
})

export function makeDelegateComponent(componentName, pureGridPropTypes, keyToClassNameMappings) {
  const propTypes = {
    className: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    ...pureGridPropTypes,
  }

  const excludedPropList = keys(propTypes)

  const getClassNames = makeGetClassNames(pureGridPropTypes, keyToClassNameMappings)

  return class extends PureComponent {
    static displayName = componentName

    static propTypes = propTypes

    static defaultProps = {
      className: null,
      component: 'div',
    }

    render() {
      const restProps = omit(this.props, excludedPropList)

      return React.createElement(
        this.props.component,
        {
          ...restProps,
          className: getClassNames(this.props).join(' '),
        },
        this.props.children
      )
    }
  }
}

export default makeDelegateComponent
