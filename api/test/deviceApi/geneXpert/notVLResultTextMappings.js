const getAssertionItem = (assayExternalId, resultText, resultCategory1ExternalId, resultCategory2ExternalId) => ({
  assayExternalId,
  resultText,
  resultCategory1ExternalId,
  resultCategory2ExternalId,
})

const gxEbola = [
  getAssertionItem('GxEbola', 'DETECTED|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxEbola', 'DETECTED|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxEbola', 'Ebola GP DETECTED|Ebola NP NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxEbola', 'Ebola GP DÉTECTÉ|Ebola NP DÉTECTÉ|', 'Detected', 'Detected'),
  getAssertionItem('GxEbola', 'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ|', 'Detected', 'NotDetected'),
  getAssertionItem('GxEbola', 'Ebola GP NON DÉTECTÉ|Ebola NP DÉTECTÉ|', 'NotDetected', 'Detected'),
  getAssertionItem('GxEbola', 'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ|', 'NotDetected', 'NotDetected'),
  getAssertionItem('GxEbola', 'Ebola GP NOT DETECTED|Ebola NP DETECTED|', 'NotDetected', 'Detected'),
  getAssertionItem('GxEbola', 'Ebola GP NOT DETECTED|Ebola NP NOT DETECTED|', 'NotDetected', 'NotDetected'),
  getAssertionItem('GxEbola', 'ERREUR', 'Error', null),
  getAssertionItem('GxEbola', 'ERREUR|ERREUR|', 'Error', 'Error'),
  getAssertionItem('GxEbola', 'ERROR', 'Error', null),
  getAssertionItem('GxEbola', 'ERROR|ERROR|', 'Error', 'Error'),
  getAssertionItem('GxEbola', 'INVALID|INVALID|', 'Invalid', 'Invalid'),
  getAssertionItem('GxEbola', 'NO RESULT', 'NoResult', null),
  getAssertionItem('GxEbola', 'NO RESULT|NO RESULT|', 'NoResult', 'NoResult'),
  getAssertionItem('GxEbola', 'NON VALIDE', 'Invalid', null),
  getAssertionItem('GxEbola', 'NON VALIDE|NON VALIDE|', 'Invalid', 'Invalid'),
  getAssertionItem('GxEbola', 'NOT DETECTED|DETECTED|', 'NotDetected', 'Detected'),
  getAssertionItem('GxEbola', 'NOT DETECTED|NOT DETECTED|', 'NotDetected', 'NotDetected'),
  getAssertionItem('GxEbola', 'PAS DE RÉSULTAT', 'NoResult', null),
  getAssertionItem('GxEbola', 'Ebola GP DETECTED|Ebola NP DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxEbola', 'INVALID', 'Invalid', null),
]

