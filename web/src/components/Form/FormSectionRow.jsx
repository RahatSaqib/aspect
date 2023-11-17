import React from 'react'
import { Grid, IconButton } from '@mui/material'
import uniqueId from 'lodash/uniqueId'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import IconProvider from '../IconProvider'
import styles from './Form.module.css'
import FormItem from './FormItem'
import messagesBase from './messages'

const FormSectionRow = ({
  arrayHelpers,
  classNames,
  isMulti,
  items,
  messages,
  parentKey,
  rowId,
  showDeleteButton,
  subRowIndex,
}) => {
  const { formatMessage } = useIntl()

  const onClickAdd = () => arrayHelpers.insert(subRowIndex + 1, { __guid__: uniqueId(rowId) })

  const onClickDelete = () => arrayHelpers.remove(subRowIndex)

  const classes = `${styles.form__sectionItemsContainer} ${classNames.container ? styles[classNames.container] : ''}`
  return (
    <div className={styles.form__row}>
      <Grid container className={classes}>
        {items?.map((item, itemIndex) => {
          const { id, ...restItemProps } = item

          return (
            <FormItem
              key={`${parentKey}-${itemIndex.toString()}`}
              id={`${isMulti ? `${rowId}[${subRowIndex}].` : ''}${id}`}
              {...restItemProps}
              messages={messages}
              subRowIndex={subRowIndex}
            />
          )
        })}
      </Grid>
      {isMulti ? (
        <div className={styles.form__row_buttons}>
          {showDeleteButton ? (
            <IconButton
              className={`${styles.form__button} ${styles.form__button_close}`}
              onClick={onClickDelete}
              size="medium"
              title={formatMessage(messages.removeRow)}
            >
              <IconProvider icon="MdClose" />
            </IconButton>
          ) : null}
          <IconButton
            className={styles.form__button}
            onClick={onClickAdd}
            size="medium"
            title={formatMessage(messages.addRow)}
          >
            <IconProvider icon="AiOutlinePlus" />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}

FormSectionRow.defaultProps = {
  arrayHelpers: null,
  classNames: {},
  isMulti: false,
  messages: messagesBase,
  rowId: null,
  showDeleteButton: false,
  subRowIndex: 0,
  parentKey: '',
}

FormSectionRow.propTypes = {
  arrayHelpers: PropTypes.oneOfType([PropTypes.object]),
  classNames: PropTypes.objectOf(PropTypes.shape),
  items: PropTypes.oneOfType([PropTypes.array]).isRequired,
  messages: PropTypes.oneOfType([PropTypes.object]),
  rowId: PropTypes.string,
  rowIndex: PropTypes.number.isRequired,
  showDeleteButton: PropTypes.bool,
  isMulti: PropTypes.bool,
  subRowIndex: PropTypes.number,
  parentKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default FormSectionRow
