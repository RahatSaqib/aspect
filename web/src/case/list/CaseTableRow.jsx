import classnames from 'classnames/bind'
import React from 'react'
import { useIntl } from 'react-intl'
import { formatDate } from '../../shared/utils/dateFormat'
import messages from './caseMessages'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import formatI18nMessage from '../../shared/i18n/formatterWeb'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const CaseTableRow = ({ _case, ...restProps }) => {
  const { formatMessage } = useIntl()

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{formatDate(_case.get('createdOn'))}</TableCell>
      <TableCell>{_case.get('externalId')}</TableCell>
      <TableCell>{_case.get('sampleOriginSite')}</TableCell>
      <TableCell>{_case.get('patientId')}</TableCell>
      <TableCell>
        {formatI18nMessage(
          messages,
          formatMessage,
          _case.get('diseaseI18nKey'),
          _case.get('diseaseName')
        )}
      </TableCell>
      <TableCell>{_case.get('status')}</TableCell>
    </TableRow>
  )
}

export default CaseTableRow
