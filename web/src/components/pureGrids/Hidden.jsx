import PropTypes from 'prop-types'

import {
  makeGetClassNames,
  makeDelegateComponent,
} from './makeDelegateComponent'
import styles from './pure-grids-responsive-min.css'

const pureGridPropTypes = {
  xs: PropTypes.bool,
  sm: PropTypes.bool,
  md: PropTypes.bool,
  lg: PropTypes.bool,
  xl: PropTypes.bool,
}

const keyToClassNameMappings = {
  xs: styles['pure-hidden-xs'],
  sm: styles['pure-hidden-sm'],
  md: styles['pure-hidden-md'],
  lg: styles['pure-hidden-lg'],
  xl: styles['pure-hidden-xl'],
}

export const getClassNames = makeGetClassNames(
  pureGridPropTypes,
  keyToClassNameMappings
)

export const Hidden = makeDelegateComponent(
  'Hidden',
  pureGridPropTypes,
  keyToClassNameMappings
)

export default Hidden
