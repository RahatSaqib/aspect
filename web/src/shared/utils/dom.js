import _ from 'lodash'

export const noop = _.noop // eslint-disable-line prefer-destructuring

export const findKeyInTree = (target, key) => {
  while (_.isObject(target)) {
    if (_.has(target.dataset, key)) {
      return target.dataset[key]
    }
    target = target.parentNode
  }
}
