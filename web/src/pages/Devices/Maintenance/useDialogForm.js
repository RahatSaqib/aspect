import { useState } from 'react'
import isEmpty from 'lodash/isEmpty'

// Minimal form state for the maintenance dialogs: values, per-field meta and submit status.
const useDialogForm = ({ initialValues, validate, onSubmit }) => {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [pristine, setPristine] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const errors = validate(values)
  const form = { pristine, submitting, valid: isEmpty(errors) }

  const meta = Object.keys(values).reduce(
    (acc, field) => ({ ...acc, [field]: { touched: Boolean(touched[field]), error: errors[field] ?? null } }),
    {}
  )

  const setFieldValue = field => value => {
    setValues({ ...values, [field]: value })
    setTouched({ ...touched, [field]: true })
    setPristine(false)
  }

  const handleSubmit = event => {
    event.preventDefault()
    event.stopPropagation()

    setPristine(false)
    setTouched(Object.keys(values).reduce((acc, field) => ({ ...acc, [field]: true }), {}))
    if (!isEmpty(errors)) return

    setSubmitting(true)
    Promise.resolve(onSubmit(values)).then(
      () => {
        setSubmitting(false)
        setPristine(true)
      },
      () => setSubmitting(false)
    )
  }

  return { values, meta, form, setFieldValue, handleSubmit }
}

export default useDialogForm
