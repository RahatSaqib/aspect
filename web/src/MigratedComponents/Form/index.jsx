import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'

const cssClasses = classnames.bind(require('./Form.css'))

const AspectFormBase = ({ config: { sections, formContainerClassName } }) => (
  <Grid
    container
    className={cssClasses('form__container', {
      [formContainerClassName]: !!formContainerClassName,
    })}
  >
    <form noValidate autoComplete="off" className={cssClasses('form__parent')}>
      {sections &&
        sections.map(
          ({ label, labelI18nKey, rows, hideHeader, sectionItemsContainerClassName }) => (
            <Grid item xs={12} className={cssClasses('form__sectionContainer')}>
              <Grid container>
                {hideHeader === true ? null : (
                  <FormSectionHeader
                    header={label}
                    headerI18nKey={labelI18nKey}
                  />
                )}
                <FormSection
                  rows={rows}
                  fullWidth={hideHeader === true}
                  sectionItemsContainerClassName={
                    sectionItemsContainerClassName
                  }
                />
              </Grid>
            </Grid>
          )
        )}
    </form>
  </Grid>
)

const AspectForm = React.memo(AspectFormBase)

AspectForm.propTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectForm
