import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'

import BarGraph from './Graphs/BarGraph'
import PieGraph from './Graphs/PieGraph'

import ClinicalIndicatorsContainer from './ClinicalIndicatorsContainer'

import assayConfiguration from './assayConfiguration'

const cssClassesStatus = classnames.bind(require('../Status.css'))

export const ClinicalIndicators = ({ intl, assays: assaysFromState }) => {
  const [assays, setAssays] = useState(false)
  const [months] = useState(5)

  useEffect(() => {
    if (!assays) {
      const whiteListedAssays = assayConfiguration(
        intl,
        assaysFromState,
        BarGraph,
        PieGraph
      )

      return whiteListedAssays && whiteListedAssays.length
        ? setAssays(whiteListedAssays)
        : setAssays(false)
    }
  }, [assays, assaysFromState, intl, months])

  return assays
    ? assays.map(assay => {
        const { name } = assay
        return (
          <ClinicalIndicatorsContainer
            title={name}
            className={cssClassesStatus('Section--withStatus')}
            assay={assay}
            intl={intl}
          />
        )
      })
    : null
}

export default ClinicalIndicators
