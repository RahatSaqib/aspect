const { sanitizeResultTextValue } = require('./utils')

const result1CategoryMapping = {
  'not detected': 'NotDetected',
  'não detectado': 'NotDetected',
  'не обнаружен': 'NotDetected',
  'non détecté': 'NotDetected',
  'no detectado': 'NotDetected',
  '@label_result_not_detected': 'NotDetected',
  detected: 'Detected',
  'very low @label_result_detected': 'Detected',
  'low @label_result_detected': 'Detected',
  'medium @label_result_detected': 'Detected',
  'high @label_result_detected': 'Detected',
  '@label_result_detected': 'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_very_low':
    'Detected',
  'detected very low': 'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_low':
    'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_medium':
    'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_high':
    'Detected',
  'detected low': 'Detected',
  'detected medium': 'Detected',
  'detected high': 'Detected',
  detectado: 'Detected',
  'detectado alto': 'Detected',
  'detectado médio': 'Detected',
  'detectado baixo': 'Detected',
  'detectado muito baixo': 'Detected',
  обнаружен: 'Detected',
  'обнаружен очень низкий': 'Detected',
  'обнаружен низкий': 'Detected',
  'обнаружен средний': 'Detected',
  'обнаружен высокий': 'Detected',
  détecté: 'Detected',
  'détecté très bas': 'Detected',
  'détecté bas': 'Detected',
  'détecté moyen': 'Detected',
  'détecté élevé': 'Detected',
  'detectado muy bajo': 'Detected',
  'detectado bajo': 'Detected',
  'detectado medio': 'Detected',
  invalid: 'Invalid',
  inválido: 'Invalid',
  недействительный: 'Invalid',
  'non valide': 'Invalid',
  ungültig: 'Invalid',
  'no válido': 'Invalid',
  '@label_result_invalid': 'Invalid',
  'non valido': 'Invalid',
  'tidak valid': 'Invalid',
  nieważny: 'Invalid',
  'no result': 'NoResult',
  '@label_result_no_result': 'NoResult',
  'sem resultado': 'NoResult',
  безрезультатно: 'NoResult',
  'sans résultat': 'NoResult',
  'sin resultado': 'NoResult',
  'pas de résultat': 'NoResult',
  'kein ergebnis': 'NoResult',
  'nessun risultato': 'NoResult',
  'нет результата': 'NoResult',
  'немає результату': 'NoResult',
  'tanpa hasil': 'NoResult',
  'brak wyniku': 'NoResult',
  error: 'Error',
  '@label_result_error': 'Error',
  erro: 'Error',
  ошибка: 'Error',
  erreur: 'Error',
  fehler: 'Error',
  errore: 'Error',
  недійсний: 'Error',
  kesalahan: 'Error',
  błąd: 'Error',
  negative: 'Negative',
  négatif: 'Negative',
  отрицательный: 'Negative',
  negativo: 'Negative',
  negativ: 'Negative',
  помилка: 'Negative',
  negatif: 'Negative',
  '@label_result_negative': 'Negative',
  ujemny: 'Negative',
  positive: 'Positive',
  positivo: 'Positive',
  положительный: 'Positive',
  positif: 'Positive',
  positiv: 'Positive',
  позитивний: 'Positive',
  dodatni: 'Positive',
  '@label_result_positive': 'Positive',
  'presumptive positive': 'PresumptivePositive',
  'presumptive pos': 'PresumptivePositive',
  '@label_result_presumptive_positive': 'PresumptivePositive',
  'presumptive posit': 'PresumptivePositive',
  'presuntivo positivo': 'PresumptivePositive',
  'предположительный положительный': 'PresumptivePositive',
  'présomptif positif': 'PresumptivePositive',
  'предположительно пол': 'PresumptivePositive',
  негативний: 'PresumptivePositive',
  'praduga pos': 'PresumptivePositive',
  przypuszczalnego: 'PresumptivePositive',
  'null null': 'Success',
  'trace detected': 'Trace Detected',
  'trace detectado': 'Trace Detected',
  'trace обнаружен': 'Trace Detected',
  'trace @label_result_detected': 'Trace Detected',
}

