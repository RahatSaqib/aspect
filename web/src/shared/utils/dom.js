import _ from 'lodash'

export const noop = _.noop

export const findKeyInTree = (target, key) => {
  while (_.isObject(target)) {
    if (_.has(target.dataset, key)) {
      return target.dataset[key]
    }
    target = target.parentNode
  }
}
