import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'

import ReadOnlyField from './ReadOnlyField'

const enhance = compose(
  pure,
  setPropTypes({
    fields: PropTypes.arrayOf(PropTypes.shape(ReadOnlyField.propTypes))
      .isRequired,
  })
)

export { ReadOnlyField } // Backward-compatibility

export const ReadOnlyFields = ({ fields, ...restProps }) =>
  <div {...restProps}>
    {fields.map(it => <ReadOnlyField key={it.label} {...it} />)}
  </div>

export default enhance(ReadOnlyFields)
