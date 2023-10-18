const { compact } = require('lodash')

/**
 * Splits a GeneXpert result text by '|' and returns the array of results.
 * @param {string} resultText The result text to split. E.g: "MTB DETECTED|Rif Resistance NOT DETECTED".
 * @return {Array} Returns the array of results. E.g: ["MTB DETECTED", "Rif Resistance NOT DETECTED"].
 */
const splitResultTextValues = resultText => compact(resultText.split('|'))

/**
 * Sanitizes a result text value by removing all the possible assay-related text. E.g: for "MTB DETECTED" it removes "MTB".
 * @param {string} resultTextValue The result text value to sanitize. E.g: "MTB DETECTED", "Rif Resistance NOT DETECTED", "SARS-CoV-2 POSITIVE".
 * @return {string} Returns the result text sanitized. E.g: "DETECTED", "NOT DETECTED", "POSITIVE".
 */
const sanitizeResultTextValue = resultTextValue =>
  resultTextValue
    .toLowerCase()
    // Result Category 1
    .replace(/mtb/, '')
    .replace(/ebola gp/, '')
    .replace(/hiv-1/, '')
    .replace(/sars-cov-2/, '')
    // Result Category 2 - Rif
    .replace(/rif resistance/, '')
    // Result Category 2 - XDR
    .replace(/(?:very low\s+|low\s+|medium\s+|)inh resistance/, '')
    .replace(/(?:very low\s+|low\s+|medium\s+|)flq resistance/, '')
    .replace(/(?:very low\s+|low\s+|medium\s+|)amk resistance/, '')
    .replace(/(?:very low\s+|low\s+|medium\s+|)kan resistance/, '')
    .replace(/(?:very low\s+|low\s+|medium\s+|)cap resistance/, '')
    .replace(/(?:very low\s+|low\s+|medium\s+|)eth resistance/, '')
    // Result Category 2 - Ebola
    .replace(/ebola np/, '')
    // Needed for cases like 'Low INH Resistance @label_result_detected'
    .replace('  ', ' ')
    .toLowerCase()
    .trim()

module.exports = {
  splitResultTextValues,
  sanitizeResultTextValue,
}