const result2CategoryMapping = {
  'not detected': 'NotDetected',
  'não detectado': 'NotDetected',
  'не обнаружен': 'NotDetected',
  'non détecté': 'NotDetected',
  'no detectado': 'NotDetected',
  '@label_result_not_detected': 'NotDetected',
  detected: 'Detected',
  'very low @label_result_detected': 'Detected',
  'low @label_result_detected': 'Detected',
  'medium @label_result_detected': 'Detected',
  'high @label_result_detected': 'Detected',
  '@label_result_detected': 'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_very_low':
    'Detected',
  'detected very low': 'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_low':
    'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_medium':
    'Detected',
  '@label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_high':
    'Detected',
  detectado: 'Detected',
  обнаружен: 'Detected',
  détecté: 'Detected',
  indeterminate: 'Indeterminate',
  '@label_result_indeterminate': 'Indeterminate',
  indeterminado: 'Indeterminate',
  неопределенный: 'Indeterminate',
  indéterminé: 'Indeterminate',
  error: 'Error',
  erro: 'Error',
  ошибка: 'Error',
  erreur: 'Error',
  fehler: 'Error',
  errore: 'Error',
  '@label_result_error': 'Error',
  недійсний: 'Error',
  kesalahan: 'Error',
  błąd: 'Error',
  invalid: 'Invalid',
  '@label_result_invalid': 'Invalid',
  inválido: 'Invalid',
  недействительный: 'Invalid',
  'non valide': 'Invalid',
  ungültig: 'Invalid',
  'no válido': 'Invalid',
  'non valido': 'Invalid',
  'tidak valid': 'Invalid',
  nieważny: 'Invalid',
  'no result': 'NoResult',
  'sem resultado': 'NoResult',
  безрезультатно: 'NoResult',
  'sans résultat': 'NoResult',
  'sin resultado': 'NoResult',
  'pas de résultat': 'NoResult',
  'kein ergebnis': 'NoResult',
  'nessun risultato': 'NoResult',
  'нет результата': 'NoResult',
  'немає результату': 'NoResult',
  'tanpa hasil': 'NoResult',
  '@label_result_no_result': 'NoResult',
  'brak wyniku': 'NoResult',
}

const mtbPositiveResultCategories = [
  result1CategoryMapping.detected,
  result1CategoryMapping.success,
  result1CategoryMapping['trace detected'],
]

const errorResultCategories = [
  result1CategoryMapping.error,
  result1CategoryMapping.invalid,
  result1CategoryMapping['no result'],
]

const isMtbPositiveOrError = resultTextValues =>
  mtbPositiveResultCategories.includes(
    result1CategoryMapping[sanitizeResultTextValue(resultTextValues[0])]
  )

const defaultResultCategory2Map = resultTextValues => {
  const result2Text = sanitizeResultTextValue(resultTextValues[1])
  return result2CategoryMapping[result2Text]
}

const allowedResultCategory2Mappings = {
  GxMtbXdr: {
    isAllowed: isMtbPositiveOrError,
    map: resultTextValues => {
      const result1 =
        result1CategoryMapping[sanitizeResultTextValue(resultTextValues[0])]
      if (errorResultCategories.includes(result1)) return result1

      // Get the first positive result present in the results chain...
      const resultCategory2Values = resultTextValues.slice(1)
      const positiveResult = resultCategory2Values.find(resultTextValue => {
        console.log(resultTextValue, sanitizeResultTextValue(resultTextValue), result2CategoryMapping[sanitizeResultTextValue(resultTextValue)])
        const mappedResult =
          result2CategoryMapping[sanitizeResultTextValue(resultTextValue)]
        return (
          mappedResult && mtbPositiveResultCategories.includes(mappedResult)
        )
      })

      // ...then return DETECTED if at least one resistance result is positive
      if (positiveResult) return result2CategoryMapping.detected

      const errorResult = resultCategory2Values.find(resultTextValue => {
        const mappedResult =
          result2CategoryMapping[sanitizeResultTextValue(resultTextValue)]
        return mappedResult && errorResultCategories.includes(mappedResult)
      })
      // ...or return error if at least one resistance result is error
      if (errorResult)
        return result2CategoryMapping[sanitizeResultTextValue(errorResult)]

      // ...or not detected as default
      return result2CategoryMapping['not detected']
    },
  },
  GxMtbRifUltra: {
    isAllowed: isMtbPositiveOrError,
    map: defaultResultCategory2Map,
  },
  GxMtbRif: {
    isAllowed: isMtbPositiveOrError,
    map: defaultResultCategory2Map,
  },
  GxEbola: {
    isAllowed: () => true,
    map: defaultResultCategory2Map,
  },
}

/**
 * For the given assay and result text values, obtains the result category 2 external id.
 * @param {string} assayExternalId The external id of the result's assay
 * @param {Array} resultTextValues The array of text values generated by splitting the original result text by '|'. Ex.: ['mtb detected', 'rif resistance not detected']
 * @returns The result category 2 external id (Ex.: 'NotDetected', 'Detected', etc). Returns null if the result category 2 does not apply.
 */
const mapResultCategory2 = (assayExternalId, resultTextValues) => {
  const mapping =
    resultTextValues.length > 1 &&
    allowedResultCategory2Mappings[assayExternalId]
  if (mapping && mapping.isAllowed(resultTextValues)) {
    const { map } = mapping
    return map(resultTextValues)
  }

  return null
}

module.exports = {
  result1CategoryMapping,
  result2CategoryMapping,
  mapResultCategory2,
}
