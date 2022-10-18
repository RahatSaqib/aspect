const { expect } = require('chai')

const okResponseSuccessRegex = '(Add|Update)\\sTB\\sExam\\ssuccessfully'

describe('Webhook Template', () => {
  describe('okResponseSuccessRegex', () => {
    const useCases = {
      'Philippines ITIS': {
        okResponseSuccessRegex,
        shouldPass: ['Add TB Exam successfully', 'Update TB Exam successfully'],
        shouldFail: [
          'FetchError: request to http://itis.doh.gov.ph:3005/pushtbexam/gX%40leR%2B%21Ti%24/TB_CASE_NUMBER/RICHARDS%2C%20Bryan%20C./SPECIMEN_CODE/21-0999/REQUESTING_FACILITY/NULL/DATE_OF_REQUEST/NULL/FACILITY_CONTACT/NULL/REQUESTING_PHYSICIAN/NULL/PATIENT_LAST_NAME/NULL/PATIENT_FIRST_NAME/NULL/PATIENT_MIDDLE_NAME/NULL/PATIENT_AGE/37/PATIENT_ADDRESS/GAUTENG%0D%0A/SEX/NULL/PATIENT_MOBILE_NUMBER/0833243682/PATIENT_LANDLINE_NUMBER/NULL/PATIENT_EMAIL/NULL/REASON_FOR_EXAMINATION/NULL/REGISTRATION_GROUP/938616/SPECIMEN_TYPE/NULL/REPEAT_COLLECTION/NULL/PRESUMPTIVE_TB_DSDR/NULL/DATE_SPECIMEN_COLLECTED/NULL/VISUAL_APPEARANCE/NULL/EXAM_TYPE/XPERT_MTBRIF/EXAM_RESULT/%7B%22MTB%22%3A%220%22%2C%22RIF%22%3A%226%22%7D/DATE_OF_RELEASE/NULL/PERFORMED_BY/nic%20baldwin failed, reason: socket hang up',
          'FetchError: request to http://itis.doh.gov.ph:3005/pushtbexam/gX%40leR%2B%21Ti%24/TB_CASE_NUMBER/RICHARDS%2C%20Bryan%20C./SPECIMEN_CODE/21-0999/REQUESTING_FACILITY/NULL/DATE_OF_REQUEST/NULL/FACILITY_CONTACT/NULL/REQUESTING_PHYSICIAN/NULL/PATIENT_LAST_NAME/NULL/PATIENT_FIRST_NAME/NULL/PATIENT_MIDDLE_NAME/NULL/PATIENT_AGE/37/PATIENT_ADDRESS/GAUTENG%0D%0A/SEX/NULL/PATIENT_MOBILE_NUMBER/0833243682/PATIENT_LANDLINE_NUMBER/NULL/PATIENT_EMAIL/NULL/REASON_FOR_EXAMINATION/NULL/REGISTRATION_GROUP/938616/SPECIMEN_TYPE/NULL/REPEAT_COLLECTION/NULL/PRESUMPTIVE_TB_DSDR/NULL/DATE_SPECIMEN_COLLECTED/NULL/VISUAL_APPEARANCE/NULL/EXAM_TYPE/XPERT_MTBRIF/EXAM_RESULT/%7B%22MTB%22%3A%220%22%2C%22RIF%22%3A%226%22%7D/DATE_OF_RELEASE/NULL/PERFORMED_BY/nic%20baldwin failed, reason: connect ECONNREFUSED 192.168.1.7:3005',
          'Case Number and/or Specimen Code cannot be empty.',
        ],
      },
    }

    it('should pass & fail documented use cases', () => {
      Object.keys(useCases).forEach(useCaseName => {
        const useCase = {
          shouldPass: [],
          shouldFail: [],
          ...useCases[useCaseName],
        }
        const okResponseSuccessRegexExpression = new RegExp(useCase.okResponseSuccessRegex)
        useCase.shouldPass.forEach(passUseCase => {
          expect(passUseCase).to.match(
            okResponseSuccessRegexExpression,
            `${useCaseName} use case should match ${passUseCase}`
          )
        })
        useCase.shouldFail.forEach(failUseCase => {
          expect(failUseCase).to.not.match(
            okResponseSuccessRegexExpression,
            `${useCaseName} use case should NOT match ${failUseCase}`
          )
        })
      })
    })
  })
})
