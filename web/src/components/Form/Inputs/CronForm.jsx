import React, { useState } from 'react'
import { FormControlLabel } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
import Radio from '@mui/material/Radio'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { Cron, getCronHumanValue } from '../..'
import { getFieldErrorProps } from '../Formik/Helpers'
import messages from '../messages'

const CronForm = props => {
  const { className, formik, id } = props
  const { cronRecurrency: initialCronRecurrency = null } = formik.initialValues

  const value = get(formik.values, id)

  const { updateField, toggleEdit } = useFormikContext()
  const { error, helperText } = getFieldErrorProps(formik, id)
  const [initialRecurrency] = useState(
    isNil(initialCronRecurrency) || isEmpty(initialCronRecurrency) ? null : initialCronRecurrency
  )
  const [showCron, setShowCron] = useState(false)
  const handleOnChange = (cronExpression, frequency) => {
    updateField(id, { cronExpression, frequency }, { formik, toggleEdit })
  }
  const { locale, formatMessage } = useIntl()
  return (
    <FormControl component="fieldset" fullWidth>
      {isArray(initialRecurrency) ? (
        <>
          <FormGroup>
            <FormControlLabel
              control={
                <Radio
                  color="primary"
                  value={initialRecurrency.join(' ')}
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
            {showCron ? <Cron onChange={handleOnChange} value={value} className={className} /> : true}
          </FormGroup>
        </>
      ) : (
        <Cron onChange={handleOnChange} value={value} className={className} />
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
