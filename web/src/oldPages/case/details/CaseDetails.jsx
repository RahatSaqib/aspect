import React from 'react'
import { FaNotesMedical } from 'react-icons/fa'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'

const CaseDetails = () => (
  <Shell>
    <ShellHeader icon={FaNotesMedical} title="Case Details" />
    <ShellContent>&nbsp;</ShellContent>
    <ShellFooter />
  </Shell>
)

export default CaseDetails
