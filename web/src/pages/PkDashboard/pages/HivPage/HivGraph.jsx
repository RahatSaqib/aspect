import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import useI18n from '../../../../hooks/useI18n'
import HivResultsGraph from '../../../../oldPages/dashboard/Graphs/HivResultsGraph'
import PkPage from '../../components/PkPage'
import messages from '../../PkDashboard.Messages'

const HivGraphPage = () => {
  const { formatMessage } = useI18n()

  const assaysImmutable = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysImmutable.toJS(), [assaysImmutable])

  return (
    <PkPage title={formatMessage(messages.hiv)}>
      <HivResultsGraph assaysFromState={assays} />
    </PkPage>
  )
}

export default HivGraphPage
