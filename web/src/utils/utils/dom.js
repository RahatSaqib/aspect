import has from 'lodash/has'
import isObject from 'lodash/isObject'

const findKeyInTree = (target, key) => {
  while (isObject(target)) {
    if (has(target.dataset, key)) {
      return target.dataset[key]
    }
    target = target.parentNode
  }
}

export default findKeyInTree
