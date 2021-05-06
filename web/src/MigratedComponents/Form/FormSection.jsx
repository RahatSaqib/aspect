import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import { useFormikState } from './Formik/Context'
import FormItem from './FormItem'

const cssClasses = classnames.bind(require('./Form.css'))

const getVisibleRows = (rows, formik) => {
  return rows.map(row => {
    if (row.visibleIf && !row.visibleIf(formik.values)) {
      // row is hidden explicitly
      return false
    }
    // row is visible if at least one item is visible
    const itemsVisible = row.items.map(item =>
      item.visibleIf ? item.visibleIf(formik.values) : true
    )
    return itemsVisible.includes(true)
  })
}

const FormSection = ({
  classNames,
  fullWidth,
  messages,
  rows = [],
  visibleIf,
}) => {
  const { formik } = useFormikState()

  // check if section is visible
  const isSectionVisible = visibleIf ? visibleIf(formik.values) : true
  // check if rows are visible
  const visibleRows = isSectionVisible ? getVisibleRows(rows, formik) : []

  return isSectionVisible ? (
    <Grid item xs={fullWidth ? 12 : 10}>
      {rows &&
        rows.map(({ items }, rowIndex) =>
          visibleRows[rowIndex] === true ? (
            <Grid
              container
              className={cssClasses('form__sectionItemsContainer', {
                [classNames.container]: !!classNames.container,
              })}
            >
              {items &&
                items.map(item => <FormItem {...item} messages={messages} />)}
            </Grid>
          ) : null
        )}
    </Grid>
  ) : null
}

FormSection.defaultProps = {
  classNames: {},
  fullWidth: false,
  visibleIf: () => true,
}

FormSection.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  fullWidth: PropTypes.bool,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  messages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  visibleIf: PropTypes.oneOfType([PropTypes.func]),
}

export default FormSection
