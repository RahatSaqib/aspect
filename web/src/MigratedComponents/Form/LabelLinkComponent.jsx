import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import IconProvider from '../IconProvider'
import AspectLink from '../AspectLink'

import styles from './LabelLinkComponent.css'

const cssClasses = classnames.bind(styles)

const LabelLinkComponent = ({ link }) => {
  const { url, target } = link || false
  return url ? (
    <AspectLink
      to={url}
      target={target || '_self'}
      className={{
        active: cssClasses('formItem__link'),
      }}
    >
      <IconProvider icon="FaExternalLinkAlt" />
    </AspectLink>
  ) : null
}

LabelLinkComponent.propTypes = {
  link: PropTypes.shape({
    url: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
}

export default LabelLinkComponent
