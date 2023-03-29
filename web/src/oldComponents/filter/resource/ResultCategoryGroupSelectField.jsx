import React, { useEffect, useState } from 'react'
import { MenuItem } from '@mui/material'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import RESULT_CATEGORY_GROUP_SELECT_LIST from '../../../components/QueryFetch/ResultCategoryGroup'
import useI18n from '../../../hooks/useI18n'
import { types } from '../../../store/ResultCategoryGroupSelectFieldRedux'
import SelectField from '../../shared/SelectField'
import styles from '../popover/styles.css'

const cssClasses = classnames.bind(styles)

const ResultCategoryGroupSelectField = ({ onResultCategoryGroupChange, value, assayId, allItemText, ...restProps }) => {
  const { formatMessage } = useI18n()
  const dispatch = useDispatch()
  const [resultCategoryGroups, setResultCategoryGroups] = useState(false)

  const { data, isError } = useQuery([RESULT_CATEGORY_GROUP_SELECT_LIST.KEY, assayId], async () =>
    fetchWrapperForQueries({
      endpoint: RESULT_CATEGORY_GROUP_SELECT_LIST.ENDPOINT,
      params: { assayId },
    })
  )

  useEffect(() => {
    if (data && !isError) {
      const items = data.data
      setResultCategoryGroups(items)
      dispatch({ type: types.RECEIVE_RESULT_CATEGORY_GROUP, items, lastRefreshed: new Date() })
    }
  }, [data, dispatch, isError])

  return (
    <SelectField {...restProps} value={value} onChange={e => onResultCategoryGroupChange(e.target.value)}>
      {resultCategoryGroups
        ? resultCategoryGroups.map(({ externalId, name, i18nKey }) => (
            <MenuItem key={externalId} value={externalId}>
              <div className={cssClasses('Control__inner')}>{formatMessage(messages[i18nKey], name)}</div>
            </MenuItem>
          ))
        : null}
    </SelectField>
  )
}

