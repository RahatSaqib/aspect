const assayNameToExternalId = {
  'Xpert MTB-RIF': 'GxMtbRif',
  'Xpert MTB-RIF Assay G4': 'GxMtbRif', // ??
  'MTB-RIF Assay G4': 'GxMtbRif', // ??
  'Xpert MTB-RIF G3': 'GxMtbRif', // ??
  'Xpert MTB-RIF G2': 'GxMtbRif', // ??

  'Xpert MTB-RIF Ultra': 'GxMtbRifUltra', // ??
  'MTB-RIF ULTRA': 'GxMtbRifUltra', // ??
  'MTB-RIF Ultra RUO 2': 'GxMtbRifUltra', // ??

  'Xpert MTB-XDR': 'GxMtbXdr',

  'HIV VL': 'GxHiv1Vl',
  'HIV-1 VL': 'GxHiv1Vl',
  'Xpert_HIV-1 Viral Load': 'GxHiv1Vl',
  'Xpert HIV-1 Viral Load XC': 'GxHiv1Vl', // ??

  'Xpert_HIV-1 Qual': 'GxHiv1Qual',
  'Xpert HIV-1 Qual': 'GxHiv1Qual',
  'HIV-1 QUAL': 'GxHiv1Qual',
  'Xpert HIV-1 Qual XC WB': 'GxHiv1Qual', // ??
  'Xpert HIV-1 Qual XC DBS': 'GxHiv1Qual', // ??

  'Xpert Xpress SARS-CoV-2': 'assayGXCovid19',

  'Xpert_HCV Viral Load': 'GxHcv',
  'Xpert HCV Viral Load': 'GxHcv',

  // 'Xpert HCV VL Fingerstick': Note: this is NOT the same as Xpert HCV Viral Load

  'Xpert Ebola CE-IVD': 'GxEbola',
  'Ebola RUO': 'GxEbola', // ??
  EBOLA: 'GxEbola',
}

/*
 { 
            { "MTB-RIF", Constants.TestTypes.MTB_RIF_ID },
            { "MBT-RIF", Constants.TestTypes.MTB_RIF_ID },
            { "BMSH-PH", Constants.TestTypes.MTB_RIF_ID },
            { "P0644", Constants.TestTypes.EBOLA_ID },
            { "XPERT P0644", Constants.TestTypes.EBOLA_ID },
            { "XPERT EBOLA", Constants.TestTypes.EBOLA_ID },
            { "HIV-1 QUAL BETA", Constants.TestTypes.HIV_1_QUAL_ID },
            { "HIV QUAL", Constants.TestTypes.HIV_1_QUAL_ID },
            { "XPERT HIV-1 VIRAL LOAD", Constants.TestTypes.HIV_1_VL_ID },
            { "HIV-1 VIRAL LOAD", Constants.TestTypes.HIV_1_VL_ID },
            { "HCV VL", Constants.TestTypes.HCV_VL_ID },
            { "XPERT HCV VL", Constants.TestTypes.HCV_VL_ID },
            { "XPERT HCV VIRAL LOAD", Constants.TestTypes.HCV_VL_ID },
*/

module.exports = {
  assayNameToExternalId,
}
