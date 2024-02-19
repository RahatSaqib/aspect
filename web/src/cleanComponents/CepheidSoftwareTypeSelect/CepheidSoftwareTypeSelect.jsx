import React from 'react'
import AspectSelect from '../AspectSelect'

export default function CepheidSoftwareTypeSelect(props) {
  const options = [
    { label: 'GeneXpert', value: 'GENEXPERT' },
    { label: 'Infinity', value: 'INFINITY' },
    { label: 'GeneXpert Xpress', value: 'GENEXPERT_XPRESS' },
    { label: 'GeneXpert DX', value: 'GENEXPERT_DX' },
    { label: 'GeneXpert Edge', value: 'GENEXPERT_EDGE' },
    { label: 'Cepheid Nexus', value: 'CEPHEID_NEXSYS_IUO' },
  ]

  return <AspectSelect options={options} itemToString={i => i?.label ?? ''} {...props} />
}
