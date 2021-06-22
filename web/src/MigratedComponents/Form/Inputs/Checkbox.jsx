import React from 'react'
import PropTypes from 'prop-types'

import CheckboxField from '../../../components/shared/CheckboxField'
import { useFormikState } from '../Formik/Context'

const Checkbox = (props) => {
  const { className, classNames, formik, id, label } = props
  const { updateField } = useFormikState()

  return (
    <CheckboxField
      checked={formik.values[id]}
      className={className}
      classNames={classNames}
      label={label}
      name={id}
      onChange={(event) => {
        updateField(id, event.target.checked, formik)
      }}
    />
  )
}

Checkbox.defaultProps = {
  className: '',
  classNames: {},
  label: '',
}

Checkbox.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
}
export default Checkbox
