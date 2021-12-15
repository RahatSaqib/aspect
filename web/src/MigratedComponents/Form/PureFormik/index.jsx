import React, { Fragment } from 'react'
import { Formik, Form, FastField } from 'formik'
import { object } from 'yup'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { getValidation } from './Helpers'
/**
 * This component should not contain **ANY**
 * logic, or transformers.
 */

const AspectPureFormik = ({
  config: { id, debug, rows, initialValues },
  actions,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validateOnChange={false}
      validationSchema={object().shape(getValidation(rows))}
      onSubmit={actions.submit}
    >
      {formik => {
        const { touched, dirty, isSubmitting, isValid } = formik
        return (
          <Fragment>
            <Form noValidate>
              {map(rows, (items, index) => (
                <div
                  key={`${id}-row${index}`}
                  className="form__row"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  {map(items, ({ component: Input, ...input }) => (
                    <div
                      key={`${id}-row${index}-${input?.id}`}
                      style={{ width: '100%', margin: '0 10px' }}
                    >
                      <FastField
                        name={input?.id}
                        inputProps={input}
                        component={Input}
                      />
                    </div>
                  ))}
                </div>
              ))}

              <button
                type="submit"
                // disabled={
                //   isSubmitting || !isValid || isEmpty(touched) || !dirty
                // }
              >
                Submit ({isValid ? 'valid' : 'invalid'})
              </button>
            </Form>
            {debug ? <pre>{JSON.stringify(formik, null, 2)}</pre> : null}
          </Fragment>
        )
      }}
    </Formik>
  )
}

export default AspectPureFormik
