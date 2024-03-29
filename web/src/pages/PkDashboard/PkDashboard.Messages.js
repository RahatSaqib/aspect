import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    // page titles
    aspectDashboard: { id: 'p.PkDashboard.aspectDashboard', defaultMessage: 'Aspect Dashboard' },
    errorRateTitle: { id: 'p.PkDashboard.errorRateTitle', defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Errors' },
    utilizationTitle: {
      id: 'p.PkDashboard.utilizationTitle',
      defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Utilization',
    },
    coverageTitle: { id: 'p.PkDashboard.coverageTitle', defaultMessage: 'Xpert MTB/RIF Coverage' },
    rifCurrentTitle: { id: 'p.PkDashboard.rifCurrentTitle', defaultMessage: 'Current Testing of MTB/RIF performed in' },
    currentYear: {
      id: 'p.PkDashboard.CurrentYear',
      defaultMessage: 'in current year',
    },
    annualTestingTrends: {
      id: 'p.PkDashboard.annualTestingTrends',
      defaultMessage: 'Annual Testing Trends',
    },
    monthlyTestingTrends: {
      id: 'p.PkDashboard.monthlyTestingTrends',
      defaultMessage: 'Monthly Testing Trends',
    },
    annualRRDiagnosedTrends: {
      id: 'p.PkDashboard.annualRRDiagnosedTrends',
      defaultMessage: 'Annual RR Diagnosis',
    },

    annualDiagnosedTrends: {
      id: 'p.PkDashboard.annualDiagnosedTrends',
      defaultMessage: 'Annual diagnosis Trends',
    },
    annualFQRDiagnosed: {
      id: 'p.PkDashboard.annualFQRDiagnosed',
      defaultMessage: 'Annual FQ-R Diagnosis',
    },
    monthlyFQRDiagnosed: {
      id: 'p.PkDashboard.monthlyFQRDiagnosed',
      defaultMessage: 'Monthly FQ-R Diagnosis',
    },
    monthlyDiagnosedTrends: {
      id: 'p.PkDashboard.monthlyDiagnosedTrends',
      defaultMessage: 'Monthly diagnosis Trends',
    },
    annualMTBDiagnosedTrends: {
      id: 'p.PkDashboard.annualMTBDiagnosedTrends',
      defaultMessage: 'MTB+ Trends In Year',
    },
    monthlyMTBDiagnosedTrends: {
      id: 'p.PkDashboard.monthlyMTBDiagnosedTrends',
      defaultMessage: 'MTB+ Trends In Month',
    },
    peopleTestedRif: {
      id: 'p.PkDashboard.peopleTestedRifUltra',
      defaultMessage: 'Assay for MTB Rif Ultra',
    },
    peopleTestedCovid: {
      id: 'p.PkDashboard.peopleTestedCovid',
      defaultMessage: 'People tested for Covid in current year',
    },
    peopleTestedHiv: {
      id: 'p.PkDashboard.peopleTestedHiv',
      defaultMessage: 'People tested for HIV in current year',
    },
    peopleTestedXdr: {
      id: 'p.PkDashboard.peopleTestedXdr',
      defaultMessage: 'People tested using MTB/XDR assay in current year',
    },
    peopleDiagnosedRif: {
      id: 'p.PkDashboard.peopleDiagnosedRifUltra',
      defaultMessage: 'People diagnosed for TB using MTB/Rif Ultra assay in current year',
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
    provincialTBTestingTrends: {
      id: 'p.PkDashboard.provincialTBTestingTrends',
      defaultMessage: 'Provincial/District TB Testing Trends',
    },
    tbCasesDiagnosed: {
      id: 'p.PkDashboard.tbCasesDiagnosed',
      defaultMessage: 'TB Cases Diagnosed',
    },
    rrCasesDiagnosed: {
      id: 'p.PkDashboard.rrCasesDiagnosed',
      defaultMessage: 'RR cases diagnosed',
    },
    xdrFlqResistance: {
      id: 'p.PkDashboard.xdrFlqResistance',
      defaultMessage: 'XDR FLQ Resistance',
    },
    nationalUtilizationTrendsAnnual: {
      id: 'p.PkDashboard.nationalUtilizationTrendsAnnual',
      defaultMessage: 'National annual utilization rates',
    },
    provincesUtilizationTrendsAnnual: {
      id: 'p.PkDashboard.provincesUtilizationTrendsAnnual',
      defaultMessage: 'Provinces annual utilization rates',
    },
    testingAndDiagnosisUsingXdr: {
      id: 'p.PkDashboard.testingAndDiagnosisUsingXdr',
      defaultMessage: 'Testing & Diagnosis Trends using MTB/XDR Assay',
    },
    provincialDiagnosisTrendsCurrentYear: {
      id: 'p.PkDashboard.tbCasesDiagnosed',
      defaultMessage: 'Provincial Diagnosis Trends for the current year',
    },
    provincialXdrTestingTrends: {
      id: 'p.PkDashboard.provincialXdrTestingTrends',
      defaultMessage: 'Provincial/District Testing Trends using MTB/XDR Assay in current year',
    },
    provincialDiagnosisTrendsMtbRif: {
      id: 'p.PkDashboard.provincialDiagnosisTrends',
      defaultMessage: 'Provincial/District TB Diagnosis Trends using MTB/Rif Assay',
    },
    provincialDiagnosisTrendsComparison: {
      id: 'p.PkDashboard.provincialDiagnosisTrendsComparison',
      defaultMessage: 'Provincial Diagnosis Trends Comparison',
    },
    provincialDiagnosisTrendsRRTBComparison: {
      id: 'p.PkDashboard.provincialDiagnosisTrendsRRTBComparison',
      defaultMessage: 'Provincial/District RR Diagnosis Trends',
    },
    testingDiagnosisTrendsRR: {
      id: 'p.PkDashboard.testingDiagnosisTrendsRR',
      defaultMessage: 'TB and RRTB Diagnosis Trends',
    },
    provincialDiagnosisTrends: {
      id: 'p.PkDashboard.provincialDiagnosisTrends',
      defaultMessage: 'Provincial Diagnosis Trends',
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
    nationalMtbRifUltraDiagnosed: {
      id: 'p.PkDashboard.nationalMtbRifUltraDiagnosed',
      defaultMessage: 'National Diagnosis Trends using MTB-Rif / MTB Rif Ultra assay',
    },
    nationalDiagnosisXdr: {
      id: 'p.PkDashboard.nationalDiagnosisXdr',
      defaultMessage: 'National Diagnosis Trends using MTB/XDR assay',
    },
    nationalXdrTestingTrends: {
      id: 'p.PkDashboard.nationalXdrTestingTrends',
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
    rrToMtbPercentage: {
      id: 'p.PkDashboard.rrToMtbPercentage',
      defaultMessage: 'RR+ percentage of MTB+',
    },
    TbTotal: {
      id: 'p.PkDashboard.TbTotal',
      defaultMessage: 'Tb Total',
    },
    rrDetected: {
      id: 'p.PkDashboard.rrDetected',
      defaultMessage: 'RR+',
    },
    testsPerformed: {
      id: 'p.PkDashboard.testsPerformed',
      defaultMessage: 'Tests Performed',
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
    RRInToday: { id: 'p.PkDashboard.RRInToday', defaultMessage: 'RR cases diagnosed in Today' },

    currentFQDetection: { id: 'p.PkDashboard.currentFQDetection', defaultMessage: 'Current FQ Detection' },
    FQRPerYear: { id: 'p.PkDashboard.FQRPerYear', defaultMessage: 'FQ-R cases diagnosed this year' },
    FQRCurrentYear: { id: 'p.PkDashboard.FQRCurrentYear', defaultMessage: 'FQ-R cases diagnosed in current year' },
    FQRPerMonth: { id: 'p.PkDashboard.FQRPerMonth', defaultMessage: 'Average FQ-R cases diagnosed per month' },
    FQRPerDay: { id: 'p.PkDashboard.FQRPerDay', defaultMessage: 'FQ-R cases diagnosed in last 24 hours' },

    xdrCurrentTitle: { id: 'p.PkDashboard.xdrCurrentTitle', defaultMessage: 'Current GX-10CX Testing performed in' },

    xdrCurrentDiagnosisTitle: { id: 'p.PkDashboard.xdrCurrentDiagnosisTitle', defaultMessage: 'Current Diagnosis' },
    xdrTBCasesPerYear: { id: 'p.PkDashboard.xdrTBCasesPerYear', defaultMessage: 'TB cases diagnosed this year' },
    xdrAverageMoth: { id: 'p.PkDashboard.xdrAverageMoth', defaultMessage: 'Average TB cases diagnosed per month' },
    xdrTBLastDay: { id: 'p.PkDashboard.xdrTBLastDay', defaultMessage: 'TB cases diagnosed in last 24 hours' },
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
    CurrentTBTesting: { id: 'p.PkDashboard.CurrentTBTesting', defaultMessage: 'Current TB Testing' },
    TbNationalTrend: { id: 'p.PkDashboard.TbNationalTrend', defaultMessage: 'National TB Testing Trends' },
    GXTbNationalTrend: { id: 'p.PkDashboard.GXTbNationalTrend', defaultMessage: 'National GX-10C Testing Trends' },
    GXTbNationalDiagnosis: {
      id: 'p.PkDashboard.GXTbNationalDiagnosis',
      defaultMessage: 'National GX-10C Diagnosed Trends in',
    },
    ProvincialTBTestingTrend: {
      id: 'p.PkDashboard.ProvincialTBTestingTrend',
      defaultMessage: 'Provincial TB Testing Trend',
    },
    TbDCurrent: { id: 'p.PkDashboard.TbDCurrent', defaultMessage: 'Current TB Diagnosis' },
    TbDNationalTrend: { id: 'p.PkDashboard.TbDNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    TbDTestingDiagnosis: { id: 'p.PkDashboard.TbDTestingDiagnosis', defaultMessage: 'TB Testing & Diagnosis Trends' },
    RRCurrent: { id: 'p.PkDashboard.RRCurrent', defaultMessage: 'Current RRTB Diagnosis' },
    RRNationalTrend: { id: 'p.PkDashboard.RRNationalTrend', defaultMessage: 'National RRTB Trends' },
    ProvincialRRTBDiagnosisTrends: {
      id: 'p.PkDashboard.ProvincialRRTBDiagnosisTrends',
      defaultMessage: 'Provincial RRTB Diagnosis Trends',
    },
    RRTestingDiagnosis: { id: 'p.PkDashboard.RRTestingDiagnosis', defaultMessage: 'TB & RRTB Diagnosis' },

    // 2nd column
    titlemtbXdr: { id: 'p.PkDashboard.titlemtbXdr', defaultMessage: 'MTB/XDR' },
    mtbXdrTesting: { id: 'p.PkDashboard.mtbXdrTesting', defaultMessage: 'Testing' },
    mtbXdrmtbDetection: { id: 'p.PkDashboard.mtbXdrmtbDetection', defaultMessage: 'MTB Detection' },
    mtbXdrFQResistance: { id: 'p.PkDashboard.mtbXdrFQResistance', defaultMessage: 'FQ Resistance' },
    fqinhTestingDiagnosis: {
      id: 'p.PkDashboard.fqinhTestingDiagnosis',
      defaultMessage: 'FQ & INH Testing & Diagnosis',
    },
    XDRByDevice: {
      id: 'p.PkDashboard.XDRByDevice',
      defaultMessage: 'XDR Assay Summary Result by device',
    },
    TCurrent: { id: 'p.PkDashboard.TCurrent', defaultMessage: 'Current Testing' },
    TNationalTrend: { id: 'p.PkDashboard.TNationalTrend', defaultMessage: 'National Testing Trends' },
    ProvincialTestingTrend: {
      id: 'p.PkDashboard.ProvincialTestingTrend',
      defaultMessage: 'Provincial Testing Trend',
    },
    XDRTestingandDiagnosisTrends: {
      id: 'p.PkDashboard.XDRTestingandDiagnosisTrends',
      defaultMessage: 'XDR Testing and Diagnosis Trends',
    },
    DCurrent: { id: 'p.PkDashboard.DCurrent', defaultMessage: 'Current MTB Detection' },
    DCurrentPending: { id: 'p.PkDashboard.DCurrentPending', defaultMessage: 'Current MTB Detection' },
    DNationalTrend: { id: 'p.PkDashboard.DNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    ProvincialTBDiagnosisTrendsComparison: {
      id: 'p.PkDashboard.ProvincialTBDiagnosisTrendsComparison',
      defaultMessage: 'Provincial TB Diagnosis Trends Comparison',
    },
    fqInhTestingDiagnosis: {
      id: 'p.PkDashboard.fqInhTestingDiagnosis',
      defaultMessage: 'FQ & INH Testing & Diagnosis',
    },
    dataVisualisationForXDR: {
      id: 'p.PkDashboard.dataVisualisationForXDR',
      defaultMessage: 'Data Visualisation for XDR Resistance',
    },
    CurrentFQDetection: {
      id: 'p.PkDashboard.CurrentFQDetection',
      defaultMessage: 'Current FQ Detection',
    },
    NationalFQResistanceTrend: {
      id: 'p.PkDashboard.NationalFQResistanceTrend',
      defaultMessage: 'National FQ Resistance Trend',
    },
    ProvincialFQDiagnosisTrends: {
      id: 'p.PkDashboard.ProvincialFQDiagnosisTrends',
      defaultMessage: 'Provincial FQ Diagnosis Trends',
    },
    // 3rd column
    titlecoverage: { id: 'p.PkDashboard.titlecoverage', defaultMessage: 'Coverage' },
    coverageperformance: { id: 'p.PkDashboard.coverageperformance', defaultMessage: 'Performance' },
    genExpert: { id: 'p.PkDashboard.genExpertPending', defaultMessage: 'GeneXpert Device Coverage' },
    genExpertError: { id: 'p.PkDashboard.genExpertError', defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Errors' },
    utilization: { id: 'p.PkDashboard.utilizationPending', defaultMessage: 'Utilization (Pending)' },
    errorRate: { id: 'p.PkDashboard.errorRatePending', defaultMessage: 'Error Rate (Pending)' },
    // 4th column
    titleinventory: { id: 'p.PkDashboard.titleinventory', defaultMessage: 'Inventory' },
    overview: { id: 'p.PkDashboard.overview', defaultMessage: 'Inventory Overview' },
    // 5th column
    titleother: { id: 'p.PkDashboard.titleother', defaultMessage: 'Other' },
    covidTesting: { id: 'p.PkDashboard.covidTesting', defaultMessage: 'Covid Testing' },
    hiv: { id: 'p.PkDashboard.hiv', defaultMessage: 'HIV' },
    incompleteScreen: { id: 'p.PkDashboard.incompleteScreen', defaultMessage: 'Screen is not yet complete' },
    date: {
      id: 'forms.formSectionHeader.date',
      defaultMessage: 'Date',
    },
    noAssociatedState: { id: 'p.PkDashboard.noAssociatedState', defaultMessage: 'No Associated State' },
    noAssociatedLga: { id: 'p.PkDashboard.noAssociatedLga', defaultMessage: 'No Associated LGA' },

    showLineFor: { id: 'p.PkDashboard.showLineFor', defaultMessage: 'Show line for' },
    dataVisualisationForXDRResistanceGraphTitle: {
      id: 'p.PkDashboard.dataVisualisationForXDRResistanceGraphTitle',
      defaultMessage: 'Data Visualisation For XDR Resistance Over Time',
    },
  }),
}

export default messages
