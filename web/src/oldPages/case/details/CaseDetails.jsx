import React from 'react'
import { FaNotesMedical } from 'react-icons/fa'

import Shell from '../../../components/Shell'
import ShellHeader from '../../../components/Shell/Header'
import ShellContent from '../../../components/Shell/Content'
import ShellFooter from '../../../components/Shell/Footer'

const CaseDetails = () => (
  <Shell>
    <ShellHeader icon={FaNotesMedical} title="Case Details" />
    <ShellContent>&nbsp;</ShellContent>
    <ShellFooter />
  </Shell>
)

export default CaseDetails
