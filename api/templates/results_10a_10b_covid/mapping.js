module.exports = [
  /**
   * ********************************************************
   * 1st sheet 'DT-TB 10A'
   * ********************************************************
   */
  {
    C6: 'stateName',
    C7: 'lgaName',
    C8: 'siteName',

    M12: 'cntDevices',
    M13: 'cntModules',
    M14: 'cntModulesActive',

    L18: 'cnt_Presumptive_TB_Cases_Invalid',
    M18: 'cnt_Presumptive_TB_Cases_NoResult',
    N18: 'cnt_Presumptive_TB_Cases_Error',

    O18: 'cnt_Presumptive_DR_TB_Cases_Invalid',
    P18: 'cnt_Presumptive_DR_TB_Cases_NoResult',
    Q18: 'cnt_Presumptive_DR_TB_Cases_Error',

    D19: 'cnt_Presumptive_TB_Cases_MtbDetectedRifIndeterminate',
    E19: 'cnt_Presumptive_DR_TB_Cases_MtbDetectedRifIndeterminate',

    /**
     * Block 2
     */
    // Column (1)
    B26: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_all',
    B29: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_Mtb',
    B32: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_MtbRif',
    // Column (2)
    C26: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_all',
    C29: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_Mtb',
    C32: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_MtbRif',
    // Column (3)

    E26: 'cnt_TypeOfPatient_Column_3_all',
    E29: 'cnt_TypeOfPatient_Column_3_Mtb',
    E32: 'cnt_TypeOfPatient_Column_3_MtbRif',
    // Column (4)
    F26: 'cnt_TypeOfPatient_Column_4_all',
    F29: 'cnt_TypeOfPatient_Column_4_Mtb',
    F32: 'cnt_TypeOfPatient_Column_4_MtbRif',
    // Column (5)
    G26: 'cnt_TypeOfPatient_Column_5_all',
    G29: 'cnt_TypeOfPatient_Column_5_Mtb',
    G32: 'cnt_TypeOfPatient_Column_5_MtbRif',
    // Column (6)
    H26: 'cnt_TypeOfPatient_Column_6_all',
    H29: 'cnt_TypeOfPatient_Column_6_Mtb',
    H32: 'cnt_TypeOfPatient_Column_6_MtbRif',
    // Column (7)
    I26: 'cnt_TypeOfPatient_Column_7_all',
    I29: 'cnt_TypeOfPatient_Column_7_Mtb',
    I32: 'cnt_TypeOfPatient_Column_7_MtbRif',
    // Column (8)
    J26: 'cnt_TypeOfPatient_Column_8_all',
    J29: 'cnt_TypeOfPatient_Column_8_Mtb',
    J32: 'cnt_TypeOfPatient_Column_8_MtbRif',
    // Column (9)
    K26: 'cnt_TypeOfPatient_Column_9_all',
    K29: 'cnt_TypeOfPatient_Column_9_Mtb',
    K32: 'cnt_TypeOfPatient_Column_9_MtbRif',
    // Column (10)
    L26: 'cnt_TypeOfPatient_Column_10_all',
    L29: 'cnt_TypeOfPatient_Column_10_Mtb',
    L32: 'cnt_TypeOfPatient_Column_10_MtbRif',
    // Column (11)
    // ---
    O26: 'cnt_TypeOfPatient_Column_11_all_UnknownHistory',
    O27: 'cnt_TypeOfPatient_Column_11_all_New',
    O28: 'cnt_TypeOfPatient_Column_11_all_PrevTreated',
    // ---
    O29: 'cnt_TypeOfPatient_Column_11_Mtb_UnknownHistory',
    O30: 'cnt_TypeOfPatient_Column_11_Mtb_New',
    O31: 'cnt_TypeOfPatient_Column_11_Mtb_PrevTreated',
    // ---
    O32: 'cnt_TypeOfPatient_Column_11_MtbRif_UnknownHistory',
    O33: 'cnt_TypeOfPatient_Column_11_MtbRif_New',
    O34: 'cnt_TypeOfPatient_Column_11_MtbRif_PrevTreated',
    // Column (12)
    // ---
    R26: 'cnt_TypeOfPatient_Column_12_all_UnknownHistory',
    R27: 'cnt_TypeOfPatient_Column_12_all_New',
    R28: 'cnt_TypeOfPatient_Column_12_all_PrevTreated',
    // ---
    R29: 'cnt_TypeOfPatient_Column_12_Mtb_UnknownHistory',
    R30: 'cnt_TypeOfPatient_Column_12_Mtb_New',
    R31: 'cnt_TypeOfPatient_Column_12_Mtb_PrevTreated',
    // ---
    R32: 'cnt_TypeOfPatient_Column_12_MtbRif_UnknownHistory',
    R33: 'cnt_TypeOfPatient_Column_12_MtbRif_New',
    R34: 'cnt_TypeOfPatient_Column_12_MtbRif_PrevTreated',

    /**
     * Block 3 - Number of Presumptive smear negative TB cases
     */
    B39: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_all',
    B41: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_Mtb',
    B43: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_MtbRif',

    C39: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_all',
    C41: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_Mtb',
    C43: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_MtbRif',

    D39: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_all',
    D41: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_Mtb',
    D43: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_MtbRif',
    /**
     * Block 3 - Others (Specify)
     */
    /**
     * Patient History = Unknown History
     */ // =P40+P41+P42+Q40+Q41+Q42+R40+R41
    M40: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_all',
    P40: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_Mtb',
    S40: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_MtbRif',

    M41: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_all',
    P41: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_Mtb',
    S41: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_MtbRif',

    M42: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_all',
    P42: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_Mtb',
    S42: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_MtbRif',
    /**
     * Patient History = New
     */
    N40: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_all',
    Q40: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_Mtb',
    T40: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_MtbRif',

    N41: 'cnt_TypeOfPatient_OtherExtraPulm_New_all',
    Q41: 'cnt_TypeOfPatient_OtherExtraPulm_New_Mtb',
    T41: 'cnt_TypeOfPatient_OtherExtraPulm_New_MtbRif',

    N42: 'cnt_TypeOfPatient_OtherPulmBactConf_New_all',
    Q42: 'cnt_TypeOfPatient_OtherPulmBactConf_New_Mtb',
    T42: 'cnt_TypeOfPatient_OtherPulmBactConf_New_MtbRif',
    /**
     * Patient History = Previously treated
     */
    O40: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_all',
    R40: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_Mtb',
    U40: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_MtbRif',

    O41: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_all',
    R41: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_Mtb',
    U41: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_MtbRif',
  },
  /**
   * ********************************************************
   * 2nd sheet 'DT-TB 10B'
   * ********************************************************
   */
  {
    F9: 'total',
  },
  /**
   * ********************************************************
   * 3rd sheet 'Covid 19'
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
]
