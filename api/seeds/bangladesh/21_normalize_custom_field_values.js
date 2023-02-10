module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  // Use values instead of keys of custom fields options

  // Type of patient
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Failures of Category I') WHERE patientData->>'$.TypeOfPatient'='Failures_of_Category_I' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Non converters of Category I') WHERE patientData->>'$.TypeOfPatient'='Non_converters_of_Category_I' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Failures of Retreatment') WHERE patientData->>'$.TypeOfPatient'='Failures_of_Retreatment' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Non converters of Retreatment') WHERE patientData->>'$.TypeOfPatient'='Non_converters_of_Retreatment' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Treatment after loss to follow up') WHERE patientData->>'$.TypeOfPatient'='Treatment_after_loss_to_follow_up' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Close contacts of DR TB patient with symptoms') WHERE patientData->>'$.TypeOfPatient'='Close_contacts_of_DR_TB_patient_with_symptoms' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'HIV infected person, with TB S/S') WHERE patientData->>'$.TypeOfPatient'='HIV_infected_person_with_TB_SS' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Others - Pulmonary, clinically diagnosed') WHERE patientData->>'$.TypeOfPatient'='Others_Pulmonary_clinically_diagnosed' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Others - Extra Pulmonary') WHERE patientData->>'$.TypeOfPatient'='Others_Extra_Pulmonary' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Others - Pulmonary, Bacteriologically Confirmed') WHERE patientData->>'$.TypeOfPatient'='Others_Pulmonary_Bacteriologically_Confirmed' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Presumptive Pulmonary Smear Negative TB Cases') WHERE patientData->>'$.TypeOfPatient'='Presumptive_Pulmonary_Smear_Negative_TB_Cases' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.TypeOfPatient', 'Presumptive TB') WHERE patientData->>'$.TypeOfPatient'='Presumptive_TB' AND id > 0;`
  )

  // Patient history
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.PatientHistory', 'Unknown history') WHERE patientData->>'$.PatientHistory'='unknown' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.PatientHistory', 'New') WHERE patientData->>'$.PatientHistory'='new' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.PatientHistory', 'Previously treated') WHERE patientData->>'$.PatientHistory'='treated' AND id > 0;`
  )

  // Patient retreatment
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.PatientRetreatment', 'Category I') WHERE patientData->>'$.PatientRetreatment'='Category-I' AND id > 0;`
  )

  // HIV status
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.HIVStatus', 'Positive') WHERE patientData->>'$.HIVStatus'='positive' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.HIVStatus', 'Negative') WHERE patientData->>'$.HIVStatus'='negative' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.HIVStatus', 'Unknown') WHERE patientData->>'$.HIVStatus'='unknown' AND id > 0;`
  )

  // Sample type
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.SampleType', 'Pulmonary') WHERE patientData->>'$.SampleType'='pulmonary' AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.SampleType', 'Extra-pulmonary') WHERE patientData->>'$.SampleType'='extra' AND id > 0;`
  )

  // Repeat test
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.RepeatTest', 'First or second') WHERE patientData->>'$.RepeatTest'=0 AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.RepeatTest', 'Follow-up') WHERE patientData->>'$.RepeatTest'=1 AND id > 0;`
  )
  await knex.raw(
    `UPDATE Result SET patientData = JSON_SET(patientData, '$.RepeatTest', 'Repeat Baseline') WHERE patientData->>'$.RepeatTest'=2 AND id > 0;`
  )
}
