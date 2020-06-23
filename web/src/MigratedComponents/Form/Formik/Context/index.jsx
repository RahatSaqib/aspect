import React, { Fragment, useEffect, useState } from 'react'

import { useFormik } from 'formik'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import keys from 'lodash/keys'

import { pickKeys } from '../Helpers/index'
import DisplayFormikState from '../Helpers/debug'

const FormikContext = React.createContext()

const FormikProvider = ({ config, children }) => {
  const debug = false
  const { actions } = config
  const [toggleEdit, setToggleEdit] = useState(actions.default === 'save')
  const initialValues = pickKeys(config.sections, ['initialValue'])
  const fieldTypes = pickKeys(config.sections, ['type'])

  const formik = useFormik({
    initialValues,
    validateOnMount: false,
    onSubmit: values =>
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify(
          pick(values, keys(omitBy(fieldTypes, i => i === 'readOnly'))),
          null,
          2
        )
      ),
  })

  return (
    <FormikContext.Provider value={{ formik, toggleEdit, setToggleEdit }}>
      {children}
      {debug && <DisplayFormikState {...formik} />}
    </FormikContext.Provider>
  )
}

function useFormikState() {
  const context = React.useContext(FormikContext)
  if (context === undefined) {
    throw new Error('useFormikState must be used within a FormikProvider')
  }
  return context
}

export { FormikContext, FormikProvider, useFormikState }
