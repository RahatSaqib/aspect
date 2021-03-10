import { useQuery } from 'react-query'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import messages from './messages'
import SelectField from '../../../components/shared/SelectField'
import fetchWrapperForQueries from '../../../MigratedComponents/QueryFetch'
import RESULT_CATEGORY_GROUP_SELECT_LIST from '../../../MigratedComponents/QueryFetch/ResultCategoryGroup'
import { types } from './ResultCategoryGroupSelectFieldRedux'

const cssClasses = classnames.bind(require('../../popover/FiltersPanel.css'))

export default ({
  onResultCategoryGroupChange,
  value,
  assayId,
  ...restProps
}) => {
  const { data, isError } = useQuery(
    [RESULT_CATEGORY_GROUP_SELECT_LIST.KEY, assayId],
    async () =>
      fetchWrapperForQueries({
        endpoint: RESULT_CATEGORY_GROUP_SELECT_LIST.ENDPOINT,
        params: { assayId },
      })
  )

  const [resultCategoryGroups, setResultCategoryGroups] = useState(false)
  const dispatch = useDispatch()
  const { formatMessage } = useIntl()
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
  const textForItem = (i18nKey, name) =>
    messages[i18nKey] ? formatMessage(messages[i18nKey]) : name

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
              <div className={cssClasses('Control__inner')}>
                {textForItem(i18nKey, name)}
              </div>
            </MenuItem>
          ))
        : null}
    </SelectField>
  )
}
