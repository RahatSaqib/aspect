import React from 'react'
import PropTypes from 'prop-types'
import { Form } from 'formik'

import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'

import styles from './Form.css'

const cssClasses = classnames.bind(styles)

const AspectForm = ({ config: { sections, classNames, messages } }) => {
  classNames = classNames || {}
  return (
    <Grid
      container
      className={cssClasses('form__container', {
        [classNames.container]: !!classNames.container,
      })}
    >
      <Form
        noValidate
        autoComplete="off"
        className={cssClasses('form__parent')}
      >
        {sections &&
          sections.map(
            ({
              id,
              label,
              labelI18nKey,
              rows,
              hideHeader,
              classNames = {},
            }) => {
              return (
                <Grid
                  key={id}
                  item
                  xs={12}
                  className={cssClasses('form__sectionContainer')}
                >
                  <Grid container>
                    {hideHeader ? null : (
                      <FormSectionHeader
                        classNames={classNames}
                        header={label}
                        headerI18nKey={labelI18nKey}
                        messages={messages}
                      />
                    )}
                    <FormSection
                      classNames={classNames}
                      fullWidth={hideHeader === true}
                      messages={messages}
                      rows={rows}
                      parentKey={id}
                    />
                  </Grid>
                </Grid>
              )
            }
          )}
      </Form>
    </Grid>
  )
}

AspectForm.propTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectForm
