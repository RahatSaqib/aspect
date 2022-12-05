import React, { useEffect, useMemo, useState } from 'react'
import { FormikProvider as FormikProviderBase, useFormik } from 'formik'
import reduce from 'lodash/reduce'
import useFormConfig from '../../Hooks/useFormConfig'
import { sanitizeFormValues } from '../Helpers'
import DisplayFormikState from '../Helpers/debug'

export const FormikProvider = ({ config, children, debug }) => {
  const { actions, validationSchema = null } = config
  const [toggleEdit, setToggleEdit] = useState(actions.default === 'save')
  const { meta, registerVisibleFields, updateField } = useFormConfig(config)
  const initialValues = useMemo(() => config.values || meta.initialValues, [config.values, meta.initialValues])

  const formikConfiguration = useMemo(
    () => ({
      enableReinitialize: true,
      initialValues,
      validateOnMount: false,
      validationSchema,
      onSubmit: values => {
        const payload = sanitizeFormValues(values, { formConfig: config })
        console.log(JSON.stringify(payload, null, 2)) // eslint-disable-line no-console
      },
    }),
    [config, initialValues, validationSchema]
  )

  // const formik = useFormik(formikConfiguration)
  const { ...rest } = useFormik(formikConfiguration)
  const dependencies = reduce(rest, (acc, item) => [...acc, item], [])
  const formik = useMemo(() => {
    return { ...rest }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

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
