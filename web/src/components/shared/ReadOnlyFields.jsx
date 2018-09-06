import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure, withProps } from 'recompose'

import ReadOnlyField from './ReadOnlyField'

const enhance = compose(
  pure,
  setPropTypes({
    fields: PropTypes.arrayOf(PropTypes.shape(ReadOnlyField.propTypes))
      .isRequired,
  }),
  withProps(({ fields, hideLabel = false }) => ({
    fields,
    hideLabel: hideLabel && fields.length < 2,
  }))
)

export { ReadOnlyField } // Backward-compatibility

export const ReadOnlyFields = ({ fields, hideLabel = false, ...restProps }) => (
  <div {...restProps}>
    {fields.map(it => (
      <ReadOnlyField key={it.label} hideLabel={hideLabel} {...it} />
    ))}
  </div>
)

export default enhance(ReadOnlyFields)
