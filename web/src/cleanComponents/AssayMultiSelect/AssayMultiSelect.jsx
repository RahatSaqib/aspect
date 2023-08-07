import React, { useMemo } from 'react'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import useAssayList from '../../hooks/assay/useAssayList'
import useI18n from '../../hooks/useI18n'
import { assay } from '../../messages'
import messages from '../../messages/FilterMessages'
import AspectSelect from '../AspectSelect'

export function AssayMultiSelect(props) {
  const { filters, ...rest } = props

  const { isLoading, data } = useAssayList()

  const { formatMessage } = useI18n()

  const options = useMemo(
    () =>
      data?.reduce((prev, c) => {
        let output = c
        Object.entries(omitBy(filters, isNil)).forEach(([name, value]) => {
          if (c[name] !== value) {
            output = []
          }
        })
        return prev.concat(output)
      }, []),
    [data, filters]
  )
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
