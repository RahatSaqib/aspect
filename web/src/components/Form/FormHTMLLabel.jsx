import React, { Fragment } from 'react'
import LabelLinkComponent from './LabelLinkComponent'

const FormHTMLLabel = ({ label, link }) => (
  <Fragment>
    <span
      /**
       * Since we know the source of this html
       * we can safely disable linting
       */
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: label,
      }}
    />
    <LabelLinkComponent link={link} />
  </Fragment>
)

export default FormHTMLLabel
