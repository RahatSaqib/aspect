import React, { useMemo } from 'react'
import isMatch from 'lodash/isMatch'
import { useIntl } from 'react-intl'
import useAssayList from '../../hooks/assay/useAssayList'
import { assay } from '../../messages'
import messages from '../../messages/FilterMessages'
import AspectSelect from '../AspectSelect'

function AssayMultiSelect(props) {
  const { filters, label, ...rest } = props

  const { isLoading, data } = useAssayList()

  const { formatMessage } = useIntl()

  const options = useMemo(() => data?.filter(item => isMatch(item, filters)), [data, filters])

  return (
    <AspectSelect
      {...rest}
      multiple
      label={label || formatMessage(messages.assay)}
      options={options}
      isLoading={isLoading}
      itemToString={i => formatMessage(assay[i?.i18nKey])}
    />
  )
}

export default AssayMultiSelect
