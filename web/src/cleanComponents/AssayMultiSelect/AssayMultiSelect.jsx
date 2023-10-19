import React, { useMemo } from 'react'
import isMatch from 'lodash/isMatch'
import useAssayList from '../../hooks/assay/useAssayList'
import useI18n from '../../hooks/useI18n'
import { assay } from '../../messages'
import messages from '../../messages/FilterMessages'
import AspectSelect from '../AspectSelect'

function AssayMultiSelect(props) {
  const { filters, ...rest } = props

  const { isLoading, data } = useAssayList()

  const { formatMessage } = useI18n()

  const options = useMemo(() => data?.filter(item => isMatch(item, filters)), [data, filters])

  return (
    <AspectSelect
      {...rest}
      multiple
      label={formatMessage(messages.assay)}
      options={options}
      isLoading={isLoading}
      itemToString={i => formatMessage(assay[i?.i18nKey])}
    />
  )
}

export default AssayMultiSelect
