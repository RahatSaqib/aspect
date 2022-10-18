/* eslint-disable linebreak-style */
import { defineMessages } from 'react-intl'
import { deviceStatusMessages } from '../../messages'

export const messages = {
  ...deviceStatusMessages,
  ...defineMessages({
    statusUnknownLegend: {
      id: 'legends.Unknown.hover',
      defaultMessage:
        "The device hasn't connected to Aspect for several days. It may be running tests, but the tests aren't uploaded to Aspect yet.",
    },
    // assays
    assayAbbottM2000PlasmaHivVL: {
      id: 'legends.Unknown.assayAbbottM2000PlasmaHivVL',
      defaultMessage: 'Abbott m2000 Plasma HIV VL',
    },

    assayAbbottM2000PlasmaHbvVL: {
      id: 'legends.Unknown.assayAbbottM2000PlasmaHbvVL',
      defaultMessage: 'Abbott m2000 Plasma HBV VL',
    },
    assayAbbottM2000DBSHivVL: {
      id: 'legends.Unknown.assayAbbottM2000DBSHivVL',
      defaultMessage: 'Abbott m2000 DBS HIV VL',
    },
    assayAbbottM2000HIVEID: {
      id: 'legends.Unknown.assayAbbottM2000HIVEID',
      defaultMessage: 'Abbott m2000 HIV EID',
    },
    assayAbbottM2000DaanNCOVID19: {
      id: 'legends.Unknown.assayAbbottM2000DaanNCOVID19',
      defaultMessage: 'Abbott m2000 Daan N COVID-19',
    },
    assayBdMgitAst: {
      id: 'legends.Unknown.assayBdMgitAst',
      defaultMessage: 'BD MGIT AST',
    },
    assayBdMgitGnd: {
      id: 'legends.Unknown.assayBdMgitGnd',
      defaultMessage: 'BD MGIT GND',
    },
    assayGenericDst: {
      id: 'legends.Unknown.assayGenericDst',
      defaultMessage: 'TB DST',
    },
    assayGenericCulture: {
      id: 'legends.Unknown.assayGenericCulture',
      defaultMessage: 'Culture',
    },
    assayGenoTypeMTBCV1: {
      id: 'legends.Unknown.assayGenoTypeMTBCV1',
      defaultMessage: 'GenoType MTBC VER 1.X',
    },
    assayGenoTypeMTBDRplusV2: {
      id: 'legends.Unknown.assayGenoTypeMTBDRplusV2',
      defaultMessage: 'GenoType MTBDRplus VER 2.0',
    },
    assayGenoTypeMTBDRslV1: {
      id: 'legends.Unknown.assayGenoTypeMTBDRslV1',
      defaultMessage: 'GenoType MTBDRsl VER 1.0',
    },
    assayGenoTypeMTBDRslV2: {
      id: 'legends.Unknown.assayGenoTypeMTBDRslV2',
      defaultMessage: 'GenoType MTBDRsl VER 2.0',
    },
    assayGeneXpertMtbRif: {
      id: 'legends.Unknown.assayGeneXpertMtbRif',
      defaultMessage: 'GeneXpert MTB/Rif',
    },
    assayGeneXpertMtbXdr: {
      id: 'legends.Unknown.assayGeneXpertMtbXdr',
      defaultMessage: 'GeneXpert MTB/XDR',
    },
    assayGeneXpertMtbRifUltra: {
      id: 'legends.Unknown.assayGeneXpertMtbRifUltra',
      defaultMessage: 'GeneXpert MTB/Rif Ultra',
    },
    assayGeneXpertHiv1Vl: {
      id: 'legends.Unknown.assayGeneXpertHiv1Vl',
      defaultMessage: 'GeneXpert HIV-1 VL',
    },
    assayGeneXpertHiv1Qual: {
      id: 'legends.Unknown.assayGeneXpertHiv1Qual',
      defaultMessage: 'GeneXpert HIV-1 Qual',
    },
    assayGeneXpertEbola: {
      id: 'legends.Unknown.assayGeneXpertEbola',
      defaultMessage: 'GeneXpert Ebola',
    },
    assayGeneXpertUnknown: {
      id: 'legends.Unknown.assayGeneXpertUnknown',
      defaultMessage: 'GeneXpert Unknown',
    },
    assayGeneXpertHcv: {
      id: 'legends.Unknown.assayGeneXpertHcv',
      defaultMessage: 'GeneXpert HCV',
    },
    assayTruenatMtb: {
      id: 'legends.Unknown.assayTruenatMtb',
      defaultMessage: 'Truenat® MTB',
    },
    assayTruenatMtbPlus: {
      id: 'legends.Unknown.assayTruenatMtbPlus',
      defaultMessage: 'Truenat® MTB Plus',
    },
    assayTruenatRif: {
      id: 'legends.Unknown.assayTruenatRif',
      defaultMessage: 'Truenat® MTB-RIF Dx',
    },
    assayTruenatUnknown: {
      id: 'legends.Unknown.assayTruenatUnknown',
      defaultMessage: 'Truenat® Unknown Test Type',
    },
    QHivVL: {
      id: 'legends.Unknown.QHivVL',
      defaultMessage: 'Q HIV VL',
    },
    ReporterHivVL: {
      id: 'legends.Unknown.ReporterHivVL',
      defaultMessage: 'Reporter HIV VL',
    },
    ReporterEID: {
      id: 'legends.Unknown.ReporterEID',
      defaultMessage: 'Reporter EID',
    },
    assayAlereQHiv12Detect: {
      id: 'legends.Unknown.assayAlereQHiv12Detect',
      defaultMessage: 'Alere Q HIV-1/2 Detect',
    },
    assayAlereQHiv12VLPlasma: {
      id: 'legends.Unknown.assayAlereQHiv12VLPlasma',
      defaultMessage: 'Alere Q HIV-1/2 VL plasma',
    },
    senaiteSmearMicroscopy: {
      id: 'legends.Unknown.senaiteSmearMicroscopy',
      defaultMessage: 'Senaite LIMS Smear Microscopy',
    },
    senaiteTbCulture: {
      id: 'legends.Unknown.senaiteTbCulture',
      defaultMessage: 'Senaite LIMS TB Culture',
    },
    senaiteUnknown: {
      id: 'legends.Unknown.senaiteUnknown',
      defaultMessage: 'Senaite LIMS Unknown',
    },
    assayCobasHivVl: {
      id: 'legends.Unknown.assayCobasHivVl',
      defaultMessage: 'COBAS 4800 VL',
    },
    assayGenericCovid19: {
      id: 'legends.Unknown.assayGenericCovid19',
      defaultMessage: 'COVID-19 Generic Test',
    },
    assayMP96Covid19: {
      id: 'legends.Unknown.assayMP96Covid19',
      defaultMessage: 'MagNA Pure-96 COVID-19',
    },
    assayQS7Covid19: {
      id: 'legends.Unknown.assayQS7Covid19',
      defaultMessage: 'QuantStudio7 Flex COVID-19',
    },
    assayGXCovid19: {
      id: 'legends.Unknown.assayGXCovid19',
      defaultMessage: 'GeneXpert COVID-19',
    },
    // Result categories.
    ResultCategoryDetected: {
      id: 'legends.Unknown.ResultCategoryDetected',
      defaultMessage: 'Detected',
    },
    ResultCategoryTraceDetected: {
      id: 'legends.Unknown.ResultCategoryTraceDetected',
      defaultMessage: 'Trace Detected',
    },
    resultCategoryNotDetected: {
      id: 'legends.Unknown.resultCategoryNotDetected',
      defaultMessage: 'Not Detected',
    },
    resultCategoryIndeterminate: {
      id: 'legends.Unknown.resultCategoryIndeterminate',
      defaultMessage: 'Indeterminate',
    },
    resultCategoryInvalid: {
      id: 'legends.Unknown.resultCategoryInvalid',
      defaultMessage: 'Invalid',
    },
    resultCategoryNoResult: {
      id: 'legends.Unknown.resultCategoryNoResult',
      defaultMessage: 'No result',
    },
    resultCategoryError: {
      id: 'legends.Unknown.resultCategoryError',
      defaultMessage: 'Error',
    },
    resultCategorySuccess: {
      id: 'legends.Unknown.resultCategorySuccess',
      defaultMessage: 'Success',
    },
    resultCategoryCollectNewSample: {
      id: 'legends.Unknown.resultCategoryCollectNewSample',
      defaultMessage: 'Collect new sample',
    },
    resultCategoryDiscordant: {
      id: 'legends.Unknown.resultCategoryDiscordant',
      defaultMessage: 'Discordant',
    },
    resultCategoryLessThan40: {
      id: 'legends.Unknown.resultCategoryLessThan40',
      defaultMessage: 'Less Than 40 cp/mL',
    },
    resultCategoryMoreThan40: {
      id: 'legends.Unknown.resultCategoryMoreThan40',
      defaultMessage: 'More Than 40 cp/mL',
    },
    resultCategoryLessThan150: {
      id: 'legends.Unknown.resultCategoryLessThan150',
      defaultMessage: 'Less Than 150 cp/mL',
    },
    resultCategoryMoreThan150: {
      id: 'legends.Unknown.resultCategoryMoreThan150',
      defaultMessage: 'More Than 150 cp/mL',
    },
    resultCategoryLessThan550: {
      id: 'legends.Unknown.resultCategoryLessThan550',
      defaultMessage: 'Less Than 550 cp/mL',
    },
    resultCategoryMoreThan550: {
      id: 'legends.Unknown.resultCategoryMoreThan550',
      defaultMessage: 'More Than 550 cp/mL',
    },
    resultCategoryLessThan1000: {
      id: 'legends.Unknown.resultCategoryLessThan1000',
      defaultMessage: 'Less Than 1000 cp/mL',
    },
    resultCategoryMoreThan1000: {
      id: 'legends.Unknown.resultCategoryMoreThan1000',
      defaultMessage: 'More Than 1000 cp/mL',
    },
    resultCategoryRejected: {
      id: 'legends.Unknown.resultCategoryRejected',
      defaultMessage: 'Rejected',
    },
    resultCategoryMissing: {
      id: 'legends.Unknown.resultCategoryMissing',
      defaultMessage: 'Missing',
    },
    resultCategoryUnknown: {
      id: 'legends.Unknown.resultCategoryUnknown',
      defaultMessage: 'Unknown',
    },
    resultCategorySusceptible: {
      id: 'legends.Unknown.resultCategorySusceptible',
      defaultMessage: 'Susceptible',
    },
    resultCategoryResistant: {
      id: 'legends.Unknown.resultCategoryResistant',
      defaultMessage: 'Resistant',
    },
    resultCategoryNegative: {
      id: 'legends.Unknown.resultCategoryNegative',
      defaultMessage: 'Negative',
    },
    resultCategoryPositive1: {
      id: 'legends.Unknown.resultCategoryPositive1',
      defaultMessage: 'Positive 1',
    },
    resultCategoryPositive2: {
      id: 'legends.Unknown.resultCategoryPositive2',
      defaultMessage: 'Positive 2',
    },
    resultCategoryPositive3: {
      id: 'legends.Unknown.resultCategoryPositive3',
      defaultMessage: 'Positive 3',
    },
    resultCategoryScanty: {
      id: 'legends.Unknown.resultCategoryScanty',
      defaultMessage: 'Scanty',
    },
    resultCategoryContaminated: {
      id: 'legends.Unknown.resultCategoryContaminated',
      defaultMessage: 'Contaminated',
    },
    resultCategoryPositiveMOTT: {
      id: 'legends.Unknown.resultCategoryPositiveMOTT',
      defaultMessage: 'Positive MOTT',
    },
    resultCategoryPositiveMTB: {
      id: 'legends.Unknown.resultCategoryPositiveMTB',
      defaultMessage: 'Positive MTB',
    },
    resultCategoryInconclusive: {
      id: 'legends.Unknown.resultCategoryInconclusive',
      defaultMessage: 'Inconclusive',
    },
    resultCategoryPositive: {
      id: 'legends.Unknown.resultCategoryPositive',
      defaultMessage: 'Positive',
    },
    resultCategoryPresumptivePositive: {
      id: 'legends.Unknown.resultCategoryPresumptivePositive',
      defaultMessage: 'Presumptive Positive',
    },
    // treatment
    Confirmed: {
      id: 'legends.Unknown.Confirmed',
      defaultMessage: 'Confirmed',
    },
    NotConfirmed: {
      id: 'legends.Unknown.NotConfirmed',
      defaultMessage: 'Not Confirmed',
    },
    // inventory statuses
    outOfStock: {
      id: 'legends.Unknown.outOfStock',
      defaultMessage: 'Out of Stock',
    },
    upTo14: {
      id: 'legends.Unknown.upTo14',
      defaultMessage: '1-14 Days',
    },
    upTo30: {
      id: 'legends.Unknown.upTo30',
      defaultMessage: '15-30 Days',
    },
    upTo90: {
      id: 'legends.Unknown.upTo90',
      defaultMessage: '1-3 Months',
    },
    upTo180: {
      id: 'legends.Unknown.upTo180',
      defaultMessage: '4-6 Months',
    },

    moreThan180: {
      id: 'legends.Unknown.moreThan180',
      defaultMessage: '>6 Months',
    },
    notRecorded: {
      id: 'legends.Unknown.notRecorded',
      defaultMessage: 'Not Recorded',
    },
    noConsumption: {
      id: 'legends.Unknown.noConsumption',
      defaultMessage: 'No Consumption',
    },
    location: {
      id: 'legends.Unknown.location',
      defaultMessage: 'Location',
    },
    devices: {
      id: 'legends.Unknown.devices',
      defaultMessage: 'Devices',
    },
    device: {
      id: 'legends.Unknown.device',
      defaultMessage: 'Device',
    },
    assayTbLamp: {
      id: 'legends.Unknown.assayTbLamp',
      defaultMessage: 'TB LAMP',
    },
    assaySmear: {
      id: 'legends.Unknown.assaySmear',
      defaultMessage: 'Smear',
    },
    assayLPA: {
      id: 'legends.Unknown.assayLPA',
      defaultMessage: 'LPA',
    },
    inventoryGraphStatusXAxisLegend: {
      id: 'legends.Unknown.inventoryGraphStatusXAxisLegend',
      defaultMessage: 'Number of Locations',
    },
    inventoryGraphStatusYAxisLegend: {
      id: 'legends.Unknown.inventoryGraphStatusYAxisLegend',
      defaultMessage: 'Supply in Stock',
    },

    Total: {
      id: 'legends.Unknown.Total',
      defaultMessage: 'Total',
    },
    MTBPlus: {
      id: 'legends.Unknown.MTBPlus',
      defaultMessage: 'MTB+',
    },
    MTBPercent: {
      id: 'legends.Unknown.MTBPercent',
      defaultMessage: 'MTB%',
    },
    RRDHash: {
      id: 'legends.Unknown.RRDHash',
      defaultMessage: 'RRD#',
    },
    RRDPercent: {
      id: 'legends.Unknown.RRDPercent',
      defaultMessage: 'RRD%',
    },

    TotalTests: {
      id: 'legends.Unknown.TotalTests',
      defaultMessage: 'Total Tests',
    },
    MtbDetected: {
      id: 'legends.Unknown.MtbDetected',
      defaultMessage: 'MTB Detected',
    },
    FqrDetected: {
      id: 'legends.Unknown.FqrDetected',
      defaultMessage: 'FQ-R Detected',
    },
    FQRPercent: {
      id: 'legends.Unknown.FQRPercent',
      defaultMessage: 'FQ-R %',
    },
  }),
}

export default messages
