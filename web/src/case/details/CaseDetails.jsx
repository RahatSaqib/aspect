import React from 'react'
import { FaNotesMedical } from 'react-icons/fa'

import Shell from '../../MigratedComponents/Shell'
import ShellHeader from '../../MigratedComponents/Shell/Header'
import ShellContent from '../../MigratedComponents/Shell/Content'
import ShellFooter from '../../MigratedComponents/Shell/Footer'

const CaseDetails = () => (
  <Shell>
    <ShellHeader icon={FaNotesMedical} title="Case Details" />
    <ShellContent>&nbsp;</ShellContent>
    <ShellFooter />
  </Shell>
)

export default CaseDetails
