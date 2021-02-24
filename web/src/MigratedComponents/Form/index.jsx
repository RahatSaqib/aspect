import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'

const cssClasses = classnames.bind(require('./Form.css'))

const AspectForm = ({ config: { sections } }) => {
  return (
    <Grid container className={cssClasses('form__container')}>
      <form
        noValidate
        autoComplete="off"
        className={cssClasses('form__parent')}
      >
        {sections &&
          sections.map(({ label, labelI18nKey, rows }) => (
            <Grid item xs={12} className={cssClasses('form__sectionContainer')}>
              <Grid container>
                <FormSectionHeader
                  header={label}
                  headerI18nKey={labelI18nKey}
                />
                <FormSection rows={rows} />
              </Grid>
            </Grid>
          ))}
      </form>
    </Grid>
  )
}

AspectForm.propTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectForm
