import React from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import { FieldArray, useFormikContext } from 'formik'
import range from 'lodash/range'

import FormSectionRow from './FormSectionRow'
import messagesBase from './messages'

const getVisibleRows = (rows, formik) => {
  return rows.map(row => {
    const { values } = formik
    if (row.visibleIf && !row.visibleIf(values)) {
      // row is hidden explicitly
      return false
    }
    // row is visible if at least one item is visible
    const { isMulti, id: rowId } = row
    const itemsVisible = row.items.map(({ visibleIf }) =>
      range(isMulti ? values[rowId].length : 1)
        .map(subRowIndex => (visibleIf ? visibleIf(values, subRowIndex) : true))
        .includes(true)
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
  parentKey,
}) => {
  const { formik } = useFormikContext()

  // check if section is visible
  const isSectionVisible = visibleIf ? visibleIf(formik.values) : true
  // check if rows are visible
  const visibleRows = isSectionVisible ? getVisibleRows(rows, formik) : []

  return isSectionVisible ? (
    <Grid item xs={fullWidth ? 12 : 10}>
      {rows &&
        rows.map((row, rowIndex) => {
          const key = `${parentKey}-${row.id}`
          if (visibleRows[rowIndex] === true) {
            const { items, isMulti } = row
            const commonProps = { rowIndex, items, classNames, messages }
            if (isMulti) {
              const subRows = formik.values[row.id]
              return (
                <FieldArray
                  key={key}
                  name={row.id}
                  render={arrayHelpers =>
                    subRows.map(
                      ({ __guid__: subRowKey = row.id }, subRowIndex) => (
                        <FormSectionRow
                          {...commonProps}
                          arrayHelpers={arrayHelpers}
                          isMulti
                          key={subRowKey}
                          parentKey={subRowKey}
                          rowId={row.id}
                          showDeleteButton={subRows.length > 1}
                          subRowIndex={subRowIndex}
                        />
                      )
                    )
                  }
                />
              )
            }
            return <FormSectionRow {...commonProps} key={key} parentKey={key} />
          }
          return null
        })}
    </Grid>
  ) : null
}

FormSection.defaultProps = {
  classNames: {},
  fullWidth: false,
  messages: messagesBase,
  visibleIf: () => true,
  parentKey: '',
}

FormSection.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  fullWidth: PropTypes.bool,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  messages: PropTypes.oneOfType([PropTypes.object]),
  visibleIf: PropTypes.oneOfType([PropTypes.func]),
  parentKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default FormSection
