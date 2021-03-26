import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'

const cssClasses = classnames.bind(require('./Form.css'))

const AspectForm = ({ config: { sections, classNames } }) => {
  classNames = classNames || {}
  return (
    <Grid
      container
      className={cssClasses('form__container', {
        [classNames.container]: !!classNames.container,
      })}
    >
      <form
        noValidate
        autoComplete="off"
        className={cssClasses('form__parent')}
      >
        {sections &&
          sections.map(
            ({ label, labelI18nKey, rows, hideHeader, classNames = {} }) => (
              <Grid
                item
                xs={12}
                className={cssClasses('form__sectionContainer')}
              >
                <Grid container>
                  {hideHeader === true ? null : (
                    <FormSectionHeader
                      header={label}
                      headerI18nKey={labelI18nKey}
                    />
                  )}
                  <FormSection
                    classNames={classNames}
                    fullWidth={hideHeader === true}
                    rows={rows}
                  />
                </Grid>
              </Grid>
            )
          )}
      </form>
    </Grid>
  )
}

AspectForm.propTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectForm
