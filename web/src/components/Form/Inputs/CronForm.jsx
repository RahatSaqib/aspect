import React from 'react'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import PropTypes from 'prop-types'
import Cron from '../../Cron/index'
import { getFieldErrorProps } from '../Formik/Helpers'

const CronForm = props => {
  const { className, classNames, formik, id, label } = props
  const { updateField, toggleEdit } = useFormikContext()
  const { error, helperText } = getFieldErrorProps(formik, id)

  const handleOnChange = value => updateField(id, value, { formik, toggleEdit })
  return (
    <FormControl component="fieldset" fullWidth>
      <Cron onChange={handleOnChange} />
      {error && helperText ? <FormHelperText error>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}

CronForm.defaultProps = {
  className: '',
  classNames: {},
  label: '',
}

CronForm.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
}
export default CronForm
