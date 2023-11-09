import React from 'react'
import PropTypes from 'prop-types'
import AspectLink from '../AspectLink'
import IconProvider from '../IconProvider'
import styles from './LabelLinkComponent.module.css'

const LabelLinkComponent = ({ link }) => {
  const { url, target } = link || false
  return url ? (
    <AspectLink
      to={url}
      target={target || '_self'}
      className={{
        active: styles.formItem__link,
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