const gxHiv1Qual = [
  getAssertionItem('GxHiv1Qual', 'ERREUR', 'Error', null),
  getAssertionItem('GxHiv1Qual', 'ERROR', 'Error', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 DETECTED', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 DETECTED|', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 DÉTECTÉ|', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 NON DÉTECTÉ|', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 NOT DETECTED', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'INVALID', 'Invalid', null),
  getAssertionItem('GxHiv1Qual', 'INVALID|', 'Invalid', null),
  getAssertionItem('GxHiv1Qual', 'NO RESULT', 'NoResult', null),
  getAssertionItem('GxHiv1Qual', 'NON VALIDE', 'Invalid', null),
  getAssertionItem('GxHiv1Qual', 'NOT DETECTED||', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'PAS DE RÉSULTAT', 'NoResult', null),
  getAssertionItem('GxHiv1Qual', 'DETECTED|', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'ERROR|', 'Error', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 DÉTECTÉ', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 НЕ ОБНАРУЖЕН', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'HIV-1 ОБНАРУЖЕН', 'Detected', null),
  getAssertionItem('GxHiv1Qual', 'NO RESULT|', 'NoResult', null),
  getAssertionItem('GxHiv1Qual', 'NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxHiv1Qual', 'НЕДЕЙСТВИТЕЛЬНЫЙ', 'Invalid', null),
  getAssertionItem('GxHiv1Qual', 'НЕТ РЕЗУЛЬТАТА', 'NoResult', null),
  getAssertionItem('GxHiv1Qual', 'ОШИБКА', 'Error', null),
]

const gxMtbRif = [
  // getAssertionItem('GxMtbRif', '??? ??????????', 'Error', null), EXCLUDED
  // getAssertionItem('GxMtbRif', '??????', 'Error', null), EXCLUDED
  getAssertionItem('GxMtbRif', 'DETECTADO ALTO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO ALTO|NO DETECTADO|', 'Detected', 'NotDetected'),
  // getAssertionItem('GxMtbRif', 'DETECTADO ALTO|Xpert MTB-RIF Assay G4|', 'Detected', null), EXCLUDED
  getAssertionItem('GxMtbRif', 'DETECTADO ALTO||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTADO BAIXO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO BAIXO|INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'DETECTADO BAIXO||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTADO BAJO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO BAJO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTADO MEDIO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO MEDIO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTADO MUITO BAIXO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO MUITO BAIXO|INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'DETECTADO MUITO BAIXO|NEGAT.|', 'Detected', null),
  getAssertionItem('GxMtbRif', 'DETECTADO MUITO BAIXO||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTADO MUY BAJO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTADO MUY BAJO|INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'DETECTADO MUY BAJO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTED HIGH|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTED HIGH|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTED HIGH|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTED HIGH|NOT DE|', 'Detected', null),
  getAssertionItem('GxMtbRif', 'DETECTED HIGH||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTED LOW|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTED LOW|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTED LOW|NOT DETEC|', 'Detected', null),
  getAssertionItem('GxMtbRif', 'DETECTED LOW||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTED MEDIUM|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTED MEDIUM|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTED MEDIUM|NEG|', 'Detected', null),
  getAssertionItem('GxMtbRif', 'DETECTED MEDIUM|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTED MEDIUM||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'DETECTED VERY LOW|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'DETECTED VERY LOW|INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'DETECTED VERY LOW|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'DETECTED VERY LOW||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'ERREUR', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERRO', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR', 'Error', null),
  // getAssertionItem('GxMtbRif', 'ERROR', 'Error', 'Exclude (Test/Training)'), EXCLUDED
  getAssertionItem('GxMtbRif', 'ERROR', 'Error', null),
  // getAssertionItem('GxMtbRif', 'ERROR', 'Error', 'NotDetected') EXCLUDED,
  getAssertionItem('GxMtbRif', 'ERROR |ERROR', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR |NO RESULT', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR |null', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|ERROR|', 'Error', null),
  // getAssertionItem('GxMtbRif', 'ERROR|ERROR|', 'Error', 'NotDetected'), Excluded (incorrect)
  // getAssertionItem('GxMtbRif', 'ERROR|ERROR|', 'Error', 'Detected'), Excluded (incorrect)
  // getAssertionItem('GxMtbRif', 'ERROR|INVALID|', 'Error', null), EXCLUDED (only 10 cases)
  getAssertionItem('GxMtbRif', 'ERROR|NA|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|NEG|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|NO RESULT|', 'Error', null),
  // getAssertionItem('GxMtbRif', 'ERROR|NO RESULT|', 'NoResult', null), EXCLUDED (only 29 cases)
  getAssertionItem('GxMtbRif', 'ERROR|NOT DETECTED|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|PASS|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|POS|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR|Rif Resistance NOT DETECTED|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERROR||', 'Error', null),
  getAssertionItem('GxMtbRif', '@label_result_error||', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERRO|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERRO|ERRO|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERRO|NEGAT.|', 'Error', null),
  getAssertionItem('GxMtbRif', 'ERRO||', 'Error', null),
  getAssertionItem('GxMtbRif', 'INVALID', 'Invalid', null),
  // getAssertionItem('GxMtbRif', 'INVALID', 'Invalid', 'Exclude (Test/Training)'), EXCLUDED (not a real case, will end on null)
  // getAssertionItem('GxMtbRif', 'INVALID', 'Invalid', 'Invalid'), EXCLUDED (incorrect)
  // getAssertionItem('GxMtbRif', 'INVALID |INVALID', 'Invalid', 'Invalid'), EXCLUDED (incorrect)
  getAssertionItem('GxMtbRif', 'INVALID |null', 'Invalid', null),
  // getAssertionItem('GxMtbRif', 'INVALID |Rif Resistance NOT DETECTED', 'Invalid', 'NotDetected'), EXCLUDED (only 1 case)
  getAssertionItem('GxMtbRif', 'INVÁLIDO', 'Invalid', null),
  getAssertionItem('GxMtbRif', 'INVALID|FAIL|', 'Invalid', null),
  getAssertionItem('GxMtbRif', 'INVALID|INVALID|', 'Invalid', null),
  // getAssertionItem('GxMtbRif', 'INVALID|INVALID|', 'Invalid', 'NotDetected'), EXCLUDED (strange case)
  getAssertionItem('GxMtbRif', 'INVALID||', 'Invalid', null),
  getAssertionItem('GxMtbRif', 'MTB  NÃO DETECTADO', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB  NÃO DETECTADO||', 'NotDetected', null),
  // getAssertionItem('GxMtbRif', 'MTB ?? ?????????', 'NotDetected', null), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ????? ??????|Rif Resistance ?? ?????????', 'Detected', 'NotDetected'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ????? ??????|Rif Resistance ?????????', 'Detected', 'Detected'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ????? ??????|Rif Resistance ??????????????', 'Detected', 'Indeterminate'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ???????|Rif Resistance ?? ?????????', 'Detected', 'NotDetected'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ???????|Rif Resistance ?????????', 'Detected', 'Detected'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ??????|Rif Resistance ?? ?????????', 'Detected', 'NotDetected'), EXCLUDED (cases only happened in 2018)
  // getAssertionItem('GxMtbRif', 'MTB ????????? ??????|Rif Resistance ?????????', 'Detected', 'Detected'), EXCLUDED (cases only happened in 2018)
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO ALTO|Rif Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAJO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO BAJO|Rif Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MEDIO|Rif Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUY BAJO|Rif Resistance DETECTADO', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTADO MUY BAJO|Rif Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ BAS|Rif Resistance DÉTECTÉ|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance DÉTECTÉ|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ MOYEN|Rif Resistance DÉTECTÉ|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ TRÈS BAS|Rif Resistance DÉTECTÉ|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ TRÈS BAS|Rif Resistance INDÉTERMINÉ', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ TRÈS BAS|Rif Resistance NON DÉTECTÉ', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DÉTECTÉ TRÈS BAS|Rif Resistance NON DÉTECTÉ|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED', 'Detected', null),
  // getAssertionItem('GxMtbRif', 'MTB DETECTED', 'Detected', 'Invalid'), EXCLUDED (special case)
  // getAssertionItem('GxMtbRif', 'MTB DETECTED', 'Detected', 'Error'), EXCLUDED (special case)
  // getAssertionItem('GxMtbRif', 'MTB DETECTED', 'Detected', 'NotDetected'), EXCLUDED (special case)
  // getAssertionItem('GxMtbRif', 'MTB DETECTED', 'Detected', 'Detected'), EXCLUDED (special case)
  // getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|NO RESULT', 'NoResult', null), EXCLUDED (special case)
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|null', 'Detected', null),
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|Rif Resistance DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|Rif Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED HIGH|Rif Resistance NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW|null', 'Detected', null),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW|Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW|Rif Resistance DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW|Rif Resistance NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED LOW||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|NO RESULT', 'Detected', 'NoResult'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|null', 'Detected', null),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|Rif Resistance DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED MEDIUM||', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|ERROR', 'Detected', 'Error'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|NA|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|NO RESULT', 'Detected', 'NoResult'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|null', 'Detected', null),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED |Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB NÃO DETECTADO', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NÃO DETECTADO||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NO DETECTADO', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NON DÉTECTÉ', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NON DÉTECTÉ||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |ERROR', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |INVALID', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |NO RESULT', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |null', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |Rif Resistance INDETERMINATE', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED |Rif Resistance NOT DETECTED', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED|Rif Resistance NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB @label_result_not_detected||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB НЕ ОБНАРУЖЕН', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB НЕ ОБНАРУЖЕН||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ', 'Detected', 'Indeterminate'),
  getAssertionItem(
    'GxMtbRif',
    'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ|',
    'Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН|', 'Detected', 'Detected'),
  // getAssertionItem('GxMtbRif', 'MTB|DETECTED|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB|ERROR|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB|INVALID|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB|NOT DETECTED|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB|Rif Resistance DETECTED|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB|Rif Resistance NOT DETECTED|', 'Error', null), EXCLUDED (not sure how to parse it)
  // getAssertionItem('GxMtbRif', 'MTB||', 'Error', null), EXCLUDED (not sure how to parse it)
  getAssertionItem('GxMtbRif', 'NO DETECTADO||', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NO RESULT', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT |ERROR', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT |NO RESULT', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT |null', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT |Rif Resistance NOT DETECTED', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|ERROR|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|INVALID|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|NEG|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|NO RESULT|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|NOT DETECTED|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|PASS|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|POS|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|Rif Resistance NOT DETECTED|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NO RESULT||', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'NON VALIDE', 'Invalid', null),
  // getAssertionItem('GxMtbRif', 'NoResult', 'Error', null), EXCLUDED (not so many cases)
  getAssertionItem('GxMtbRif', 'NOT DETECTED |null', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|DETECTED|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|ERROR|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|INVALID|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|NEG|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|POS|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED|ST|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'NOT DETECTED||', 'NotDetected', null),
  // getAssertionItem('GxMtbRif', 'null null|ERROR', 'NotDetected', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|ERROR', 'Detected', 'Error'), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|INVALID', 'Detected', 'Invalid'), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|NO RESULT', 'NoResult', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|null', 'Error', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|null', 'NotDetected', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|null', 'Detected', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|Rif Resistance INDETERMINATE', 'Detected', 'Indeterminate'), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|Rif Resistance NOT DETECTED', 'Invalid', 'NotDetected'), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|Rif Resistance NOT DETECTED', 'NotDetected', null), EXCLUDED (only reported on 2014)
  // getAssertionItem('GxMtbRif', 'null null|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'), EXCLUDED (only reported on 2014)
  getAssertionItem('GxMtbRif', 'PAS DE RÉSULTAT', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SEM RESULTADO', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SEM RESULTADO|NEGAT.|', 'NoResult', null),
  getAssertionItem('GxMtbRif', '@label_result_no_result||', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SEM RESULTADO|SEM RESULTADO|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SEM RESULTADO||', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SIN RESULTADO', 'NoResult', null),
  // getAssertionItem('GxMtbRif', 'Trace DETECTED||', 'Trace', 'Indeterminate'), EXCLUDED (Should be GxMtbRifUltra)
  getAssertionItem('GxMtbRif', 'НЕДЕЙСТВИТЕЛЬНЫЙ', 'Invalid', null),
  getAssertionItem('GxMtbRif', 'НЕТ РЕЗУЛЬТАТА', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'ОШИБКА', 'Error', null),
  getAssertionItem('GxMtbRif', 'MTB NOT DETECTED|', 'NotDetected', null),
  getAssertionItem('GxMtbRif', 'INVALID|', 'Invalid', null),
  getAssertionItem('GxMtbRif', '@label_result_invalid|', 'Invalid', null),
  getAssertionItem('GxMtbRif', 'NO RESULT|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SEM RESULTADO|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'SIN RESULTADO|SIN RESULTADO|', 'NoResult', null),
  getAssertionItem('GxMtbRif', 'MTB DETECTED|Rif Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRif', 'MTB DETECTED|Rif Resistance NOT DETECTED', 'Detected', 'NotDetected'),
]

const gxMtbRifUltra = [
  getAssertionItem('GxMtbRifUltra', 'DETECTADO ALTO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO ALTO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO BAIXO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO BAIXO|INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO BAJO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO BAJO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO MEDIO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO MUITO BAIXO|DETECTADO|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO MUITO BAIXO|INDETERMINADO|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTADO MUY BAJO|NO DETECTADO|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED HIGH|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRifUltra', 'DETECTED HIGH|DETECTED|', 'Detected', 'Detected'),

  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_high||RIF Resistance @label_result_not_detected',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_low||RIF Resistance @label_result_not_detected',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_medium||RIF Resistance @label_result_not_detected',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_very_low||RIF Resistance @label_result_not_detected',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_low||RIF Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_high||RIF Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_medium||RIF Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB Trace @label_result_detected|RIF Resistance @label_result_indeterminate',
    'Trace Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRifUltra', 'DETECTED HIGH|INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED HIGH|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED LOW|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRifUltra', 'DETECTED LOW|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED LOW|INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED LOW|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED MEDIUM|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRifUltra', 'DETECTED MEDIUM|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED MEDIUM|INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED MEDIUM|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED VERY LOW|', 'Detected', null), // Category 2 set as INDETERMINATE in GxAlert
  getAssertionItem('GxMtbRifUltra', 'DETECTED VERY LOW|DETECTED|', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED VERY LOW|INDETERMINATE|', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'DETECTED VERY LOW|NOT DETECTED|', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO ALTO||RIF Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO ALTO||RIF Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO BAIXO||RIF Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO BAJO||RIF Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO MÉDIO||RIF Resistance NÃO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO MEDIO||RIF Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTADO MUY BAJO||RIF Resistance NO DETECTADO', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED HIGH||RIF Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED HIGH||RIF Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED HIGH||RIF Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED LOW||RIF Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED LOW||RIF Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED LOW||RIF Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED MEDIUM||RIF Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED MEDIUM||RIF Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED VERY LOW||RIF Resistance DETECTED', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED VERY LOW||RIF Resistance INDETERMINATE', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'MTB DETECTED VERY LOW||RIF Resistance NOT DETECTED', 'Detected', 'NotDetected'),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB Trace DETECTADO|RIF Resistance INDETERMINADO',
    'Trace Detected',
    'Indeterminate'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB Trace DETECTED|RIF Resistance INDETERMINATE',
    'Trace Detected',
    'Indeterminate'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB Trace ОБНАРУЖЕН|RIF Resistance НЕОПРЕДЕЛЕННЫЙ',
    'Trace Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН ВЫСОКИЙ||RIF Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB ОБНАРУЖЕН ВЫСОКИЙ||RIF Resistance НЕОПРЕДЕЛЕННЫЙ',
    'Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН ВЫСОКИЙ||RIF Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН НИЗКИЙ||RIF Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН НИЗКИЙ||RIF Resistance НЕОПРЕДЕЛЕННЫЙ', 'Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН НИЗКИЙ||RIF Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ||RIF Resistance НЕ ОБНАРУЖЕН',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ||RIF Resistance НЕОПРЕДЕЛЕННЫЙ',
    'Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ||RIF Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН СРЕДНИЙ||RIF Resistance НЕ ОБНАРУЖЕН', 'Detected', 'NotDetected'),
  getAssertionItem(
    'GxMtbRifUltra',
    'MTB ОБНАРУЖЕН СРЕДНИЙ||RIF Resistance НЕОПРЕДЕЛЕННЫЙ',
    'Detected',
    'Indeterminate'
  ),
  getAssertionItem('GxMtbRifUltra', 'MTB ОБНАРУЖЕН СРЕДНИЙ||RIF Resistance ОБНАРУЖЕН', 'Detected', 'Detected'),
  getAssertionItem('GxMtbRifUltra', 'Trace DETECTED|INDETERMINADO|', 'Trace Detected', 'Indeterminate'),
  getAssertionItem('GxMtbRifUltra', 'Trace DETECTED|INDETERMINATE|', 'Trace Detected', 'Indeterminate'),
]

const gxMtbXdr = [
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_detected|AMK Resistance @label_result_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_detected|ETH Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_detected|AMK Resistance @label_result_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_indeterminate|KAN Resistance @label_result_detected|CAP Resistance @label_result_indeterminate|ETH Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected|Low FLQ Resistance @label_result_detected||AMK Resistance @label_result_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_detected|ETH Resistance @label_result_detected',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected',
    'Detected',
    'NotDetected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_invalid',
    'Detected',
    'Invalid'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_detected||INH Resistance @label_result_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_invalid',
    'Detected',
    'Detected'
  ),
  getAssertionItem(
    'GxMtbXdr',
    '|MTB @label_result_error||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_invalid',
    'Error',
    null
  ),
]

const assayGxCovid19 = [
  getAssertionItem('assayGXCovid19', 'ERROR', 'Error', null),
  getAssertionItem('assayGXCovid19', 'ERROR|', 'Error', null),
  getAssertionItem('assayGXCovid19', 'INVALID', 'Invalid', null),
  getAssertionItem('assayGXCovid19', 'INVALID|', 'Invalid', null),
  getAssertionItem('assayGXCovid19', 'NEGATIVE|', 'Negative', null),
  getAssertionItem('assayGXCovid19', 'NO RESULT', 'NoResult', null),
  getAssertionItem('assayGXCovid19', 'NO RESULT|', 'NoResult', null),
  getAssertionItem('assayGXCovid19', 'POSITIVE|', 'Positive', null),
  getAssertionItem('assayGXCovid19', 'PRESUMPTIVE POS|', 'PresumptivePositive', null),
  getAssertionItem('assayGXCovid19', 'SARS-CoV-2 NEGATIVE', 'Negative', null),
  getAssertionItem('assayGXCovid19', 'SARS-CoV-2 POSITIVE', 'Positive', null),
  // getAssertionItem('assayGXCovid19', 'SARS-CoV-2 PRESUMPTIVE POS', 'Error', null), EXCLUDED (incorrect)
  getAssertionItem('assayGXCovid19', 'SARS-CoV-2 PRESUMPTIVE POS', 'PresumptivePositive', null),
  getAssertionItem('assayGXCovid19', 'SARS-CoV-2 ОТРИЦАТЕЛЬНЫЙ', 'Negative', null),
  getAssertionItem('assayGXCovid19', 'SARS-CoV-2 ПОЛОЖИТЕЛЬНЫЙ', 'Positive', null),
  // getAssertionItem('assayGXCovid19', 'SARS-CoV-2 ПРЕДПОЛ. ПОЛОЖ', 'Error', null), EXCLUDED (only happened one day)
  getAssertionItem('assayGXCovid19', 'НЕДЕЙСТВИТЕЛЬНЫЙ', 'Invalid', null),
  getAssertionItem('assayGXCovid19', 'НЕТ РЕЗУЛЬТАТА', 'NoResult', null),
  getAssertionItem('assayGXCovid19', 'ОШИБКА', 'Error', null),
]

module.exports = {
  gxEbola,
  gxHiv1Qual,
  gxMtbRif,
  gxMtbRifUltra,
  assayGxCovid19,
  gxMtbXdr,
}
