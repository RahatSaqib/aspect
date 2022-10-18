module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const { subDays, addDays } = require('date-fns')

const { upsertCovidDeviceTypes } = require('../commonCovid')
const utils = require('../utils')

const geography = require('./fixtures/geography.json')
const wakandaCovidResultFormSchema = require('./fixtures/wakandaCovidResultFormSchema.json')

async function seed(knex) {
  utils.hasSeededStaticData = true

  const { id: partnerId } = await knex('Partner').where('name', 'Wakanda').first('id')

  const covidDeviceTypes = await upsertCovidDeviceTypes(knex, partnerId, wakandaCovidResultFormSchema)
  await Promise.each(
    covidDeviceTypes.map(deviceType => deviceType.id),
    async deviceTypeId =>
      knex('DeviceType').where('id', deviceTypeId).whereNull('plugin').update({ plugin: 'aspectresultentry' })
  )

  const countryWakanda = geography.countries.find(country => country.abbreviation === 'WK')

  const covidResultFormData = await knex('AssayType as at')
    .join('Assay as a', 'at.id', 'a.assayTypeId')
    .join('Result as r', 'a.id', 'r.assayId')
    .join('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('at.externalId', 'covid19')
    .whereNotNull('r.formData')
    .select(
      'r.id',
      'rc.externalId as resultCategory1ExternalId',
      'r.endedOn',
      'r.resultData',
      'r.patientData',
      'r.formData'
    )
    .then(items =>
      items.map(result => ({
        id: result.id,
        resultCategory1ExternalId: result.resultCategory1ExternalId,
        endedOn: result.endedOn,
        resultData: JSON.parse(result.resultData),
        patientData: JSON.parse(result.patientData),
        formData: JSON.parse(result.formData),
      }))
    )

  const randomYesNo = () => {
    return utils.randomOption({
      yes: 10,
      no: 50,
    })
  }

  const randomYesNoIf = ifConditionEval => {
    if (ifConditionEval) {
      return randomYesNo()
    }
  }

  const randomYesNoUnknown = () => {
    return utils.randomOption({
      yes: 10,
      no: 40,
      unknown: 10,
    })
  }

  const randomYesNoUnknownIf = ifConditionEval => {
    if (ifConditionEval) {
      return randomYesNoUnknown()
    }
  }

  const randomCountry = () => {
    return utils.randomOption({
      Wakanda: 70,
      Italy: 10,
      USA: 10,
      China: 10,
    })
  }

  const randomCountryIf = ifConditionEval => {
    if (ifConditionEval) {
      return randomCountry()
    }
  }

  const allCitiesInWakanda = _.uniq(
    countryWakanda.states.reduce((cities, state) => {
      if (!_.isEmpty(state.lgas)) {
        const citiesInState = state.lgas.reduce((stateCities, lga) => {
          if (!_.isEmpty(lga.cities)) {
            lga.cities.forEach(city => {
              stateCities.push(city)
            })
          }
          return stateCities
        }, [])
        citiesInState.forEach(city => {
          cities.push(city)
        })
      }
      return cities
    }, [])
  )

  const randomCityIf = ifConditionEval => {
    if (ifConditionEval) {
      return utils.randomOption(allCitiesInWakanda)
    }
  }

  const cityClinics = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.abbreviation', countryWakanda.abbreviation)
    .andWhere('externalId', 'like', '%clinic')
    .select()
    .then(items =>
      items.reduce((cities, site) => {
        if (cities[site.city]) {
          cities[site.city].push(site)
        } else {
          cities[site.city] = [site]
        }
        return cities
      }, {})
    )

  const aspectGenericResultForm = (await knex('Assay as a')
    .join('ResultForm as rf', 'a.id', 'rf.assayId')
    .where('a.externalId', 'assayGenericCovid19')
    .andWhere('rf.partnerId', partnerId)
    .first('rf.*')) || { formSchema: '{}' }
  const aspectGenericResultFormSchema = JSON.parse(aspectGenericResultForm.formSchema)
  await Promise.each(covidResultFormData, async result => {
    const underlyingConditionsAndComorbidity = randomYesNoUnknown()
    const exposureRiskIsCaseAHealthCareWorker = randomYesNoUnknown()
    const exposureRiskHealthcareWorkerCountry = randomCountryIf(exposureRiskIsCaseAHealthCareWorker === 'yes')
    const exposureRiskHealthcareWorkerCity = randomCityIf(exposureRiskHealthcareWorkerCountry === 'Wakanda')
    const exposureRiskHealthcareWorkerFacility = exposureRiskHealthcareWorkerCity
      ? (utils.randomOption(cityClinics.exposureRiskHealthcareWorkerCity || []) || {}).name
      : undefined
    const resubmission30DaysAfterInitialReport = covidResultFormData.endedOn
      ? utils.randomOption([covidResultFormData.endedOn])
      : undefined
    const resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms = randomYesNoUnknown()
    result.formData = {
      ...result.formData,
      testResult: result.resultCategory1ExternalId,
      dateAndTimeOfTest: result.endedOn,
      testReasonOther: result.formData.testReason ? null : 'Referral by clinical trial',
      usualCountryOfResidency: 'Wakanda',
      anySymptomsOrSignsAtTimeOfSpecimenCollection: randomYesNoUnknown(),
      dateOfOnsetOfSymptoms: subDays(result.endedOn, _.random(3, 18)),
      underlyingConditionsAndComorbidity,
      underlyingConditionsPregnancy: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsPostPartum: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsCardiovascularDiseaseIncludingHypertension: randomYesNoIf(
        underlyingConditionsAndComorbidity === 'yes'
      ),
      underlyingConditionsImmunodeficiencyIncludingHIV: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsDiabetes: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsRenalDisease: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsLiverDisease: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsChronicLungDisease: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsChronicNeurologicalOrNeuromuscularDisease: randomYesNoIf(
        underlyingConditionsAndComorbidity === 'yes'
      ),
      underlyingConditionsMalignancy: randomYesNoIf(underlyingConditionsAndComorbidity === 'yes'),
      underlyingConditionsOthers:
        underlyingConditionsAndComorbidity === 'yes'
          ? utils.randomOption({
              'Recently very sick, unknown cause': 5,
              'Chronic cough': 6,
            })
          : undefined,
      exposureRiskIsCaseAHealthCareWorker,
      exposureRiskHealthcareWorkerCountry,
      exposureRiskHealthcareWorkerCity,
      exposureRiskHealthcareWorkerFacility,
      exposureRiskHasTravelledInThe14DaysPriorToSymptomOnset: randomYesNoUnknown(),
      exposureRiskHasVisitedHealthCareFacilityThe14DaysPriorToSymptomOnset: randomYesNoUnknown(),
      exposureRiskHasHadContactWithAConfirmedCaseThe14DaysPriorToSymptomOnset: randomYesNoUnknown(),
      exposureRiskHasHadContactWithAConfirmedCaseThe14DaysPriorToSymptomOnsetSetting: utils.randomOption({
        'Lived in same house as confirmed case for up to 10  days': 5,
        'Went to prison with known confirmed cases': 6,
        'Works in a busy restaurant': 5,
        'Checks baggage at an airport for a living': 10,
        'Frequents a busy playground': 12,
        'School teacher': 16,
      }),
      mostLikelyCountryOfExposure: randomCountry(),
      resubmission30DaysAfterInitialReport,
      resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms: resubmission30DaysAfterInitialReport
        ? resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms
        : undefined,
      resubmission30DaysAfterInitialReportDateOfOnsetOfSignsOfIllness: resubmission30DaysAfterInitialReport
        ? utils.randomOption([covidResultFormData.endedOn])
        : undefined,
      resubmission30DaysAfterInitialReportAdmissionToHospital: randomYesNoUnknownIf(
        resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms === 'yes'
      ),
      resubmission30DaysAfterInitialReportFirstDateOfAdmissionToHospital: resubmission30DaysAfterInitialReport
        ? utils.randomOption([addDays(covidResultFormData.endedOn, _.random(3, 7))])
        : undefined,
      resubmission30DaysAfterInitialReportDidTheCaseReceiveCareInAnICU: randomYesNoUnknownIf(
        resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms === 'yes'
      ),
      resubmission30DaysAfterInitialReportDidTheCaseReceiveVentilation: randomYesNoUnknownIf(
        resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms === 'yes'
      ),
      resubmission30DaysAfterInitialReportDidTheCaseReceiveExtracorporealMembraneOxygenation: randomYesNoUnknownIf(
        resubmission30DaysAfterInitialReportDidTheCaseDevelopAnySymptoms === 'yes'
      ),
      ifReleasedFromHospitalIsolationDateOfLastLaboratoryTest: utils.randomOption([
        addDays(covidResultFormData.endedOn, _.random(5, 10)),
      ]),
    }
    result.patientData = {
      ...result.patientData,
      id: result.formData.caseId,
      age: result.formData.age,
      caseId: result.formData.caseId,
      gender: result.formData.gender
        ? aspectGenericResultFormSchema.fields.gender.control.options.find(
            option => option.value == result.formData.gender // eslint-disable-line eqeqeq
          ).title
        : undefined,
      testReason: result.formData.testReason
        ? aspectGenericResultFormSchema.fields.testReason.control.options.find(
            option => option.value == result.formData.testReason // eslint-disable-line eqeqeq
          ).title
        : undefined,
    }
    result.resultData = {
      ...result.resultData,
      resultText: result.formData.testResult
        ? aspectGenericResultFormSchema.fields.testResult.control.options.find(
            option => option.value == result.formData.testResult // eslint-disable-line eqeqeq
          ).title
        : undefined,
      typeOfTest: result.formData.testType
        ? aspectGenericResultFormSchema.fields.testType.control.options.find(
            option => option.value == result.formData.testType // eslint-disable-line eqeqeq
          ).title
        : undefined,
    }
    return knex('Result')
      .where('id', result.id)
      .update({ formData: JSON.stringify(result.formData) })
  })
  if (
    aspectGenericResultForm.assayId &&
    aspectGenericResultForm.partnerId &&
    !aspectGenericResultFormSchema.fields.testType
  ) {
    const testTypeOrder = aspectGenericResultFormSchema.fields.testResult
      ? aspectGenericResultFormSchema.fields.testResult.order + 1
      : Math.min(Object.values(aspectGenericResultFormSchema.fields).map(field => field.order))
    Object.keys(aspectGenericResultFormSchema.fields).forEach(assayResultFormSchemaFieldKey => {
      if (aspectGenericResultFormSchema.fields[assayResultFormSchemaFieldKey].order >= testTypeOrder) {
        aspectGenericResultFormSchema.fields[assayResultFormSchemaFieldKey].order += 1
      }
    })
    aspectGenericResultFormSchema.fields.testType = {
      i18nLabel: 'testType',
      control: {
        type: 'DropDown',
        options: [
          {
            title: 'PCR/molecular',
            i18nText: 'pcr',
            value: 'pcr',
          },
          {
            title: 'Immunoassay',
            i18nText: 'immunoassay',
            value: 'immunoassay',
          },
          {
            title: 'Rapid diagnostic test',
            i18nText: 'rapidDiagnosticTest',
            value: 'rapidDiagnosticTest',
          },
          {
            title: 'Digital X-Ray',
            i18nText: 'digitalXRay',
            value: 'digitalXRay',
          },
        ],
      },
      order: testTypeOrder,
    }
    await knex('ResultForm')
      .where({
        assayId: aspectGenericResultForm.assayId,
        partner: aspectGenericResultForm.partnerId,
      })
      .update({
        formSchema: JSON.stringify(aspectGenericResultFormSchema),
      })
  }
}
