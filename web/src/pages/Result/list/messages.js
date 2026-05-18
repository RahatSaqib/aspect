import { defineMessages } from 'react-intl'
import { resultCategory, resultCategoryType, resultTreatmentStatusMessages } from '../../../messages'

const messages = {
  ...resultTreatmentStatusMessages,
  ...defineMessages({
    resultsTitle: {
      id: 'pages.ResultList.title',
      defaultMessage: 'Results',
    },
    newResult: {
      id: 'pages.ResultList.newResult',
      defaultMessage: 'New Result',
    },
    endedOn: {
      id: 'pages.ResultList.EndedOn',
      defaultMessage: 'Test Date',
    },
    deviceName: {
      id: 'pages.ResultList.deviceName',
      defaultMessage: 'Device',
    },
    sampleOriginSiteName: {
      id: 'pages.ResultList.sampleOriginSiteName',
      defaultMessage: 'Sample Collection Site',
    },
    sampleId: {
      id: 'pages.ResultList.sampleId',
      defaultMessage: 'Sample ID',
    },
    assayName: {
      id: 'pages.ResultList.assayName',
      defaultMessage: 'Assay',
    },
    errorCode: {
      id: 'pages.ResultList.errorCode',
      defaultMessage: 'Error Code',
    },
    resultText: {
      id: 'pages.ResultList.resultText',
      defaultMessage: 'Result',
    },
    collectionOfResults: {
      id: 'pages.ResultList.collectionOfResults',
      defaultMessage: 'Collection of Results',
    },
    resultTreatmentStatus: {
      id: 'pages.ResultList.resultTreatmentStatus',
      defaultMessage: 'Treatment Status',
    },
    assayId: {
      id: 'pages.ResultList.assayId',
      defaultMessage: 'Assay',
    },
    patientId: {
      id: 'pages.ResultList.patientId',
      defaultMessage: 'Patient ID',
    },
    resultCategoryMtb: {
      id: 'pages.ResultList.resultCategoryMtb',
      defaultMessage: 'MTB',
    },
    resultCategoryRif: {
      id: 'pages.ResultList.resultCategoryRif',
      defaultMessage: 'Rif',
    },
    resultCategoryHcv: {
      id: 'pages.ResultList.resultCategoryHcv',
      defaultMessage: 'HCV',
    },
    resultCategoryEbolaGp: {
      id: 'pages.ResultList.resultCategoryEbolaGp',
      defaultMessage: 'GP',
    },
    resultCategoryEbolaNp: {
      id: 'pages.ResultList.resultCategoryEbolaNp',
      defaultMessage: 'NP',
    },
    resultCategoryCovid19: {
      id: 'pages.ResultList.resultCategoryCovid19',
      defaultMessage: 'Covid',
    },
    resultCategoryCOVID19RegionN: {
      id: 'pages.ResultList.resultCategoryCOVID19RegionN',
      defaultMessage: 'Region n',
    },
    resultCategoryDrugResistance: {
      id: 'pages.ResultList.resultCategoryDrugResistance',
      defaultMessage: 'Drug Resistance',
    },
    resultCategoryHiv: {
      id: 'pages.ResultList.resultCategoryHiv',
      defaultMessage: 'HIV',
    },
    resultCategoryHivVl: {
      id: 'pages.ResultList.resultCategoryHivVl',
      defaultMessage: 'HIV',
    },
    resultCategoryEid: {
      id: 'pages.ResultList.resultCategoryEid',
      defaultMessage: 'EID',
    },
    resultCategoryCopiesMl: {
      id: 'pages.ResultList.resultCategoryHivCopiesMl',
      defaultMessage: 'Copies/ML',
    },
    resultCategoryCultureResult: {
      id: 'pages.ResultList.resultCategoryCultureResult',
      defaultMessage: 'Culture',
    },
    resultCategory1Name: {
      id: 'pages.ResultList.resultCategory1Name',
      defaultMessage: 'Category',
    },
    resultCategoryFinalResult: {
      id: 'pages.ResultList.resultCategoryFinalResult',
      defaultMessage: 'Final Result',
    },
    resultCategoryResistance: {
      id: 'pages.ResultList.resultCategoryResistance',
      defaultMessage: 'Resistance',
    },
    resultCategoryResult: {
      id: 'pages.ResultList.resultCategoryResult',
      defaultMessage: 'Result',
    },
    resultCategoryStatus: {
      id: 'pages.ResultList.resultCategoryStatus',
      defaultMessage: 'Status',
    },
    resultCategory2Name: {
      id: 'pages.ResultList.resultCategory2Name',
      defaultMessage: 'Category 2',
    },
    paginatorStatus: {
      id: 'pages.ResultList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# result}
        other {# results}
      }`,
    },
    paginatorStatusLoading: {
      id: 'pages.ResultList.paginatorStatusLoading',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of (loading total...)`,
    },
    assayBdMgitAst: {
      id: 'pages.ResultList.assayBdMgitAst',
      defaultMessage: 'BD MGIT AST',
    },
    assayBdMgitGnd: {
      id: 'pages.ResultList.assayBdMgitGnd',
      defaultMessage: 'BD MGIT GND',
    },
    assayGenoTypeMTBCV1: {
      id: 'pages.ResultList.assayGenoTypeMTBCV1',
      defaultMessage: 'GenoType MTBC VER 1.X',
    },
    assayGenoTypeMTBDRplusV2: {
      id: 'pages.ResultList.assayGenoTypeMTBDRplusV2',
      defaultMessage: 'GenoType MTBDRplus VER 2.0',
    },
    assayGenoTypeMTBDRslV1: {
      id: 'pages.ResultList.assayGenoTypeMTBDRslV1',
      defaultMessage: 'GenoType MTBDRsl VER 1.0',
    },
    assayGenoTypeMTBDRslV2: {
      id: 'pages.ResultList.assayGenoTypeMTBDRslV2',
      defaultMessage: 'GenoType MTBDRsl VER 2.0',
    },
    assaySenaiteLIMSSmearMicroscopy: {
      id: 'pages.ResultList.assaySenaiteLIMSSmearMicroscopy',
      defaultMessage: 'Senaite LIMS Smear Microscopy',
    },
    assaySenaiteLIMSTbCulture: {
      id: 'pages.ResultList.assaySenaiteLIMSTbCulture',
      defaultMessage: 'Senaite LIMS TB Culture',
    },
    assaySenaiteLIMSUnknown: {
      id: 'pages.ResultList.assaySenaiteLIMSUnknown',
      defaultMessage: 'Senaite LIMS Unknown',
    },
    assayGeneXpertUnknown: {
      id: 'pages.ResultList.assayGeneXpertUnknown',
      defaultMessage: 'GeneXpert Unknown',
    },
    assayGeneXpertHcv: {
      id: 'pages.ResultList.assayGeneXpertHcv',
      defaultMessage: 'GeneXpert HCV',
    },
    assayGeneXpertMtbRif: {
      id: 'pages.ResultList.assayGeneXpertMtbRif',
      defaultMessage: 'GeneXpert MTB/Rif',
    },
    assayGeneXpertMtbXdr: {
      id: 'pages.ResultList.assayGeneXpertMtbXdr',
      defaultMessage: 'GeneXpert MTB/XDR',
    },
    assayGeneXpertMtbRifUltra: {
      id: 'pages.ResultList.assayGeneXpertMtbRifUltra',
      defaultMessage: 'GeneXpert MTB/Rif Ultra',
    },
    assayGeneXpertHiv1Vl: {
      id: 'pages.ResultList.assayGeneXpertHiv1Vl',
      defaultMessage: 'GeneXpert HIV-1 VL',
    },
    assayGeneXpertHiv1Qual: {
      id: 'pages.ResultList.assayGeneXpertHiv1Qual',
      defaultMessage: 'GeneXpert HIV-1 Qual',
    },
    assayGeneXpertEbola: {
      id: 'pages.ResultList.assayGeneXpertEbola',
      defaultMessage: 'GeneXpert Ebola',
    },
    assayGXCovid19: {
      id: 'pages.ResultList.assayGXCovid19',
      defaultMessage: 'GeneXpert COVID-19',
    },
    assayTruenatMtb: {
      id: 'pages.ResultList.assayTruenatMtb',
      defaultMessage: 'Truenat® MTB',
    },
    assayTruenatMtbPlus: {
      id: 'pages.ResultList.assayTruenatMtbPlus',
      defaultMessage: 'Truenat® MTB Plus',
    },
    assayTruenatRif: {
      id: 'pages.ResultList.assayTruenatRif',
      defaultMessage: 'Truenat® MTB-RIF Dx',
    },
    assayTruenatUnknown: {
      id: 'pages.ResultList.assayTruenatUnknown',
      defaultMessage: 'Truenat® Unknown Test Type',
    },
    assayLPA: {
      id: 'pages.ResultList.assayLPA',
      defaultMessage: 'LPA',
    },
    assaySmear: {
      id: 'pages.ResultList.assaySmear',
      defaultMessage: 'Smear',
    },
    assayCulture: {
      id: 'pages.ResultList.assayCulture',
      defaultMessage: 'Culture',
    },
    assayGenericDst: {
      id: 'pages.ResultList.assayGenericDst',
      defaultMessage: 'DST',
    },
    assayGenericCovid19: {
      id: 'pages.ResultList.assayGenericCovid19',
      defaultMessage: 'Covid 19',
    },
    assayMP96Covid19: {
      id: 'pages.ResultList.assayMP96Covid19',
      defaultMessage: 'MagNA Pure-96 COVID-19',
    },
    assayQS7Covid19: {
      id: 'pages.ResultList.assayQS7Covid19',
      defaultMessage: 'QuantStudio7 Flex COVID-19',
    },
    assayTbLamp: {
      id: 'pages.ResultList.assayTbLamp',
      defaultMessage: 'TB LAMP',
    },
    notProvided: {
      id: 'pages.ResultList.notProvided',
      defaultMessage: 'Not provided',
    },
    ...resultCategory,
    ...resultCategoryType,
  }),
}

export default messages
