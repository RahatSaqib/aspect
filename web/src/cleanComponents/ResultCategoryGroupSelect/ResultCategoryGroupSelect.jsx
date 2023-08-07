import React from 'react'
import useResultCategoryGroup from '../../hooks/result/useResultCategoryGroup'
import AspectSelect from '../AspectSelect'

const ResultCategoryGroupSelect = props => {
  const { assayId, ...rest } = props
  const { isLoading, data: resultCategoryGroups } = useResultCategoryGroup(assayId, {
    enabled: assayId?.length > 0,
  })

  return (
    <AspectSelect
      {...rest}
      isLoading={isLoading}
      options={resultCategoryGroups ?? []}
      multiple
      groupBy={option => option.assayName}
      itemToString={i => i?.name ?? ''}
    />
  )
}

export default ResultCategoryGroupSelect
