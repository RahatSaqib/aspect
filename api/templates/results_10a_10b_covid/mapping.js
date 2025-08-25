let sheets = [
  /**
   * ********************************************************
   * 1st sheet 'DR-TB 10A (Sputum & EP Sample)'
   * ********************************************************
   */
  {
    C6: 'stateName',
    C7: 'lgaName',
    C8: 'siteName',
    // ??: 'cntAll',

    N7: 'userName',
    M9: 'today',
    Q10: 'cell',

    M13: 'cntDevices',
    M14: 'cntModules',
    M15: 'cntModulesActive',

    J19: 'cnt_Presumptive_TB_Cases_Invalid_Mtb',
    K19: 'cnt_Presumptive_TB_Cases_NoResult_Mtb',
    L19: 'cnt_Presumptive_TB_Cases_Error_Mtb',

    M19: 'cnt_Presumptive_DR_TB_Cases_Invalid_Mtb',
    N19: 'cnt_Presumptive_DR_TB_Cases_NoResult_Mtb',
    O19: 'cnt_Presumptive_DR_TB_Cases_Error_Mtb',

    J20: 'cnt_Presumptive_TB_Cases_Invalid_Xdr',
    K20: 'cnt_Presumptive_TB_Cases_NoResult_Xdr',
    L20: 'cnt_Presumptive_TB_Cases_Error_Xdr',

    M20: 'cnt_Presumptive_DR_TB_Cases_Invalid_Xdr',
    N20: 'cnt_Presumptive_DR_TB_Cases_NoResult_Xdr',
    O20: 'cnt_Presumptive_DR_TB_Cases_Error_Xdr',

    // U18: 'cnt_Total_Cases_Invalid',
    // V18: 'cnt_Total_Cases_NoResult',
    // W18: 'cnt_Total_Cases_Error',

    /**
     * Total results
     */
    D19: 'cnt_Presumptive_TB_Cases_MtbDetectedRifIndeterminate',
    E19: 'cnt_Presumptive_DR_TB_Cases_MtbDetectedRifIndeterminate',

    D20: 'cnt_Presumptive_TB_Cases_MtbDetectedRifTraces',
    E20: 'cnt_Presumptive_DR_TB_Cases_MtbDetectedRifTraces',

    /*
    G17: 'cnt_Total_MtbDetectedRifNotDetected',
    G18: 'cnt_Total_MtbDetectedRifDetected',
    G19: 'cnt_Total_MtbDetectedRifIndeterminate',
    G20: 'cnt_Total_MtbNotDetected',
    */

    /**
     * Block 2
     */
    // Column (1)
    B27: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_all',
    B30: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_Mtb',
    B33: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_MtbRif',
    // Column (2)
    C27: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_all',
    C30: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_Mtb',
    C33: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_MtbRif',
    // Column (3)
    E27: 'cnt_TypeOfPatient_Column_3_all',
    E30: 'cnt_TypeOfPatient_Column_3_Mtb',
    E33: 'cnt_TypeOfPatient_Column_3_MtbRif',
    // Column (4)
    F27: 'cnt_TypeOfPatient_Column_4_all',
    F30: 'cnt_TypeOfPatient_Column_4_Mtb',
    F33: 'cnt_TypeOfPatient_Column_4_MtbRif',
    // Column (5)
    G27: 'cnt_TypeOfPatient_Column_5_all',
    G30: 'cnt_TypeOfPatient_Column_5_Mtb',
    G33: 'cnt_TypeOfPatient_Column_5_MtbRif',
    // Column (6)
    H27: 'cnt_TypeOfPatient_Column_6_all',
    H30: 'cnt_TypeOfPatient_Column_6_Mtb',
    H33: 'cnt_TypeOfPatient_Column_6_MtbRif',
    // Column (7)
    I27: 'cnt_TypeOfPatient_Column_7_all',
    I30: 'cnt_TypeOfPatient_Column_7_Mtb',
    I33: 'cnt_TypeOfPatient_Column_7_MtbRif',
    // Column (8)
    J27: 'cnt_TypeOfPatient_Column_8_all',
    J30: 'cnt_TypeOfPatient_Column_8_Mtb',
    J33: 'cnt_TypeOfPatient_Column_8_MtbRif',
    // Column (9)
    K27: 'cnt_TypeOfPatient_Column_9_all',
    K30: 'cnt_TypeOfPatient_Column_9_Mtb',
    K33: 'cnt_TypeOfPatient_Column_9_MtbRif',
    // Column (10)
    L27: 'cnt_TypeOfPatient_Column_10_all',
    L30: 'cnt_TypeOfPatient_Column_10_Mtb',
    L33: 'cnt_TypeOfPatient_Column_10_MtbRif',
    // Column (11)
    // ---
    O27: 'cnt_TypeOfPatient_Column_11_all_UnknownHistory',
    O28: 'cnt_TypeOfPatient_Column_11_all_New',
    O29: 'cnt_TypeOfPatient_Column_11_all_PrevTreated',
    // ---
    O30: 'cnt_TypeOfPatient_Column_11_Mtb_UnknownHistory',
    O31: 'cnt_TypeOfPatient_Column_11_Mtb_New',
    O32: 'cnt_TypeOfPatient_Column_11_Mtb_PrevTreated',
    // ---
    O33: 'cnt_TypeOfPatient_Column_11_MtbRif_UnknownHistory',
    O34: 'cnt_TypeOfPatient_Column_11_MtbRif_New',
    O35: 'cnt_TypeOfPatient_Column_11_MtbRif_PrevTreated',
    // Column (12)
    // ---
    R27: 'cnt_TypeOfPatient_Column_12_all_UnknownHistory',
    R28: 'cnt_TypeOfPatient_Column_12_all_New',
    R29: 'cnt_TypeOfPatient_Column_12_all_PrevTreated',
    // ---
    R30: 'cnt_TypeOfPatient_Column_12_Mtb_UnknownHistory',
    R31: 'cnt_TypeOfPatient_Column_12_Mtb_New',
    R32: 'cnt_TypeOfPatient_Column_12_Mtb_PrevTreated',
    // ---
    R33: 'cnt_TypeOfPatient_Column_12_MtbRif_UnknownHistory',
    R34: 'cnt_TypeOfPatient_Column_12_MtbRif_New',
    R35: 'cnt_TypeOfPatient_Column_12_MtbRif_PrevTreated',

    /**
     * Block 3 - Number of Presumptive smear negative TB cases
     */
    B40: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_all',
    B42: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_Mtb',
    B44: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_MtbRif',

    C40: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_all',
    C42: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_Mtb',
    C44: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_MtbRif',

    D40: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_all',
    D42: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_Mtb',
    D44: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_MtbRif',
    /**
     * Block 3 - Others (Specify)
     */
    /**
     * Patient History = Unknown History
     */ // =P40+P41+P42+Q40+Q41+Q42+R40+R41
    M41: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_all',
    P41: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_Mtb',
    S41: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_MtbRif',

    M42: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_all',
    P42: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_Mtb',
    S42: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_MtbRif',

    M43: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_all',
    P43: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_Mtb',
    S43: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_MtbRif',
    /**
     * Patient History = New
     */
    N41: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_all',
    Q41: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_Mtb',
    T41: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_MtbRif',

    N42: 'cnt_TypeOfPatient_OtherExtraPulm_New_all',
    Q42: 'cnt_TypeOfPatient_OtherExtraPulm_New_Mtb',
    T42: 'cnt_TypeOfPatient_OtherExtraPulm_New_MtbRif',

    N43: 'cnt_TypeOfPatient_OtherPulmBactConf_New_all',
    Q43: 'cnt_TypeOfPatient_OtherPulmBactConf_New_Mtb',
    T43: 'cnt_TypeOfPatient_OtherPulmBactConf_New_MtbRif',
    /**
     * Patient History = Previously treated
     */
    O41: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_all',
    R41: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_Mtb',
    U41: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_MtbRif',

    O42: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_all',
    R42: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_Mtb',
    U42: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_MtbRif',

    // H42: 'cnt_Xdr_Tested_From_Eligible',
    H44: 'cnt_Xdr_Total_Tests',
  },
]
sheets = [
  ...sheets,
  /**
   * ********************************************************
   * 2nd sheet 'DR-TB 10A (Stool)'
   * ********************************************************
   */
  sheets[0],
  /**
   * ********************************************************
   * 3rd sheet 'DT-TB 10B'
   * ********************************************************
   */
  {
    F9: 'total',
  },
  /**
   * ********************************************************
   * 4th sheet 'Covid 19'
   * ********************************************************
   */
  {
    L14: 'cnt_Invalid',
    M14: 'cnt_NoResult',
    N14: 'cnt_Error',

    C20: 'cnt_new_male_all',
    C23: 'cnt_new_male_positive',
    C26: 'cnt_new_male_negative',

    D20: 'cnt_new_female_all',
    D23: 'cnt_new_female_positive',
    D26: 'cnt_new_female_negative',

    F20: 'cnt_treated_male_all',
    F23: 'cnt_treated_male_positive',
    F26: 'cnt_treated_male_negative',

    H20: 'cnt_treated_female_all',
    H23: 'cnt_treated_female_positive',
    H26: 'cnt_treated_female_negative',
  },
  /**
   * ********************************************************
   * 5th sheet 'For NTP use' (No mappings)
   * ********************************************************
   */
  {},
  /**
   * ********************************************************
   * 6th sheet 'XDR Cartridges'
   * ********************************************************
   */
  (() => {
    const columnGroups = [
      { det: 'DET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
      { det: 'DET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
      { det: 'DET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
      { det: 'DET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
      { det: 'NDET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
      { det: 'NDET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
      { det: 'NDET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
      { det: 'NDET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
    ]
    const rowMetrics = [
      'TOT',
      'MTBDET',
      'INHR',
      'INHI',
      'FLQR',
      'FLQI',
      'ETHR',
      'ETHI',
      'INHFLQ',
      'INHETH',
      'FLQETH',
      'INHFLQETH',
    ]
    const columns = []
    for (let code = 'B'.charCodeAt(0); code <= 'Y'.charCodeAt(0); code += 1) {
      columns.push(String.fromCharCode(code))
    }
    const colDescs = []
    for (const g of columnGroups) {
      for (const sp of g.samples) {
        colDescs.push({ det: g.det, site: g.site, hist: g.hist, sample: sp })
      }
    }
    const mapping = {}
    for (let r = 0; r < rowMetrics.length; r += 1) {
      const rowNum = 19 + r
      const metric = rowMetrics[r]
      for (let c = 0; c < columns.length; c += 1) {
        const col = columns[c]
        const { det, site, hist, sample } = colDescs[c]
        mapping[`${col}${rowNum}`] = `${det}-${site}-${hist}-${sample}-${metric}`
      }
    }
    return mapping
  })(),
]

module.exports = sheets
