import React from 'react'
import AspectSelect from '../AspectSelect'

export default function CepheidInstrumentModelSelect(props) {
  const options = [
    { label: 'GX', value: 'GX' },
    { label: 'GX_EDGE', value: 'GX_EDGE' },
    { label: 'GX_OMNI', value: 'GX_OMNI' },
    { label: 'GX_XPRESS', value: 'GX_XPRESS' },
    { label: 'GX-I', value: 'GX-I' },
    { label: 'GX-II', value: 'GX-II' },
    { label: 'GX-IV', value: 'GX-IV' },
    { label: 'GX-XVI', value: 'GX-XVI' },
    { label: 'GX-INFINITY_48', value: 'GX-INFINITY_48' },
    { label: 'GX-INFINITY_80', value: 'GX-INFINITY_80' },
  ]
  return <AspectSelect options={options} itemToString={i => i?.label ?? ''} {...props} />
}