export const messages = defineMessages({
  gxEbolaGPDetectedNPDetected: {
    id: 'pages.filters.gxEbolaGPDetectedNPDetected',
    defaultMessage: 'GP Detected - NP Detected',
  },
  gxEbolaGPDetected: {
    id: 'pages.filters.gxEbolaGPDetected',
    defaultMessage: 'GP Detected',
  },
  gxEbolaNPDetected: {
    id: 'pages.filters.gxEbolaNPDetected',
    defaultMessage: 'NP Detected',
  },
  gxEbolaGPNotDetectedNPNotDetected: {
    id: 'pages.filters.gxEbolaGPNotDetectedNPNotDetected',
    defaultMessage: 'GP Not Detected - NP Not Detected',
  },
  gxEbolaGPNotDetectedNPDetected: {
    id: 'pages.filters.gxEbolaGPNotDetectedNPDetected',
    defaultMessage: 'GP Not Detected - NP Detected',
  },
  gxEbolaGPDetectedNPNotDetected: {
    id: 'pages.filters.gxEbolaGPDetectedNPNotDetected',
    defaultMessage: 'GP Detected - NP Not Detected',
  },
  gxEbolaGPInvalid: {
    id: 'pages.filters.gxEbolaGPInvalid',
    defaultMessage: 'GP Invalid',
  },
  gxEbolaGPError: {
    id: 'pages.filters.gxEbolaGPError',
    defaultMessage: 'Error',
  },
  gxEbolaGPNoResult: {
    id: 'pages.filters.gxEbolaGPNoResult',
    defaultMessage: 'GP No Result',
  },
  gxMtbRifMtbNotDetected: {
    id: 'pages.filters.gxMtbRifMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbRifMtbDetected: {
    id: 'pages.filters.gxMtbRifMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbRifMtbDetectedRifDetected: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifDetected',
    defaultMessage: 'MTB Detected RIF Detected',
  },
  gxMtbRifMtbDetectedRifNotDetected: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifNotDetected',
    defaultMessage: 'MTB Detected RIF Not Detected',
  },
  gxMtbRifMtbDetectedRifIndeterminate: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifIndeterminate',
    defaultMessage: 'MTB Detected RIF Indeterminate',
  },
  gxMtbRifMtbInvalid: {
    id: 'pages.filters.gxMtbRifMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbRifMtbError: {
    id: 'pages.filters.gxMtbRifMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbRifMtbNoResult: {
    id: 'pages.filters.gxMtbRifMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  GxMtbRifMTBErrorRifError: {
    id: 'pages.filters.GxMtbRifMTBErrorRifError',
    defaultMessage: 'MTB Error Rif Error',
  },
  gxMtbRifUltraMtbNotDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbRifUltraMtbTraceDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbTraceDetected',
    defaultMessage: 'MTB Trace Detected',
  },
  gxMtbRifUltraMtbDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbRifUltraMtbDetectedRifNotDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifNotDetected',
    defaultMessage: 'MTB Detected - Rif Not Detected',
  },
  gxMtbRifUltraMtbDetectedRifDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifDetected',
    defaultMessage: 'MTB Detected - Rif Detected',
  },
  gxMtbRifUltraMtbDetectedRifIndeterminate: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifIndeterminate',
    defaultMessage: 'MTB Detected - Rif Indeterminate',
  },
  gxMtbRifUltraMtbInvalid: {
    id: 'pages.filters.gxMtbRifUltraMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbRifUltraMtbError: {
    id: 'pages.filters.gxMtbRifUltraMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbRifUltraMtbNoResult: {
    id: 'pages.filters.gxMtbRifUltraMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  GxMtbRifUltraMTBTraceDetectedRifIndeterminate: {
    id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
    defaultMessage: 'MTB Trace Detected Rif Indeterminate',
  },
  GxMtbRifUltraMTBTraceDetectedRifNoResult: {
    id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifNoResult',
    defaultMessage: 'MTB Trace Detected Rif No Result',
  },
  gxMtbXdrMtbNotDetected: {
    id: 'pages.filters.gxMtbXdrMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbXdrMtbDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbXdrMtbDetectedXdrDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrDetected',
    defaultMessage: 'MTB Detected XDR Detected',
  },
  gxMtbXdrMtbDetectedXdrNotDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrNotDetected',
    defaultMessage: 'MTB Detected XDR Not Detected',
  },
  gxMtbXdrMtbDetectedXdrIndeterminate: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrIndeterminate',
    defaultMessage: 'MTB Detected XDR Indeterminate',
  },
  gxMtbXdrMtbInvalid: {
    id: 'pages.filters.gxMtbXdrMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbXdrMtbError: {
    id: 'pages.filters.gxMtbXdrMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbXdrMtbNoResult: {
    id: 'pages.filters.gxMtbXdrMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  GxMtbXdrMTBNotDetectedDrugResistanceNotDetected: {
    id: 'pages.filters.GxMtbXdrMTBNotDetectedDrugResistanceNotDetected',
    defaultMessage: 'MTB Not Detected Drug Resistance Not Detected',
  },
  assayGenericDstresultCategoryPositiveMTBresultCategorySusceptible: {
    id: 'assayGenericDstresultCategoryPositiveMTBresultCategorySusceptible',
    defaultMessage: 'MTB Positive MTB Resistance Susceptible',
  },
  assayGenericDstresultCategorySuccessresultCategorySusceptible: {
    id: 'assayGenericDstresultCategorySuccessresultCategorySusceptible',
    defaultMessage: 'MTB Success Resistance Susceptible',
  },
  assayGenericDstResultCategoryDetectedresultCategorySusceptible: {
    id: 'assayGenericDstResultCategoryDetectedresultCategorySusceptible',
    defaultMessage: 'MTB Detected Resistance Susceptible',
  },
  assayGenericDstresultCategoryPositiveMTBresultCategoryResistant: {
    id: 'assayGenericDstresultCategoryPositiveMTBresultCategoryResistant',
    defaultMessage: 'MTB Positive MTB Resistance Resistant',
  },
  assayGenericDstresultCategorySuccessresultCategoryResistant: {
    id: 'assayGenericDstresultCategorySuccessresultCategoryResistant',
    defaultMessage: 'MTB Success Resistance Resistant',
  },
  assayGenericDstResultCategoryDetectedresultCategoryResistant: {
    id: 'assayGenericDstResultCategoryDetectedresultCategoryResistant',
    defaultMessage: 'MTB Detected Resistance Resistant',
  },
  assayGenericDstResultCategoryDetected: {
    id: 'assayGenericDstResultCategoryDetected',
    defaultMessage: 'MTB Detected',
  },
  assayGenericDstresultCategoryNotDetected: {
    id: 'assayGenericDstresultCategoryNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  assayGenericDstresultCategoryInvalid: { id: 'assayGenericDstresultCategoryInvalid', defaultMessage: 'MTB Invalid' },
  assayGenericDstresultCategoryError: { id: 'assayGenericDstresultCategoryError', defaultMessage: 'MTB Error' },
  assayGenericDstresultCategorySuccess: { id: 'assayGenericDstresultCategorySuccess', defaultMessage: 'MTB Success' },
  assayGenericDstresultCategoryMissing: { id: 'assayGenericDstresultCategoryMissing', defaultMessage: 'MTB Missing' },
  assayGenericDstresultCategoryUnknown: { id: 'assayGenericDstresultCategoryUnknown', defaultMessage: 'MTB Unknown' },
  assayGenericDstresultCategoryContaminated: {
    id: 'assayGenericDstresultCategoryContaminated',
    defaultMessage: 'MTB Contaminated',
  },
  assayGenericDstresultCategoryPositiveMOTT: {
    id: 'assayGenericDstresultCategoryPositiveMOTT',
    defaultMessage: 'MTB Positive MOTT',
  },
  assayGenericDstresultCategoryPositiveMTB: {
    id: 'assayGenericDstresultCategoryPositiveMTB',
    defaultMessage: 'MTB Positive MTB',
  },
  assayGenericCultureResultCategoryDetected: {
    id: 'assayGenericCultureResultCategoryDetected',
    defaultMessage: 'Culture Result Detected',
  },
  assayGenericCultureresultCategoryNotDetected: {
    id: 'assayGenericCultureresultCategoryNotDetected',
    defaultMessage: 'Culture Result Not Detected',
  },
  assayGenericCultureresultCategoryInvalid: {
    id: 'assayGenericCultureresultCategoryInvalid',
    defaultMessage: 'Culture Result Invalid',
  },
  assayGenericCultureresultCategoryError: {
    id: 'assayGenericCultureresultCategoryError',
    defaultMessage: 'Culture Result Error',
  },
  assayGenericCultureresultCategorySuccess: {
    id: 'assayGenericCultureresultCategorySuccess',
    defaultMessage: 'Culture Result Success',
  },
  assayGenericCultureresultCategoryMissing: {
    id: 'assayGenericCultureresultCategoryMissing',
    defaultMessage: 'Culture Result Missing',
  },
  assayGenericCultureresultCategoryUnknown: {
    id: 'assayGenericCultureresultCategoryUnknown',
    defaultMessage: 'Culture Result Unknown',
  },
  assayGenericCultureresultCategoryContaminated: {
    id: 'assayGenericCultureresultCategoryContaminated',
    defaultMessage: 'Culture Result Contaminated',
  },
  assayGenericCultureresultCategoryPositiveMOTT: {
    id: 'assayGenericCultureresultCategoryPositiveMOTT',
    defaultMessage: 'Culture Result Positive MOTT',
  },
  assayGenericCultureresultCategoryPositiveMTB: {
    id: 'assayGenericCultureresultCategoryPositiveMTB',
    defaultMessage: 'Culture Result Positive MTB',
  },
  assayLPAresultCategoryPositiveMTBresultCategorySusceptible: {
    id: 'assayLPAresultCategoryPositiveMTBresultCategorySusceptible',
    defaultMessage: 'MTB Positive MTB Resistance Susceptible',
  },
  assayLPAresultCategoryPositiveMTBresultCategoryResistant: {
    id: 'assayLPAresultCategoryPositiveMTBresultCategoryResistant',
    defaultMessage: 'MTB Positive MTB Resistance Resistant',
  },
  assayLPAresultCategoryNotDetected: { id: 'assayLPAresultCategoryNotDetected', defaultMessage: 'MTB Not Detected' },
  assayLPAresultCategoryInvalid: { id: 'assayLPAresultCategoryInvalid', defaultMessage: 'MTB Invalid' },
  assayLPAresultCategoryMissing: { id: 'assayLPAresultCategoryMissing', defaultMessage: 'MTB Missing' },
  assayLPAresultCategoryUnknown: { id: 'assayLPAresultCategoryUnknown', defaultMessage: 'MTB Unknown' },
  assayLPAresultCategoryPositiveMTB: { id: 'assayLPAresultCategoryPositiveMTB', defaultMessage: 'MTB Positive MTB' },
  assaySmearResultCategoryDetected: { id: 'assaySmearResultCategoryDetected', defaultMessage: 'Smear Result Detected' },
  assaySmearresultCategoryNotDetected: {
    id: 'assaySmearresultCategoryNotDetected',
    defaultMessage: 'Smear Result Not Detected',
  },
  assaySmearresultCategoryInvalid: { id: 'assaySmearresultCategoryInvalid', defaultMessage: 'Smear Result Invalid' },
  assaySmearresultCategoryMissing: { id: 'assaySmearresultCategoryMissing', defaultMessage: 'Smear Result Missing' },
  assaySmearresultCategoryUnknown: { id: 'assaySmearresultCategoryUnknown', defaultMessage: 'Smear Result Unknown' },
  assaySmearresultCategoryPositive1: {
    id: 'assaySmearresultCategoryPositive1',
    defaultMessage: 'Smear Result Positive (+)',
  },
  assaySmearresultCategoryPositive2: {
    id: 'assaySmearresultCategoryPositive2',
    defaultMessage: 'Smear Result Positive (++)',
  },
  assaySmearresultCategoryPositive3: {
    id: 'assaySmearresultCategoryPositive3',
    defaultMessage: 'Smear Result Positive (+++)',
  },
})

export default ResultCategoryGroupSelectField
