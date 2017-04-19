import PropTypes from 'prop-types'

import {
  makeGetClassNames,
  makeDelegateComponent
} from './makeDelegateComponent'
import styles from './pure-grids-responsive-min.css'

const pureGridPropTypes = {
  xs: PropTypes.bool,
  sm: PropTypes.bool,
  md: PropTypes.bool,
  lg: PropTypes.bool,
  xl: PropTypes.bool
}

const keyToClassNameMappings = {
  xs: styles['pure-visible-xs'],
  sm: styles['pure-visible-sm'],
  md: styles['pure-visible-md'],
  lg: styles['pure-visible-lg'],
  xl: styles['pure-visible-xl']
}

export const getClassNames = makeGetClassNames(pureGridPropTypes, keyToClassNameMappings)

export const Visible = makeDelegateComponent('Visible', pureGridPropTypes, keyToClassNameMappings)

export default Visible
