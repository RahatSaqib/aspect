import React, { Fragment } from 'react'
import { Formik, Form, FastField } from 'formik'
import map from 'lodash/map'
import { object } from 'yup'
import { getValidation } from './Helpers'

/**
 * This component should not contain **ANY**
 * extra logic, or transformers.
 */

const AspectPureFormik = ({ config: { id, debug: cfgDebug, rows, initialValues }, actions, debug }) => (
  <Formik
    initialValues={initialValues}
    validateOnChange
    enableReinitialize
    validationSchema={object().shape(getValidation(rows))}
  >
    {formik => (
      <Fragment>
        <Form noValidate>
          {map(rows, (items, index) => (
            <div
              key={`${id}-row${index}`}
              className="form__row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              {map(items, ({ component: Input, ...input }) => (
                <div key={`${id}-row${index}-${input?.id}`} style={{ width: '100%', margin: '0 10px' }}>
                  <FastField name={input?.id} inputProps={input} component={Input} />
                </div>
              ))}
            </div>
          ))}
          {map(actions, ({ id, component: Component, ...rest }) => (
            <Component key={id} {...rest} formik={formik} />
          ))}
        </Form>
        {debug || cfgDebug ? <pre>{JSON.stringify(formik, null, 2)}</pre> : null}
      </Fragment>
    )}
  </Formik>
)

export default AspectPureFormik
