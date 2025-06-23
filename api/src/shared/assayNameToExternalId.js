// assayNames must be in Uppercase
const assayNameToExternalId = {
  'XPERT MTB-RIF': 'GxMtbRif',
  'XPERT MTB-RIF ASSAY G4': 'GxMtbRif',
  'MTB-RIF ASSAY G4': 'GxMtbRif',
  'XPERT MTB-RIF G3': 'GxMtbRif',
  'XPERT MTB-RIF G2': 'GxMtbRif',
  'MTB-RIF': 'GxMtbRif',
  'MBT-RIF': 'GxMtbRif',
  'BMSH-PH': 'GxMtbRif',

  'XPERT MTB-RIF ULTRA': 'GxMtbRifUltra',
  'MTB-RIF ULTRA': 'GxMtbRifUltra',
  'MTB-RIF ULTRA RUO 2': 'GxMtbRifUltra',
  'MBT-RIF ULTRA': 'GxMtbRifUltra',
  'MTB-RIF_ULTRA': 'GxMtbRifUltra',

  'XPERT MTB-XDR': 'GxMtbXdr',

  'HIV VL': 'GxHiv1Vl',
  'HIV-1 VL': 'GxHiv1Vl',
  'XPERT_HIV-1 VIRAL LOAD': 'GxHiv1Vl',
  'XPERT HIV-1 VIRAL LOAD XC': 'GxHiv1Vl',
  'XPERT HIV-1 VIRAL LOAD': 'GxHiv1Vl',
  'HIV-1 VIRAL LOAD': 'GxHiv1Vl',
  'HIV-1_VL': 'GxHiv1Vl',

  'XPERT_HIV-1 QUAL': 'GxHiv1Qual',
  'XPERT HIV-1 QUAL': 'GxHiv1Qual',
  'HIV-1 QUAL': 'GxHiv1Qual',
  'XPERT HIV-1 QUAL XC WB': 'GxHiv1Qual',
  'XPERT HIV-1 QUAL XC DBS': 'GxHiv1Qual',
  'HIV-1 QUAL BETA': 'GxHiv1Qual',
  'HIV-1_QUAL': 'GxHiv1Qual',
  'HIV QUAL': 'GxHiv1Qual',

  'XPERT XPRESS SARS-COV-2': 'assayGXCovid19',
  'SARS-COV-2': 'assayGXCovid19',
  'XPERT SARS-COV-2': 'assayGXCovid19',
  'XPRESS SARS-COV-2': 'assayGXCovid19',
  'XPERT XPRESS COV-2 PLUS': 'assayGXCovid19',
  'XPRESS SARS-COV-2_FLU_RSV PLUS': 'assayGXCovid19',

  'XPERT_HCV VIRAL LOAD': 'GxHcv',
  'XPERT HCV VIRAL LOAD': 'GxHcv',
  'HCV VL': 'GxHcv',
  'XPERT HCV VL': 'GxHcv',
  'XPERT HCV VL FINGERSTICK': 'GxHcv',

  'XPERT EBOLA CE-IVD': 'GxEbola',
  'EBOLA RUO': 'GxEbola',
  EBOLA: 'GxEbola',
  P0644: 'GxEbola',
  'XPERT P0644': 'GxEbola',
  'XPERT EBOLA': 'GxEbola',
  'XPERT EBOLA CE-IVD&1': 'GxEbola',
}

module.exports = {
  assayNameToExternalId,
}
