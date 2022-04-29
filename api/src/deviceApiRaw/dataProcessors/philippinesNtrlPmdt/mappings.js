const pick = require('lodash/pick')
const { objectHasValues } = require('../common/utils')

const sampleTypeMapping = {
  Sputum: 'Sputum',
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
  if (patientNameId && payload['Middle Initial']) {
    patientNameId += ` ${payload['Middle Initial']}`
  }
  return {
    id:
      payload['TB Case Number'] ||
      patientNameId ||
      payload['Lab No 1'] ||
      ntrlLabRequestId,
    serialNumber: payload['Serial Number'],
    mrfDateRequested: payload['MRF Date Requested'],
    referringHealthFacility: payload['Referring Health Facility'],
    requestingPhysician: payload['Requesting Physician'],
    facilityContactNumber: payload['Facility Contact Number'] || null,
    lastName: payload['Last Name'],
    firstName: payload['First Name'],
    middleInitialOrName: payload['Middle Initial'],
    age: payload.Age,
    sex: payload.Sex,
    address: payload.Address,
    province: payload.Province || null,
    city: payload.City || null,
    phone: payload['Patient Contact Number'] || null,
    paragioniamiasisResult1: payload['Paragioniamiasis Result 1'] || null,
    paragioniamiasisResult2: payload['Paragioniamiasis Result 2'] || null,
    cultureCenter: payload['Culture Center'],
    dstCenter: payload['DST Center'],
    treatmentCategory: payload['Treatment Category'],
    registrationGroup: payload['Registration Group'],
    treatmentSchedule: payload['Treatment Schedule'],
    monthOfTreatment: payload['Month of tx'],
    typeOfSpecimen: payload['Type of Specimen'],
    ifOthersSpecify: payload['(If Others) Specify'],
    site: payload.Site,
    testRequestedSmear: payload['Test Requested Smear'],
    testRequestedCulture: payload['Test Requested Culture'],
    testRequestedDst: payload['Test Requested DST'],
    testRequestedLpa: payload['Test Requested LPA'],
    testRequestedGx: payload['Test Requested Gx'],
    testRequestedTbLamp: payload['Test Requested TB LAMP'],
    testRequestedParagonimiasis:
      payload['Test Requested Paragonimiasis'] || null,
    dateTransferedToDst: payload['Date transfered to DST'],
    cultureMethod: payload['Culture Method'],
    presumptiveDsOrDr: payload['Presumptive DS or DR'],
    dateReceived: payload['Date Received'],
    labNo1: payload['Lab No 1'],
    tbCaseNumber: payload['TB Case Number'],
    repeatCollection: payload['Repeat Collection'],
    reasonForRecollection: payload['Reason for Recollection'],
    dateCollected1: payload['Date Collected 1'],
    dateCollected2: payload['Date Collected 2'],
    dateCollected3: payload['Date Collected 3'],
    dateDispatched: payload['Date Dispatch'] || null,
    volume1: payload['Volume 1'],
    volume2: payload['Volume 2'],
    volume3: payload['Volume 3'],
    consistency1: payload['Consistency 1'],
    consistency2: payload['Consistency 3'] || null,
    consistency3: payload['Consistency 4'] || null,
    specimenAccepted: payload['Specimen Accepted'] || null,
    specimenRejectedReason: payload['Specimen Rejected Reason'] || null,
    encodedBy: payload['Encoded By'],
    dateEncoded: payload['Date Encoded'],
    healthCareSystem: 'PMDT',
  }
}

