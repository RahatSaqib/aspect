import React from 'react'
import useSitesToTransfer from '../../hooks/site/useSitesToTransfer'
import AspectSelect from '../AspectSelect'

export default function SitesToTransferSelect(props) {
  const { isLoading: isSitesLoading, data: sites } = useSitesToTransfer()
  return (
    <AspectSelect
      {...props}
      isLoading={isSitesLoading}
      options={sites}
      itemToString={item => (item ? item.name : '')}
    />
  )
}
