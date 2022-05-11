const pick = require('lodash/pick')
const { objectHasValues } = require('../common/utils')
const { convertStringToFloat } = require('../../../shared/string')

const sampleTypeMapping = {
  Sputum: 'Sputum',
  CSF: 'CSF',
  'Pleural Fluid': 'Effusion',
  'Ascitic Fluid': 'Effusion',
  'Pericardial Fluid': 'Effusion',
  'Peritoneal Fluid': 'Effusion',
  'Pleural Fluid (L.)': 'Effusion',
  'Pleural Effusion Aspirate': 'Effusion',
  'Pleural Fluid (Left)': 'Effusion',
  'Pleural Fluid (Right)': 'Effusion',
  'Pleural Effusion': 'Effusion',
  'Retroperitoneal Fluid': 'Effusion',
  'Pleural Fluid (R.)': 'Effusion',
  'Gastric Aspirate': 'Gastric Lavage',
  'Gastric fluid': 'Gastric Lavage',
  'Wound Discharge': 'Pus',
  'Wound Secretion': 'Pus',
  Isolates: 'Isolate',
  Others: 'Other',
}

const mapPatientData = (payload, ntrlLabRequestId) => {
  let patientNameId = payload['Last Name'] || ''
  if (payload['First Name']) {
    if (patientNameId) {
      patientNameId += ', '
    }
    patientNameId += payload['First Name']
  }
  if (patientNameId && payload['Middle Name']) {
    patientNameId += ` ${payload['Middle Name']}`
  }
  const ageSex = payload['Age / Sex']
  let age = null
  let sex = null
  if (ageSex) {
    const ageSexRegex = /(\d*)(\s?[|m|o|s]*)(\/|\?)(m|f)/gi
    const ageSexRegexMatch = ageSexRegex.exec(ageSex)
    if (ageSexRegexMatch) {
      age = convertStringToFloat(ageSexRegexMatch[1])
      if (age && ageSexRegexMatch[2]) {
        age /= 10
      }
      if (ageSexRegexMatch[4]) {
        sex = { M: 'Male', F: 'Female' }[ageSexRegexMatch[4]]
      }
    }
  }
  return {
    id:
      payload['RITM Hospital No'] ||
      patientNameId ||
      payload['Laboratory No'] ||
      ntrlLabRequestId,
    serialNumber: payload['Serial Code RN-14-'],
    referringHealthFacility: payload.Address || payload['Referring Facility'],
    requestingPhysician: payload.Requisitioner,
    facilityContactNumber: payload['Facility Contact Number'],
    lastName: payload['Last Name'],
    firstName: payload['First Name'],
    middleInitialOrName: payload['Middle Name'],
    dateOfAdmission: payload['Date of Admission'],
    age,
    sex,
    phone: payload['Patient Contact Number'],
    dateOfBirth: payload['Date of Birth'],
    address: payload.Address,
    paragioniamiasisResult1: payload['Paragioniamiasis Result 1'],
    paragioniamiasisResult2: payload['Paragioniamiasis Result 2'],
    treatmentCategory: payload['History of Treatment'],
    registrationGroup: payload['Registration Group'],
    treatmentSchedule: payload['Reason for Examination'],
    typeOfSpecimen: payload['Specimen Type'],
    accessionNo: payload['Accession No'],
    testRequestedSmear: payload.Smear,
    testRequestedCulture: payload.Culture,
    testRequestedDst: payload.DST,
    testRequestedGx: payload.GeneXpert,
    testRequestedTbLamp: payload['Test Requested TB LAMP'],
    dateTransferedToDst: payload['Date transfered to DST'],
    cultureMethod: payload['Culture Method'],
    presumptiveDsOrDr: payload['Presumptive DS or DR'],
    dateReceived: payload['Date and Time of Specimen Receipt'],
    labNo1: payload['Laboratory No'],
    tbCaseNumber: payload['RITM Hospital No'],
    dateCollected1: payload['Date and Time of Specimen Collection'],
    dateDispatched: payload['Date Dispatch'],
    encodedBy: payload['MRF Encoded by'],
    dateEncoded: payload['MRF Date Encoded'],
    healthCareSystem: 'RITM',
  }
}