const resultDataMappings = {
  // Drug Susceptibility Testing for MGIT
  dst: {
    mapResultData: payload => {
      return {
        encodedResult: {
          testRequested: payload['DST Test Requested'],
          dateInoculated: payload['DST Date Inoculated'],
          inoculatedBy: payload['DST MT Inoculated'],
          idResult: payload['DST ID Result'] || payload['Culture Final Result'], // There is a mis-mapping in the NTRL database that uses the Culture Final Result in the DST result encoding form
          streptomycin: payload.Streptomycin,
          isoniazid: payload.Isoniazid,
          rifampicin: payload.Rifampicin,
          ethambutol: payload.Ethambutol,
          pyrazinamide: payload.Pyrazinamide,
          kanamycin: payload.Kanamycin,
          levofloxacin: payload.Levofloxacin,
          amikacin: payload.Amikacin,
          capreomycin: payload.Capreomycin,
          moxifloxacin: payload.Moxifloxacin,
          methodUsed: payload['DST Method Used'],
          otherMethodUsed: payload['DST Method Used Others'],
          remarks: payload['DST Remarks'],
          dateTransferredToDst: payload['Date transfered to DST'],
          dstTat: payload['DST TAT'],
          dateRead: payload['DST Date Read'],
          dateReleased: payload['DST Date Released'],
          readBy: payload['DST MT Read'],
          labTech: payload['DST Lab Tech'],
          encodedBy: payload['DST Encoded by'],
          reviewedBy: payload['DST Releasing Form Lab Manager'],
          notedBy: payload['DST Noted By'],
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
          'DST TAT',
          'DST Date Released',
        ])
      ) || payload['DST ID Result'],
  },
  culture: {
    mapResultData: payload => {
      return {
        encodedResult: {
          dateInoculated: payload['Culture Date Inoculated'],
          medTech: payload['Culture Med Tech'],
          resultStatus: payload['Culture Result Status'],
          dstStatus: payload['Culture DST Status'],
          methodUsed1: payload['Culture Method'],
          result1: payload['Culture Result 1'],
          grade1: payload['Culture Grade 1'],
          result2: payload['Culture Result 2'],
          grade2: payload['Culture Grade 2'],
          finalResult: payload['Culture Final Result'],
          remarks: payload['Culture Remarks 1'],
          dateReleased: payload['Culture Date Released'],
          encodedBy: payload['Culture Encoded by'],
          labTech: payload['Culture Lab Tech'],
          notedBy: payload['Culture Noted By'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'Culture Result 1',
          'Culture Grade 1',
          'Culture Result 2',
          'Culture Grade 2',
          'Culture Final Result',
          'Culture Date Released',
        ])
      ),
  },
  lpa: {
    mapResultData: payload => {
      const getDetectedResistanceCategoryTypes = payload => {
        const detectedResistances = []
        ;[
          'LPA Rifampicin Result',
          'LPA Isoniazid Result',
          'LPA Ethambutol',
          'LPA Fluoroquinolones',
          'LPA Aminoglycosides/ SLI',
          'LPA Ethionamide/Prothionamide',
        ].forEach(categoryType => {
          if (payload[categoryType] === 'Resistance Detected')
            detectedResistances.push(
              categoryType.replace('LPA', '').replace('Result', '').trim()
            )
        })
        return detectedResistances
      }
      return {
        encodedResult: {
          center: payload['LPA Center'],
          lpaKit: payload['LPA Kit Used'],
          lpaKitOther: payload['LPA Kit Others'],
          lpaTestRequested: payload['LPA Test Requested'],
          lpaTestRequestedOther: payload['LPA Test Requested Others'],
          mtbComplex: payload['LPA MTB Complex'],
          rifampicin: payload['LPA Rifampicin Result'],
          isoniazid: payload['LPA Isoniazid Result'],
          ethambutol: payload['LPA Ethambutol'],
          fluoroquinolones: payload['LPA Fluoroquinolones'],
          aminoglycoside: payload['LPA Aminoglycosides/ SLI'],
          ethionamideProthionamide: payload['LPA Ethionamide/Prothionamide'],
          remarks: payload['LPA Remarks:'],
          dateReleased: payload['LPA Date of Release'],
          performedBy: payload['LPA Performed By'],
          reviewedBy: payload['LPA Reviewed By'],
          notedBy: payload['LPA Noted By'],
        },
        detectedResistance: getDetectedResistanceCategoryTypes(payload),
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'LPA MTB Complex',
          'LPA Rifampicin Result',
          'LPA Isoniazid Result',
          'LPA Ethambutol',
          'LPA Fluoroquinolones',
          'LPA Aminoglycosides/ SLI',
          'LPA Date of Release',
        ])
      ),
  },
  smear: {
    mapResultData: payload => {
      return {
        encodedResult: {
          smearMethod: payload['Smear Method'],
          smearResult1: payload['Smear Result 1'],
          smearResult2: payload['Smear Result 2'],
          finalResult: payload['Smear Final Result'],
          dateReleased: payload['Smear Date Released'],
          encodedBy: payload['Smear Encoded by'],
          laboratoryTechnician: payload['Smear Lab Tech'],
          notedBy: payload['Smear Noted By'],
          verifiedBy: payload['Smear Verified By'],
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'Smear Result 1',
          'Smear Result 2',
          'Smear Final Result',
          'Smear Date Released',
        ])
      ),
  },
  genexpert: {
    mapResultData: payload => {
      return {
        encodedResult: {
          center: payload['Gx Center'],
          processingDate: payload['Gx Processing Date'],
          mtb: payload['Gx MTB'],
          rifampicin: payload['Gx Rifampicin'],
          remarks: payload['Gx Remarks'],
          dateReleased: payload['Gx Date Released'],
          examiner: payload['Gx Examiner'],
          labManager: payload['Gx Laboratory Manager'],
          gxTestRequested: payload['Gx Test Requested'],
          notedBy: payload['Gx Noted By'],
          dateDispatched: payload['Date Dispatch'] || null,
        },
      }
    },
    isPayloadValid: payload =>
      objectHasValues(
        pick(payload, [
          'Gx Processing Date',
          'Gx MTB',
          'Gx Rifampicin',
          'Gx Date Released',
        ])
      ),
  },
  tblamp: {
    mapResultData: payload => {
      return {
        encodedResult: {
          tbLampResult: payload['TB LAMP Result'],
          verifiedBy: payload['TB LAMP Verified By'],
          notedBy: payload['TB LAMP Noted By'],
          processingDate: payload['Gx Processing Date'],
          dateReleased: payload['Smear Date Released'],
          laboratoryTechnician: payload['Smear Lab Tech'],
          examiner: payload['Gx Examiner'],
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
