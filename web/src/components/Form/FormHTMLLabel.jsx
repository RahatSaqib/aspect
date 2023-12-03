import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import IconProvider from '../IconProvider'
import styles from './FormHTMLLabel.module.css'

const FormHTMLLabel = ({ label, link }) => {
  const { url, target } = link || false
  return (
    <Fragment>
      <span
        /**
         * Since we know the source of this html
         * we can safely disable linting
         */
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {url ? (
        <Link to={url} target={target || '_self'} className={styles.formItem__link}>
          <IconProvider icon="FaExternalLinkAlt" />
        </Link>
      ) : null}
    </Fragment>
  )
}

export default FormHTMLLabel
