import isObject from 'lodash/isObject'
import has from 'lodash/has'

const findKeyInTree = (target, key) => {
  while (isObject(target)) {
    if (has(target.dataset, key)) {
      return target.dataset[key]
    }
    target = target.parentNode
  }
}

export default findKeyInTree
