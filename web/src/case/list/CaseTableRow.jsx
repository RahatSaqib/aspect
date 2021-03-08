import classnames from 'classnames/bind'
import React from 'react'
import { useIntl, defineMessages } from 'react-intl'
import { formatDate } from '../../shared/utils/dateFormat'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const messages = defineMessages({
  diseaseNameTuberculosis: {
    id: 'pages.caseRow.diseaseNameTuberculosis',
    defaultMessage: 'Tuberculosis',
  },
  diseaseNameEbola: {
    id: 'pages.caseRow.diseaseNameEbola',
    defaultMessage: 'Ebola',
  },
  diseaseNameHIVAIDS: {
    id: 'pages.caseRow.diseaseNameHIVAIDS',
    defaultMessage: 'HIV/AIDS',
  },
  diseaseNameHepatitisB: {
    id: 'pages.caseRow.diseaseNameHepatitisB',
    defaultMessage: 'Hepatitis B',
  },
  diseaseNameHepatitisC: {
    id: 'pages.caseRow.diseaseNameHepatitisC',
    defaultMessage: 'Hepatitis C',
  },
  diseaseNameZikaFever: {
    id: 'pages.caseRow.diseaseNameZikaFever',
    defaultMessage: 'Zika Fever',
  },
  diseaseNameDengueFever: {
    id: 'pages.caseRow.diseaseNameDengueFever',
    defaultMessage: 'Dengue Fever',
  },
  diseaseNameCovid19: {
    id: 'pages.caseRow.diseaseNameCovid19',
    defaultMessage: 'SARS-CoV-2 (COVID-19)',
  },
})

const CaseTableRow = ({ _case, ...restProps }) => {
  const { formatMessage } = useIntl()

  const formatI18n = (key, defaultMessage) =>
    messages[_case.get(key)]
      ? formatMessage(messages[_case.get(key)])
      : _case.get(defaultMessage)
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{formatDate(_case.get('createdOn'))}</TableCell>
      <TableCell>{_case.get('externalId')}</TableCell>
      <TableCell>{_case.get('sampleOriginSite')}</TableCell>
      <TableCell>{_case.get('patientId')}</TableCell>
      <TableCell>{formatI18n('diseaseI18nKey', 'diseaseName')}</TableCell>
      <TableCell>{_case.get('status')}</TableCell>
    </TableRow>
  )
}

export default CaseTableRow
