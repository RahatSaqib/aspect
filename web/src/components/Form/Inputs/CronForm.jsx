import React, { useState } from 'react'
import { FormControlLabel } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
import Radio from '@mui/material/Radio'
import { useFormikContext } from 'formik'
import PropTypes from 'prop-types'
import useI18n from '../../../hooks/useI18n'
import Cron from '../../Cron/index'
import { getCronHumanValue } from '../../Cron/utils'
import { getFieldErrorProps } from '../Formik/Helpers'
import messages from '../messages'

const CronForm = props => {
  const { className, formik, id } = props
  const { cronRecurrency: initialCronRecurrency = null } = formik.initialValues
  const { updateField, toggleEdit } = useFormikContext()
  const { error, helperText } = getFieldErrorProps(formik, id)
  const [initialRecurrency] = useState(initialCronRecurrency)
  const [showCron, setShowCron] = useState(false)
  const handleOnChange = value => {
    updateField(id, value, { formik, toggleEdit })
  }

  const { locale, formatMessage } = useI18n()
  return (
    <FormControl component="fieldset" fullWidth>
      {initialRecurrency ? (
        <>
          <FormGroup>
            <FormControlLabel
              control={
                <Radio
                  color="primary"
                  value={initialRecurrency}
                  checked={!showCron}
                  onChange={() => {
                    setShowCron(false)
                    handleOnChange(initialCronRecurrency)
                  }}
                />
              }
              label={getCronHumanValue(initialRecurrency, locale)}
            />
            <FormControlLabel
              control={<Radio color="primary" value="2" onChange={() => setShowCron(true)} checked={showCron} />}
              label={formatMessage(messages.newRecurrency)}
            />
            {showCron ? <Cron onChange={handleOnChange} className={className} /> : true}
          </FormGroup>
        </>
      ) : (
        <Cron onChange={handleOnChange} className={className} />
      )}
      {error && helperText ? <FormHelperText error>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}

CronForm.defaultProps = {
  className: '',
}

CronForm.propTypes = {
  className: PropTypes.string,

  id: PropTypes.string.isRequired,

  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
}
export default CronForm
