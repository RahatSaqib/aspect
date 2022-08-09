import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import uniqueId from 'lodash/uniqueId'

import useI18n from '../../Hooks/i18n/useI18n'
import IconProvider from '../IconProvider'
import FormItem from './FormItem'
import messagesBase from './messages'
import styles from './Form.css'

const cssClasses = classnames.bind(styles)

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
  const { formatMessage } = useI18n()

  const onClickAdd = () => arrayHelpers.insert(subRowIndex + 1, { __guid__: uniqueId(rowId) })

  const onClickDelete = () => arrayHelpers.remove(subRowIndex)

  return (
    <div className={cssClasses('form__row')}>
      <Grid
        container
        className={cssClasses('form__sectionItemsContainer', {
          [classNames.container]: !!classNames.container,
        })}
      >
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
        <div className={cssClasses('form__row-buttons')}>
          {showDeleteButton ? (
            <IconButton
              className={cssClasses('form__button', 'form__button-close')}
              onClick={onClickDelete}
              size="medium"
              title={formatMessage(messages.removeRow)}
            >
              <IconProvider icon="MdClose" />
            </IconButton>
          ) : null}
          <IconButton
            className={cssClasses('form__button')}
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
