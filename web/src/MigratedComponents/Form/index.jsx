import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import Card from '@material-ui/core/Card'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'

const cssClasses = classnames.bind(require('./Form.css'))

const AspectForm = ({ sections }) => (
  <Grid container className={cssClasses('form__container')}>
    {sections &&
      sections.map(({ id, header, items }) => (
        <Grid item xs={12} className={cssClasses('form__sectionContainer')}>
          <Grid container>
            <FormSectionHeader header={header} />
            <FormSection items={items} />
          </Grid>
        </Grid>
      ))}
  </Grid>
)

// AspectForm.propTypes = {}

export default AspectForm
