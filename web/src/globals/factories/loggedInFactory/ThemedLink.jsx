import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import requirePermissions from '../../../components/shared/requirePermissions'
import Link from '../../../components/shared/Link'

const cssClasses = classnames.bind(require('./index.css'))

const themes = {
  Link: {
    link: cssClasses('Link__link'),
    active: cssClasses('Link__active'),
    icon: cssClasses('Link__icon'),
  },
}

// // const ThemedLink = ({ link: props, history, location, onClick }) => {
// const ThemedLink = props => {
//   const { href, label, requiredPermissions } = props
//   console.log(props)

//   //   console.log(props, history, location, onClick)
//   return <Link {...props} key={href} theme={themes.Link} title={label} />
// }

// ThemedLink.defaultProps = {
//   requiredPermissions: [],
// }

// ThemedLink.propTypes = {
//   href: PropTypes.string.isRequired,
//   label: PropTypes.string.isRequired,
//   requiredPermissions: PropTypes.oneOfType([PropTypes.array]),
// }

// export default requirePermissions({
//   permissions: ['result:view'],
// })(ThemedLink)
