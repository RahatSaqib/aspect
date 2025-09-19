import { defineMessages } from 'react-intl'
import allMessages from '../../messages/allMessages'
import { commonDefinitions } from '../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...allMessages,
  ...defineMessages({
    // page titles
    aspectDashboard: { id: 'p.PkDashboard.aspectDashboard', defaultMessage: 'Aspect Dashboard' },
    errorRateTitle: { id: 'p.PkDashboard.errorRateTitle', defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Errors' },
    errorRatePageTitle: { id: 'p.PkDashboard.errorRatePageTitle', defaultMessage: 'Non-reportable results' },
    geneXpertUtilizationTitle: {
      id: 'p.PkDashboard.geneXpertUtilizationTitle',
      defaultMessage: 'GeneXpert Device Utilization',
    },
    utilizationRate: {
      id: 'p.PkDashboard.utilizationRate1',
      defaultMessage:
        'Utilization Rate : (Total tests in the selected period * 100) / (Daily Capacity of device * Working days in the selected period)',
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
    peopleTestedRifTooltip: {
      id: 'p.PkDashboard.peopleTestedRifTooltip',
      defaultMessage:
        "Count only Reportable Results of MTB/Rif and MTB/Rif-Ultra, not including 'No Result', 'Error', 'Indeterminate', 'Invalid'.",
    },
    peopleTestedCovid: {
      id: 'p.PkDashboard.peopleTestedCovid',
      defaultMessage: 'People tested for Covid in current year',
    },
    peopleTestedHiv: {
      id: 'p.PkDashboard.peopleTestedHiv',
      defaultMessage: 'People tested for HIV in current year',
    },
    mtbPositiveCurrentYear: {
      id: 'p.PkDashboard.mtbPositiveCurrentYear',
      defaultMessage: 'MTB positives diagnosed in current year',
    },
    annualMTBDiagnosis: {
      id: 'p.PkDashboard.annualMTBDiagnosis',
      defaultMessage: 'Annual MTB+ diagnosis trends',
    },
    monthlyMTBDiagnosis: {
      id: 'p.PkDashboard.monthlyMTBDiagnosis',
      defaultMessage: 'Monthly MTB+ diagnosis trends',
    },
    MTBDiagnosis: {
      id: 'p.PkDashboard.MTBDiagnosis',
      defaultMessage: 'MTB+ diagnosis trends',
    },
    MTBDiagnosisCurrentYear: {
      id: 'p.PkDashboard.MTBDiagnosisCurrentYear',
      defaultMessage: 'MTB+ diagnosed in current year',
    },
    rrtbDiagnosedCurrentYear: {
      id: 'p.PkDashboard.rrtbDiagnosedCurrentYear',
      defaultMessage: 'RR-TB diagnosed in current year',
    },
    annualRRTBDiagnosisTrends: {
      id: 'p.PkDashboard.annualRRTBDiagnosisTrends',
      defaultMessage: 'Annual RR-TB diagnosis trends',
    },
    monthlyRRTBDiagnosis: {
      id: 'p.PkDashboard.monthlyRRTBDiagnosis',
      defaultMessage: 'Monthly RR-TB diagnosis trends',
    },
    RRTBDiagnosisTrends2: {
      id: 'p.PkDashboard.RRTBDiagnosisTrends2',
      defaultMessage: 'RR-TB diagnosis trends',
    },
    RRTBDiagnosisTrendsCurrentYear: {
      id: 'p.PkDashboard.RRTBDiagnosisTrendsCurrentYear',
      defaultMessage: 'RR-TB diagnosed in current year',
    },
    TBXDRTest: {
      id: 'p.PkDashboard.TBXDRTest',
      defaultMessage: 'TB XDR tests performed in current year',
    },
    monthlyXDRTrends: {
      id: 'p.PkDashboard.monthlyXDRTrends',
      defaultMessage: 'Monthly XDR testing trends',
    },
    mtbPlusDetectionTrends: {
      id: 'p.PkDashboard.mtbPlusDetectionTrends',
      defaultMessage: 'Annual MTB+ detection trends',
    },
    mtbPlusMonthlyDetectionTrends: {
      id: 'p.PkDashboard.mtbPlusMonthlyDetectionTrends',
      defaultMessage: 'Monthly MTB+ detection trends',
    },
    XDRTestingTrends: {
      id: 'p.PkDashboard.XDRTestingTrends',
      defaultMessage: 'XDR testing trends',
    },
    XDRTestingTrendsCurrentYear: {
      id: 'p.PkDashboard.XDRTestingTrendsCurrentYear',
      defaultMessage: 'XDR testing in current year',
    },
    xdrDrugResistance: {
      id: 'p.PkDashboard.xdrDrugResistance',
      defaultMessage: 'XDR drug resistance trends',
    },
    mtbPositivesCurrentYear: {
      id: 'p.PkDashboard.mtbPositivesCurrentYear',
      defaultMessage: 'MTB positives detected in current year',
    },
    MTBPositivesTrends: {
      id: 'p.PkDashboard.MTBPositivesTrends',
      defaultMessage: 'MTB+ detection trends',
    },
    MTBPositivesTrendsCurrentYear: {
      id: 'p.PkDashboard.MTBPositivesTrends.currentYear',
      defaultMessage: 'MTB+ detected in current year',
    },
    xdrFLQAndINHTrends: {
      id: 'p.PkDashboard.xdrFLQAndINHTrends',
      defaultMessage: 'XDR FLQ and INH resistance trends',
    },
    testsPerformedYear: {
      id: 'p.PkDashboard.testsPerformedYear',
      defaultMessage: 'Tests Performed in current year',
    },
    testingTrends: {
      id: 'p.PkDashboard.testingTrends',
      defaultMessage: 'Testing Trends',
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
    diagnosisTrendsCurrentYear: {
      id: 'p.PkDashboard.tbCasesDiagnosed.currentYearNew',
      defaultMessage: 'Diagnosis Trends for the current year',
    },
    diagnosisTrendsComparison: {
      id: 'p.PkDashboard.diagnosisTrendsComparisonNew',
      defaultMessage: 'Diagnosis Trends Comparison',
    },
    diagnosisTrends: {
      id: 'p.PkDashboard.diagnosisTrends',
      defaultMessage: 'Diagnosis Trends',
    },
    testingTrendsYear: {
      id: 'p.PkDashboard.testingTrendsYear',
      defaultMessage: 'Testing in current year',
    },
    fqrDiagnosisTrends: {
      id: 'p.PkDashboard.FqrDiagnosisTrends',
      defaultMessage: 'FQ Diagnosis Trends',
    },
    fqrDiagnosisTrendsCurrentYear: {
      id: 'p.PkDashboard.FqrDiagnosisTrends',
      defaultMessage: 'FQ Diagnosis Trends in current year',
    },
    nationalFqrResistanceTrend: {
      id: 'p.PkDashboard.nationalFqrResistanceTrend',
      defaultMessage: 'National FQ-R Resistance Trend',
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
    RRDiagnosisTrends: {
      id: 'p.PkDashboard.RRDiagnosisTrends',
      defaultMessage: 'RR Diagnosis Trends',
    },
    rifCurrentDiagnosisTitle: { id: 'p.PkDashboard.rifCurrentDiagnosisTitle', defaultMessage: 'TB cases diagnosed in' },
    rifCurrentRRTBDiagnosisTitle: {
      id: 'p.PkDashboard.rifCurrentRRTBDiagnosisTitle',
      defaultMessage: 'Current Rifampicin Resistance Diagnosis Trends',
    },
    testPerYear: { id: 'p.PkDashboard.testPerYear', defaultMessage: 'Tests performed this year' },
    testPerMonth: { id: 'p.PkDashboard.testPerMonth', defaultMessage: 'Average tests performed per month' },
    testToday: { id: 'p.PkDashboard.testToday', defaultMessage: 'Tests performed today' },

    customPerYear: { id: 'p.PkDashboard.customPerYear', defaultMessage: '{resultType} detected this year' },
    customPerMonth: {
      id: 'p.PkDashboard.customPerMonth',
      defaultMessage: 'Average {resultType} detected per month in current year',
    },
    customToday: { id: 'p.PkDashboard.customToday', defaultMessage: '{resultType} detected today' },

    RRPerYear: { id: 'p.PkDashboard.RRPerYear', defaultMessage: 'RR cases diagnosed this year' },
    RRPerMonth: { id: 'p.PkDashboard.RRPerMonth', defaultMessage: 'Average RR cases diagnosed per month' },
    RRToday: { id: 'p.PkDashboard.RRToday', defaultMessage: 'RR cases diagnosed today' },

    currentFQDetection: { id: 'p.PkDashboard.currentFQDetection', defaultMessage: 'Current FQ Detection' },
    FQRPerYear: { id: 'p.PkDashboard.FQRPerYear', defaultMessage: 'FQ-R cases diagnosed this year' },
    FQRCurrentYear: { id: 'p.PkDashboard.FQRCurrentYear', defaultMessage: 'FQ-R cases diagnosed in current year' },
    FQRPerMonth: { id: 'p.PkDashboard.FQRPerMonth', defaultMessage: 'Average FQ-R cases diagnosed per month' },
    FQRToday: { id: 'p.PkDashboard.FQRToday', defaultMessage: 'FQ-R cases diagnosed today' },

    xdrCurrentTitle: { id: 'p.PkDashboard.xdrCurrentTitle', defaultMessage: 'Current GX-10CX Testing performed in' },

    xdrCurrentDiagnosisTitle: { id: 'p.PkDashboard.xdrCurrentDiagnosisTitle', defaultMessage: 'Current Diagnosis' },
    xdrTBCasesPerYear: { id: 'p.PkDashboard.xdrTBCasesPerYear', defaultMessage: 'TB cases diagnosed this year' },
    xdrAverageMoth: { id: 'p.PkDashboard.xdrAverageMoth', defaultMessage: 'Average TB cases diagnosed per month' },
    xdrTBToday: { id: 'p.PkDashboard.xdrTBToday', defaultMessage: 'TB cases diagnosed today' },
    // summary
    molecularAssay: {
      id: 'p.PkDashboard.molecularAssay',
      defaultMessage: 'People tested for TB using MTB/Rif assay in current year',
    },
    molecularAssay25: { id: 'p.PkDashboard.molecularAssay25', defaultMessage: 'Today' },
    TB: { id: 'p.PkDashboard.TB', defaultMessage: 'TB Cases Diagnosed in current year' },
    TB25: { id: 'p.PkDashboard.TB25', defaultMessage: 'Today' },
    RTTB: { id: 'p.PkDashboard.RTTB', defaultMessage: 'RRTB Cases Diagnosed in current year' },
    RTTB25: { id: 'p.PkDashboard.RTTB25', defaultMessage: 'Today' },
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
    TBTestingTrend: {
      id: 'p.PkDashboard.TBTestingTrend',
      defaultMessage: 'TB Testing Trend',
    },
    TbDCurrent: { id: 'p.PkDashboard.TbDCurrent', defaultMessage: 'Current TB Diagnosis' },
    TbDNationalTrend: { id: 'p.PkDashboard.TbDNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    TbDTestingDiagnosis: { id: 'p.PkDashboard.TbDTestingDiagnosis', defaultMessage: 'TB Testing & Diagnosis Trends' },
    RRCurrent: { id: 'p.PkDashboard.RRCurrent', defaultMessage: 'Current RRTB Diagnosis' },
    RRNationalTrend: { id: 'p.PkDashboard.RRNationalTrend', defaultMessage: 'National RRTB Trends' },
    RRTBDiagnosisTrends: {
      id: 'p.PkDashboard.RRTBDiagnosisTrends',
      defaultMessage: 'RRTB Diagnosis Trends',
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
    currentMtbXdrTesting: { id: 'p.PkDashboard.currentMtbXdrTesting', defaultMessage: 'Current MTB/XDR Testing' },
    TNationalTrend: { id: 'p.PkDashboard.TNationalTrend', defaultMessage: 'National Testing Trends' },
    nationalMtbXdrTestingTrends: {
      id: 'p.PkDashboard.nationalMtbXdrTestingTrends',
      defaultMessage: 'National MTB/XDR Testing Trends',
    },
    testingTrend: {
      id: 'p.PkDashboard.testingTrend',
      defaultMessage: 'Testing Trend',
    },
    MtbXdrTestingTrends: {
      id: 'p.PkDashboard.MtbXdrTestingTrends',
      defaultMessage: 'MTB/XDR Testing Trends',
    },
    XDRTestingandDiagnosisTrends: {
      id: 'p.PkDashboard.XDRTestingandDiagnosisTrends',
      defaultMessage: 'XDR Testing and Diagnosis Trends',
    },
    xdrTestingAndMtbDetectionTrends: {
      id: 'p.PkDashboard.xdrTestingAndMtbDetectionTrends',
      defaultMessage: 'XDR Testing and MTB Detection Trends',
    },
    DCurrent: { id: 'p.PkDashboard.DCurrent', defaultMessage: 'Current MTB Detection' },
    DCurrentPending: { id: 'p.PkDashboard.DCurrentPending', defaultMessage: 'Current MTB Detection' },
    DNationalTrend: { id: 'p.PkDashboard.DNationalTrend', defaultMessage: 'National TB Diagnosis Trends' },
    nationalMtbDetectionTrends: {
      id: 'p.PkDashboard.nationalMtbDetectionTrends',
      defaultMessage: 'National MTB Detection Trends',
    },
    TBDiagnosisTrendsComparison: {
      id: 'p.PkDashboard.TBDiagnosisTrendsComparison',
      defaultMessage: 'TB Diagnosis Trends Comparison',
    },
    MtbDetectionTrendsComparison: {
      id: 'p.PkDashboard.MtbDetectionTrendsComparison',
      defaultMessage: 'MTB Detection Trends Comparison',
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
    FQDiagnosisTrends: {
      id: 'p.PkDashboard.FQDiagnosisTrends',
      defaultMessage: 'FQ Diagnosis Trends',
    },
    nationalErrorRates: {
      id: 'p.PkDashboard.nationalErrorRates',
      defaultMessage: 'National Error Rates',
    },
    nationalInvalidRates: {
      id: 'p.PkDashboard.nationalInvalidRates',
      defaultMessage: 'National Invalid Rates',
    },
    nationalNoResultRates: {
      id: 'p.PkDashboard.nationalNoResultRates',
      defaultMessage: 'National No Result Rates',
    },
    // 3rd column
    titlecoverage: { id: 'p.PkDashboard.titlecoverage', defaultMessage: 'Coverage' },
    coverageperformance: { id: 'p.PkDashboard.coverageperformance', defaultMessage: 'Performance' },
    genExpert: { id: 'p.PkDashboard.genExpertPending', defaultMessage: 'GeneXpert Device Coverage' },
    genExpertError: { id: 'p.PkDashboard.genExpertError', defaultMessage: 'GeneXpert MTB-RIF/Ultra Device Errors' },
    utilization: { id: 'p.PkDashboard.utilization', defaultMessage: 'Utilization' },
    errorRate: { id: 'p.PkDashboard.errorRate', defaultMessage: 'Error Rate' },
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
    totalReportableTBTests: {
      id: 'p.PkDashboard.totalReportableTBTests',
      defaultMessage: 'Total TB tests with a reportable result in current year',
    },
    reportableCount: {
      id: 'p.PkDashboard.reportableCount',
      defaultMessage: 'Count only reportable results, exclude errors, no results and invalids',
    },
    totalTBDetectedInCurrentYear: {
      id: 'p.PkDashboard.totalTBDetectedInCurrentYear',
      defaultMessage: 'Total TB detected in current year',
    },
    totalMTBTraceDetected: {
      id: 'p.PkDashboard.totalMTBTraceDetected',
      defaultMessage: 'Total MTB detected and MTB Trace detected',
    },
    countIncludesMTBAndTrace: {
      id: 'p.PkDashboard.countIncludesMTBAndTrace',
      defaultMessage: 'Count includes MTB detected and MTB Trace detected',
    },
    totalRRTBDetectedInCurrentYear: {
      id: 'p.PkDashboard.totalRRTBDetectedInCurrentYear',
      defaultMessage: 'Total RRTB detected in current year',
    },
    dataVisualisationForXDRResistanceGraphTitle: {
      id: 'p.PkDashboard.dataVisualisationForXDRResistanceGraphTitle',
      defaultMessage: 'Data Visualisation For XDR Resistance Over Time',
    },
    mtbPlusAndTrace: {
      id: 'p.PkDashboard.mtbPlusAndTrace',
      defaultMessage: 'MTB+ and Trace',
    },
    provinceRegion: {
      id: 'p.PkDashboard.provinceRegion',
      defaultMessage: 'Province/Region',
    },
    gxSites: {
      id: 'p.PkDashboard.gxSites',
      defaultMessage: 'GX Sites',
    },
    gx6CDevices: {
      id: 'p.PkDashboard.gx6CDevices',
      defaultMessage: 'GX-6C Devices',
    },
    gx10CDevices: {
      id: 'p.PkDashboard.gx10CDevices',
      defaultMessage: 'GX-10C Devices',
    },
    combinedGX6CGX10CDevices: {
      id: 'p.PkDashboard.combinedGX6CGX10CDevices',
      defaultMessage: 'Combined GX-6C/GX-10C Devices',
    },
    gx6CModules: {
      id: 'p.PkDashboard.gx6CModules',
      defaultMessage: 'GX-6C Modules',
    },
    gx10CModules: {
      id: 'p.PkDashboard.gx10CModules',
      defaultMessage: 'GX-10C Modules',
    },
    utilizationName: {
      id: 'p.PkDashboard.utilizationName',
      defaultMessage: 'Name',
    },
    utilizationTotalModules: {
      id: 'p.PkDashboard.utilizationTotalModules',
      defaultMessage: 'Total Modules',
    },
    utilizationTotalTests: {
      id: 'p.PkDashboard.utilizationTotalTests',
      defaultMessage: 'Total Tests',
    },
    utilizationPercent: {
      id: 'p.PkDashboard.utilizationPercent',
      defaultMessage: 'Utilization%',
    },
    currentQty: {
      id: 'p.PkDashboard.currentQty',
      defaultMessage: 'Current Qty.',
    },
    used: {
      id: 'p.PkDashboard.used',
      defaultMessage: 'Used',
    },
    daysLeft: {
      id: 'p.PkDashboard.daysLeft',
      defaultMessage: 'Days Left',
    },
    consumptionRate: {
      id: 'p.PkDashboard.consumptionRate',
      defaultMessage: 'Consumption Rate',
    },
    last6Months: {
      id: 'p.PkDashboard.last6Months',
      defaultMessage: 'Last 6 Months',
    },
    whoBenchmark: {
      id: 'pages.ErrorRate.whoBenchmark',
      defaultMessage: 'WHO Benchmark ',
    },
    currentQtyTooltip: {
      id: 'p.PkDashboard.currentQtyTooltip',
      defaultMessage: 'Its the current quantity in hand, including the expired quantity.',
    },
    usedToolTip: {
      id: 'p.PkDashboard.usedToolTip',
      defaultMessage: 'Its the total cartidges consumed in the date range filter selected',
    },
    daysLeftTooltip: {
      id: 'p.PkDashboard.daysLeftTooltip',
      defaultMessage:
        'The number of days left with available and not-expired cartridge and the daily consumption rate of the cartridges',
    },
    consumptionRateTooltip: {
      id: 'p.PkDashboard.consumptionRateTooltip',
      defaultMessage: 'Its the average daily consumption of the specific cartridge considering the date range selected',
    },
    last6MonthsTooltip: {
      id: 'p.PkDashboard.last6MonthsTooltip',
      defaultMessage:
        'Its the total cartridges consumed in last 6 months, irrespective of the period selected in filter option',
    },
  }),
}

export default messages
