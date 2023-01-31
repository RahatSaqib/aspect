import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import useI18n from '../../../../hooks/useI18n'
import CovidResultGraph from '../../../../oldPages/dashboard/Graphs/CovidResultGraph'
import PkPage from '../../components/PkPage'
import messages from '../../PkDashboard.Messages'

const CovidGraphPage = () => {
  const { formatMessage } = useI18n()

  const assaysImmutable = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysImmutable.toJS(), [assaysImmutable])

  return (
    <PkPage title={formatMessage(messages.covid)}>
      <CovidResultGraph assaysFromState={assays} />
    </PkPage>
  )
}

export default CovidGraphPage
