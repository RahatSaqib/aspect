import React, { useEffect, useState } from 'react'

import { FormikProvider as FormikProviderBase, useFormik } from 'formik'

import DisplayFormikState from '../Helpers/debug'
import { sanitizeFormValues } from '../Helpers'
import useFormConfig from '../../hooks/useFormConfig'

export const FormikProvider = ({ config, children }) => {
  const debug = false
  const { actions, validationSchema = null } = config
  const [toggleEdit, setToggleEdit] = useState(actions.default === 'save')
  const { meta, registerVisibleFields, updateField } = useFormConfig(config)
  const initialValues = config.values || meta.initialValues

  const formikConfiguration = {
    enableReinitialize: true,
    initialValues,
    validateOnMount: false,
    validationSchema,
    onSubmit: values => {
      const payload = sanitizeFormValues(values, { formConfig: config })
      console.log(JSON.stringify(payload, null, 2)) // eslint-disable-line no-console
    },
  }
  const formik = useFormik(formikConfiguration)

  useEffect(() => {
    /**
     * 1. based on initial values:
     *    - define all visible fields and
     *    - register in formik all visible fields with validators
     */
    registerVisibleFields(initialValues, formik, toggleEdit)
    /**
     * 2. validate form to populate formik.errors
     */
    formik.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <FormikProviderBase
      value={{
        ...formik, // provide formikProps in the root (i.e. FieldArray needs setFormikState)
        formik,
        setToggleEdit,
        toggleEdit,
        updateField,
        meta,
        validationSchema,
      }}
    >
      {children}
      {debug && <DisplayFormikState {...formik} />}
    </FormikProviderBase>
  )
}

export default FormikProvider
