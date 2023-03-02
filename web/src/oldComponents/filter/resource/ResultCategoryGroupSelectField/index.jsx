import React, { useEffect, useState } from 'react'
import { MenuItem } from '@mui/material'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import RESULT_CATEGORY_GROUP_SELECT_LIST from '../../../../components/QueryFetch/ResultCategoryGroup'
import useI18n from '../../../../hooks/useI18n'
import { types } from '../../../../store/ResultCategoryGroupSelectFieldRedux'
import SelectField from '../../../shared/SelectField'
import styles from '../../popover/styles.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const ResultCategoryGroupSelectField = ({ onResultCategoryGroupChange, value, assayId, allItemText, ...restProps }) => {
  const { formatMessage } = useI18n()
  const { data, isError } = useQuery([RESULT_CATEGORY_GROUP_SELECT_LIST.KEY, assayId], async () =>
    fetchWrapperForQueries({
      endpoint: RESULT_CATEGORY_GROUP_SELECT_LIST.ENDPOINT,
      params: { assayId },
    })
  )

  const [resultCategoryGroups, setResultCategoryGroups] = useState(false)
  const dispatch = useDispatch()
  useEffect(() => {
    if (data && !isError) {
      const items = data.data
      setResultCategoryGroups(items)
      dispatch({
        type: types.RECEIVE_RESULT_CATEGORY_GROUP,
        items,
        lastRefreshed: new Date(),
      })
    }
  }, [data, dispatch, isError])

  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={({ target: { value } }) => {
        onResultCategoryGroupChange(value)
      }}
    >
      {resultCategoryGroups
        ? resultCategoryGroups.map(({ externalId, name, i18nKey }) => (
            <MenuItem key={externalId} value={externalId}>
              <div className={cssClasses('Control__inner')}>{formatMessage(messages[i18nKey], name)}</div>
            </MenuItem>
          ))
        : null}
    </SelectField>
  )
}

export default ResultCategoryGroupSelectField
