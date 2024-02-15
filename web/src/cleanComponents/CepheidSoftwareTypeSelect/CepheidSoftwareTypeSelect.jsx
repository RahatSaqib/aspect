import React from 'react'
import AspectSelect from '../AspectSelect'

export default function CepheidSoftwareTypeSelect(props) {
  const options = [
    { label: 'GENEXPERT', value: 'GENEXPERT' },
    { label: 'INFINITY', value: 'INFINITY' },
    { label: 'GENEXPERT_XPRESS', value: 'GENEXPERT_XPRESS' },
    { label: 'GENEXPERT_DX', value: 'GENEXPERT_DX' },
    { label: 'GENEXPERT_EDGE', value: 'GENEXPERT_EDGE' },
    { label: 'CEPHEID_NEXSYS_IUO', value: 'CEPHEID_NEXSYS_IUO' },
  ]
  return <AspectSelect options={options} itemToString={i => i?.label ?? ''} {...props} />
}
