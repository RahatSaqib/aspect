import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    // page titles
    aspectDashboard: { id: 'p.PkDashboard.aspectDashboard', defaultMessage: 'Aspect Dashboard' },
    errorRateTitle: { id: 'p.PkDashboard.errorRate', defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Errors' },
    utilizationTitle: {
      id: 'p.PkDashboard.utilizationTitle',
      defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Utilization',
    },
    coverageTitle: { id: 'p.PkDashboard.coverageTitle', defaultMessage: 'Xpert MTB/RIF Coverage' },
    rifCurrentTitle: { id: 'p.PkDashboard.rifCurrentTitle', defaultMessage: 'Current Testing of MTB/RIF performed in' },
    currentYear: {
      id: 'p.PkDashboard.CurrentYear',
      defaultMessage: 'current Year',
    },
    annualTestingTrends: {
      id: 'p.PkDashboard.annualTestingTrends',
      defaultMessage: 'Annual Testing Trends',
    },
    monthlyTestingTrends: {
      id: 'p.PkDashboard.monthlyTestingTrends',
      defaultMessage: 'Monthly Testing Trends',
    },
    peopleTestedRif: {
      id: 'p.PkDashboard.peopleTestedRif',
      defaultMessage: 'People tested for TB using MTB/Rif assay in current year',
    },
    peopleTestedXdr: {
      id: 'p.PkDashboard.peopleTestedXdr',
      defaultMessage: 'People tested using MTB/XDR assay in current year',
    },
    peopleDiagnosedRif: {
      id: 'p.PkDashboard.peopleDiagnosedRif',
      defaultMessage: 'People diagnosed for TB using MTB/Rif assay in current year',
    },
    peopleDiagnosedXdr: {
      id: 'p.PkDashboard.peopleDiagnosedXdr',
      defaultMessage: 'People diagnosed using MTB/XDR assay in current year',
    },
    testsPerformedYear: {
      id: 'p.PkDashboard.testsPerformedYear',
      defaultMessage: 'Tests Performed in current year',
    },
    mtbRifTestingDiagnosed: {
      id: 'p.PkDashboard.mtbRifTestingDiagnosed',
      defaultMessage: 'TB Testing & Diagnosis Trends using MTB/Rif Assay',
    },
    provincialTestingTrends: {
      id: 'p.PkDashboard.provincialTestingTrends',
      defaultMessage: 'Provincial/District Testing Trends',
    },
    provincialXdrTestingTrends: {
      id: 'p.PkDashboard.provincialXdrTestingTrends',
      defaultMessage: 'Provincial/District Testing Trends using MTB/XDR Assay in current year',
    },
    provincialDiagnosisTrends: {
      id: 'p.PkDashboard.provincialDiagnosisTrends',
      defaultMessage: 'Provincial TB Diagnosis Trends using MTB/Rif Assay',
    },
    provincialDiagnosisTrendsComparison: {
      id: 'p.PkDashboard.provincialDiagnosisTrendsComparison',
      defaultMessage: 'Provincial Diagnosis Trends Comparison',
    },
    provincialXdrDiagnosisTrends: {
      id: 'p.PkDashboard.provincialXdrDiagnosisTrends',
      defaultMessage: 'Provincial/District Diagnosis Trends using MTB/XDR Assay',
    },
    provincialTestingTrendsYear: {
      id: 'p.PkDashboard.provincialTestingTrendsYear',
      defaultMessage: 'Provincial Testing in current year',
    },
    provincialDistrictFqrDiagnosisTrends: {
      id: 'p.PkDashboard.provincialFqrDiagnosisTrends',
      defaultMessage: 'Provincial/District FQ Diagnosis Trends',
    },
    provincialFqrDiagnosisTrends: {
      id: 'p.PkDashboard.provincialFqrDiagnosisTrends',
      defaultMessage: 'Provincial FQ Diagnosis Trends',
    },
    nationalMtbRifDiagnosed: {
      id: 'p.PkDashboard.nationalMtbRifDiagnosed',
      defaultMessage: 'National TB Diagnosis Trends using MTB/Rif Assay',
    },
    nationalMtbXdrDiagnosed: {
      id: 'p.PkDashboard.nationalMtbRifDiagnosed',
      defaultMessage: 'National TB Diagnosis Trends using MTB/XDR Assay',
    },
    nationalXdrTestingTrends: {
      id: 'p.PkDashboard.nationalMtbRifDiagnosed',
      defaultMessage: 'National Testing Trends using MTB/XDR Assay',
    },
    nationalFqrResistanceTrend: {
      id: 'p.PkDashboard.nationalFqrResistanceTrend',
      defaultMessage: 'National FQ-R Resistance Trend',
    },
    rrtbDiagnosisTitle: {
      id: 'p.PkDashboard.rrtbDiagnosisTitle',
      defaultMessage: 'Current Rifampicin Resistance Diagnosis using MTB/Rif Assay',
    },
    rrtbNationalDiagnosisTrendsTitle: {
      id: 'p.PkDashboard.rrtbNationalDiagnosisTrendsTitle',
      defaultMessage: 'National Rifampicin Resistance Diagnosis Trends',
    },
    provincialRRDiagnosisTrends: {
      id: 'p.PkDashboard.provincialRRDiagnosisTrends',
      defaultMessage: 'Provincial RR Diagnosis Trends',
    },
    rifCurrentDiagnosisTitle: { id: 'p.PkDashboard.rifCurrentDiagnosisTitle', defaultMessage: 'TB cases diagnosed in' },
    rifCurrentRRTBDiagnosisTitle: {
      id: 'p.PkDashboard.rifCurrentRRTBDiagnosisTitle',
      defaultMessage: 'Current Rifampicin Resistance Diagnosis Trends',
    },
    testPerYear: { id: 'p.PkDashboard.testPerYear', defaultMessage: 'Tests performed this year' },
    testPerMonth: { id: 'p.PkDashboard.testPerMonth', defaultMessage: 'Average tests performed per month' },
    testPerDay: { id: 'p.PkDashboard.testPerDay', defaultMessage: 'Tests performed in last 24 hours' },

    RRPerYear: { id: 'p.PkDashboard.RRPerYear', defaultMessage: 'RR cases diagnosed this year' },
    RRPerMonth: { id: 'p.PkDashboard.RRPerMonth', defaultMessage: 'Average RR cases diagnosed per month' },
    RRPerDay: { id: 'p.PkDashboard.RRPerDay', defaultMessage: 'RR cases diagnosed in last 24 hours' },

    xdrCurrentTitle: { id: 'p.PkDashboard.xdrCurrentTitle', defaultMessage: 'Current GX-10CX Testing performed in' },

    xdrCurrentDiagnosisTitle: { id: 'p.PkDashboard.xdrCurrentDiagnosisTitle', defaultMessage: 'Current Diagnosis' },
    xdrCasesPerYear: { id: 'p.PkDashboard.xdrCasesPerYear', defaultMessage: 'Tb cases diagnosed this year' },
    xdrAverageMoth: { id: 'p.PkDashboard.xdrAverageMoth', defaultMessage: 'Average TB cases diagnosed per month' },
    xdrLastDay: { id: 'p.PkDashboard.xdrLastDay', defaultMessage: 'Tb cases diagnosed in last 24 hours' },
    // summary
    molecularAssay: {
      id: 'p.PkDashboard.molecularAssay',
      defaultMessage: 'People tested for TB using MTB/Rif assay in current year',
    },
    molecularAssay24: { id: 'p.PkDashboard.molecularAssay24', defaultMessage: 'Last 24 hours' },
    TB: { id: 'p.PkDashboard.TB', defaultMessage: 'TB Cases Diagnosed in current year' },
    TB24: { id: 'p.PkDashboard.TB24', defaultMessage: 'Last 24 hours' },
    RTTB: { id: 'p.PkDashboard.RTTB', defaultMessage: 'RRTB Cases Diagnosed in current year' },
    RTTB24: { id: 'p.PkDashboard.RTTB24', defaultMessage: 'Last 24 hours' },
    // 1st column
    titlemtbRif: { id: 'p.PkDashboard.titlemtbRif', defaultMessage: 'MTB/RIF' },
    mtbRifTbTesting: { id: 'p.PkDashboard.mtbRifTbTesting', defaultMessage: 'TB Testing' },
    mtbRifTbDiagnosis: { id: 'p.PkDashboard.mtbRifTbDiagnosis', defaultMessage: 'TB Diagnosis' },
    mtbRifRrtbDiagnosis: { id: 'p.PkDashboard.mtbRifRrtbDiagnosis', defaultMessage: 'RRTB Diagnosis' },
    TbCurrent: { id: 'p.PkDashboard.TbCurrent', defaultMessage: 'Current TB Testing Trends' },
    TbNationalTrend: { id: 'p.PkDashboard.TbNationalTrend', defaultMessage: 'National TB Testing Trends' },
    GXTbNationalTrend: { id: 'p.PkDashboard.GXTbNationalTrend', defaultMessage: 'National GX-10C Testing Trends' },
    GXTbNationalDiagnosis: {
      id: 'p.PkDashboard.GXTbNationalDiagnosis',
      defaultMessage: 'National GX-10C Diagnosed Trends in',
    },
    TbProvincialComparison: {
      id: 'p.PkDashboard.TbProvincialComparison',
      defaultMessage: 'Provincial TB Testing Trend comparison',
    },
    TbSubprovincialTrend: {
      id: 'p.PkDashboard.TbSubprovincialTrend',
      defaultMessage: 'Sub-Provincial TB Testing Trends',
    },
    TbDCurrent: { id: 'p.PkDashboard.TbDCurrent', defaultMessage: 'Current TB Diagnosis' },
    TbDNationalTrend: { id: 'p.PkDashboard.TbDNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    TbDProvincialComparison: {
      id: 'p.PkDashboard.TbDProvincialComparison',
      defaultMessage: 'Provincial TB Diagnosis Trends Comparison',
    },
    TbDTestingDiagnosis: { id: 'p.PkDashboard.TbDTestingDiagnosis', defaultMessage: 'TB Testing & Diagnosis Trends' },
    RRCurrent: { id: 'p.PkDashboard.RRCurrent', defaultMessage: 'Current RRTB Diagnosis' },
    RRNationalTrend: { id: 'p.PkDashboard.RRNationalTrend', defaultMessage: 'National RRTB Trends' },
    RRProvincialComparison: {
      id: 'p.PkDashboard.RRProvincialComparison',
      defaultMessage: 'Provincial RRTB Diagnosis Trends Comparison',
    },
    RRTestingDiagnosis: { id: 'p.PkDashboard.RRTestingDiagnosis', defaultMessage: 'TB & RRTB Diagnosis' },

    // 2nd column
    titlemtbXdr: { id: 'p.PkDashboard.titlemtbXdr', defaultMessage: 'MTB/XDR' },
    mtbXdrTesting: { id: 'p.PkDashboard.mtbXdrTesting', defaultMessage: 'Testing' },
    mtbXdrmtbDetection: { id: 'p.PkDashboard.mtbXdrmtbDetection', defaultMessage: 'MTB Detection' },
    mtbXdrFQResistance: { id: 'p.PkDashboard.mtbXdrFQResistance', defaultMessage: 'FQ Resistance' },
    mtbXdrTestingDiagnosisTrends: {
      id: 'p.PkDashboard.mtbXdrTestingDiagnosisTrends',
      defaultMessage: 'Testing & Diagnosis Trends using MTB/XDR Assay',
    },
    XDRByDevice: {
      id: 'p.PkDashboard.XDRByDevice',
      defaultMessage: 'XDR Assay Summary Result by device',
    },
    TCurrent: { id: 'p.PkDashboard.TCurrent', defaultMessage: 'Current Testing' },
    TNationalTrend: { id: 'p.PkDashboard.TNationalTrend', defaultMessage: 'National Testing Trends' },
    TProvincialComparison: {
      id: 'p.PkDashboard.TProvincialComparison',
      defaultMessage: 'Provincial Trend Comparison',
    },
    DCurrent: { id: 'p.PkDashboard.DCurrent', defaultMessage: 'Current MTB Detection' },
    DNationalTrend: { id: 'p.PkDashboard.DNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    DProvincialComparison: {
      id: 'p.PkDashboard.DProvincialComparison',
      defaultMessage: 'Provincial TB Diagnosis Trends Comparison',
    },
    DTestingDiagnosis: {
      id: 'p.PkDashboard.DTestingDiagnosis',
      defaultMessage: 'GX-10C Testing & Diagnosis',
    },
    FQCurrent: { id: 'p.PkDashboard.FQCurrent', defaultMessage: 'Current FQ Trends' },
    FQNationalTrend: { id: 'p.PkDashboard.FQNationalTrend', defaultMessage: 'National FQ Trend' },
    FQProvincialComparison: {
      id: 'p.PkDashboard.FQProvincialComparison',
      defaultMessage: 'Provincial FQ trends Comparison',
    },
    // 3rd column
    titlecoverage: { id: 'p.PkDashboard.titlecoverage', defaultMessage: 'Coverage' },
    coverageperformance: { id: 'p.PkDashboard.coverageperformance', defaultMessage: 'Performance' },
    genExpert: { id: 'p.PkDashboard.genExpert', defaultMessage: 'GeneXpert Device Coverage' },
    utilization: { id: 'p.PkDashboard.utilization', defaultMessage: 'Utilization' },
    errorRate: { id: 'p.PkDashboard.errorRate', defaultMessage: 'Error Rate' },
    // 4th column
    titleinventory: { id: 'p.PkDashboard.titleinventory', defaultMessage: 'Inventory' },
    overview: { id: 'p.PkDashboard.overview', defaultMessage: 'Inventory Overview' },
    // 5th column
    titleother: { id: 'p.PkDashboard.titleother', defaultMessage: 'Other' },
    covid: { id: 'p.PkDashboard.covid', defaultMessage: 'Covid' },
    hiv: { id: 'p.PkDashboard.hiv', defaultMessage: 'Hiv' },
    incompleteScreen: { id: 'p.PkDashboard.incompleteScreen', defaultMessage: 'Screen is not yet complete' },
    date: {
      id: 'forms.formSectionHeader.date',
      defaultMessage: 'Date',
    },
  }),
}

export default messages
