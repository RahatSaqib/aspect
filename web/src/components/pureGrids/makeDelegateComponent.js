// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export const makeGetClassNames = _.curry(
  (pureGridPropTypes, keyToClassNameMappings, props) => {
    const initial = _.isString(props.className) ? [props.className] : []

    return _.reduce(
      pureGridPropTypes,
      (acc, unused, key) => {
        const value = props[key]
        if (_.isBoolean(value) && value) {
          acc.push(keyToClassNameMappings[key])
        }
        return acc
      },
      initial
    )
  }
)

export function makeDelegateComponent(
  componentName,
  pureGridPropTypes,
  keyToClassNameMappings
) {
  const propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string])
      .isRequired,
    ...pureGridPropTypes,
  }

  const excludedPropList = _.keys(propTypes)

  const getClassNames = makeGetClassNames(
    pureGridPropTypes,
    keyToClassNameMappings
  )

  return class extends PureComponent {
    static displayName = componentName

    static defaultProps = {
      component: 'div',
      className: null,
    }

    static propTypes = propTypes

    render() {
      const restProps = _.omit(this.props, excludedPropList)

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
