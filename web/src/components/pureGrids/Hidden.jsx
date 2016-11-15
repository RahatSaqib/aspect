// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'

const pureGridPropTypes = {
  xs: PropTypes.bool,
  sm: PropTypes.bool,
  md: PropTypes.bool,
  lg: PropTypes.bool,
  xl: PropTypes.bool
}

const keyToClassNameMappings = {
  xs: 'pure-hidden-xs',
  sm: 'pure-hidden-sm',
  md: 'pure-hidden-md',
  lg: 'pure-hidden-lg',
  xl: 'pure-hidden-xl'
}

export function getClassNames(props) {
  const initial = _.isString(props.className) ? [props.className] : []

  return _.reduce(pureGridPropTypes, (acc, unused, key) => {
    const value = props[key]
    if (_.isBoolean(value) && value) {
      acc.push(keyToClassNameMappings[key])
    }
    return acc
  }, initial)
}

export class Hidden extends PureComponent {

  static defaultProps = {
    component: 'div'
  }

  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string
    ]).isRequired,
    ...pureGridPropTypes
  }

  render() {
    const restProps = _.omit(this.props, excludedPropList)

    return React.createElement(this.props.component, {
      ...restProps,
      className: getClassNames(this.props).join(' ')
    }, this.props.children)
  }
}

const excludedPropList = _.keys(Hidden.propTypes)

export default Hidden