const resultDataMappings = {
  dst: {
    mapResultData: payload => {
      return {
        encodedResult: {
          testRequested: payload['DST Laboratory Test Performed'],
          idResult: payload['DST Final Result'] || payload['TBC FINAL RESULT'],
          streptomycin: payload.Streptomycin,
          isoniazid: payload.Isoniazid,
          rifampicin: payload.Rifampicin,
          ethambutol: payload.Ethambutol,
          pyrazinamide: payload.Pyrazinamide,
          kanamycin: payload.Kanamycin,
          levofloxacin: payload.Levofloxacin,
          amikacin: payload.Amikacin,
          capreomycin: payload.Capreomycin,
          ofloxacin: payload.Ofloxacin,
          moxifloxacin: payload.Moxifloxacin,
          methodUsed: payload['DST Laboratory Test Performed'],
          remarks: payload['DST Comments'],
          dateReleased: payload['Date and Time of Release of DST Result'],
          labTech: payload['DST Performed by'],
          encodedBy: payload['DST Encoded by'],
          reviewedBy: payload['DST Validated by'],
          notedBy: payload['DST Noted by'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'Streptomycin',
          'Isoniazid',
          'Rifampicin',
          'Ethambutol',
          'Pyrazinamide',
          'Kanamycin',
          'Levofloxacin',
          'Amikacin',
          'Capreomycin',
          'Ofloxacin',
          'Date and Time of Release of DST Result',
        ])
      ) || payload['DST Final Result'],
  },
  culture: {
    mapResultData: payload => {
      return {
        encodedResult: {
          medTech: payload['TBC Performed by'],
          methodUsed1: payload['TBC Laboratory Test Performed'],
          result1: payload['TBC Test Result 1st Sample'],
          result2: payload['TBC Test Result 2nd Sample'],
          result3: payload['TBC Test Result 3rd Sample'],
          finalResult: payload['TBC FINAL RESULT'],
          remarks: payload['TBC Comments'],
          dateReleased: payload['Date and Time of Release of TBC Result'],
          encodedBy: payload['TBC Encoded by'],
          validatedBy: payload['TBC Validated by'],
          notedBy: payload['TBC Noted by'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'TBC Test Result 1st Sample',
          'TBC Test Result 2nd Sample',
          'TBC Test Result 3rd Sample',
          'TBC FINAL RESULT',
          'Date and Time of Release of TBC Result',
        ])
      ),
  },
  smear: {
    mapResultData: payload => {
      return {
        encodedResult: {
          smearMethod:
            payload['Laboratory Test Performed Acid Fast Bacili Microscopy'],
          smearDateCollected1: payload['Smear Result 1 Date Collected'],
          smearResult1: payload['Smear Result 1'],
          smearDateCollected2: payload['Smear Result 2 Date Collected'],
          smearResult2: payload['Smear Result 2'],
          smearDateCollected3: payload['Smear Result 3 Date Collected'],
          smearResult3: payload['Smear Result 3'],
          finalResult: payload['FINAL RESULT'],
          dateReleased: payload['Date and Time of Release of AFB Result'],
          comments: payload.Comments,
          encodedBy: payload['Smear Encoded by'],
          laboratoryTechnician: payload['Performed by'],
          validatedBy: payload['Validated by'],
          notedBy: payload['Noted by'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'Smear Result 1',
          'Smear Result 2',
          'Smear Result 3',
          'FINAL RESULT',
          'Date and Time of Release of AFB Result',
        ])
      ),
  },
  genexpert: {
    mapResultData: payload => {
      return {
        encodedResult: {
          center: payload['GX Laboratory Test Performed'],
          mtb: payload.MTB,
          rifampicin: payload['Rifampicin:'],
          remarks: payload['GX Comments'],
          dateReleased: payload['Date and Time of Release of Gx Result'],
          encodedBy: payload['GX Encoded by'],
          examiner: payload['GX Performed by'],
          labManager: payload['GX Validated by'],
          notedBy: payload['GX Noted by'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'MTB',
          'Rifampicin:',
          'Date and Time of Release of Gx Result',
        ])
      ),
  },
  tblamp: {
    mapResultData: payload => {
      return {
        encodedResult: {
          tbLampResult: payload['TB LAMP Result'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(pick(payload, ['TB LAMP Result'])),
  },
}

module.exports = {
  sampleTypeMapping,
  mapPatientData,
  resultDataMappings,
}
