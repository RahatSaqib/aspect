const _ = require('lodash')
const Boom = require('boom')
const Promise = require('bluebird')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getUtcTime, parseDateOrDefault } = require('../../shared/date')
const {
  allAssayToId,
  resultSourceToId,
  resultTypeToId,
  sampleTypeToId,
} = require('../../shared/dictionary')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

class DefaultSenaiteLIMS extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { auth } = request
    const { externalId: deviceTypeId } =
      (await knex('DeviceApiKey as dak')
        .join('Device as d', 'dak.deviceId', 'd.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where('dak.token', auth.credentials.token)
        .first('dt.externalId')) || {}
    return deviceTypeId === 'SenaiteLims'
  }

  async processRequest() {
    const { request } = this
    const { auth, payload: payloadString } = request
    const payload = JSON.parse(payloadString)
    const now = getUtcTime()
    await transact(async knex => {
      const {
        deviceId,
        partnerId,
        siteId,
        longitude,
        latitude,
        geographyId,
        countryId,
      } = await knex('DeviceApiKey as dak')
        .leftJoin('Site as s1', 'dak.siteId', 's1.id')
        .leftJoin('Device as d', 'dak.deviceId', 'd.id')
        .leftJoin('Site as s2', 'd.siteId', 's2.id')
        .leftJoin('Geography as g1', 'dak.geographyId', 'g1.id')
        .leftJoin('Geography as g2', 's1.geographyId', 'g2.id')
        .leftJoin('Geography as g3', 's2.geographyId', 'g3.id')
        .where('dak.token', auth.credentials.token)
        .first(
          'dak.deviceId',
          'dak.partnerId',
          knex.raw('COALESCE(d.siteId, dak.siteId) as siteId'),
          knex.raw('COALESCE(s2.longitude, s1.longitude) as longitude'),
          knex.raw('COALESCE(s2.latitude, s1.latitude) as latitude'),
          knex.raw(
            'COALESCE(s2.geographyId, s1.geographyId, dak.geographyId) as geographyId'
          ),
          knex.raw(
            'COALESCE(g1.countryId, g2.countryId, g3.countryId) as countryId'
          )
        )
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      await knex('DeviceLog').insert({
        deviceId,
        source: _.get(payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })
      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: now, updatedOn: now })
      this.messageContext.dispatch(deviceSeen(deviceId))

      const provinceName = payload.getProvince // "Mashonaland Central"
      const districtName = payload.getDistrict // "Mazowe"
      let stateId = null
      let lgaId = null
      let originSiteGeographyId = null
      if (countryId && provinceName) {
        let originSiteGeography = await knex('Geography as g')
          .join('State as s', 'g.stateId', 's.id')
          .join('Lga as l', 'g.lgaId', 'l.id')
          .where({
            'g.countryId': countryId,
            's.name': provinceName,
            'l.name': districtName,
          })
          .first('g.id', 'g.stateId', 'g.lgaId')
        if (!originSiteGeography) {
          originSiteGeography = await knex('Geography as g')
            .join('State as s', 'g.stateId', 's.id')
            .whereNull('g.lgaId')
            .andWhere({
              'g.countryId': countryId,
              's.name': provinceName,
            })
            .first('g.id', 'g.stateId', 'g.lgaId')
        }
        if (!originSiteGeography) {
          originSiteGeography = await knex('Geography')
            .whereNull('lgaId')
            .whereNull('stateId')
            .andWhere('countryId', countryId)
            .first('id', 'stateId', 'lgaId')
        }
        let { stateId, lgaId } = originSiteGeography
        ;({ id: originSiteGeographyId } = originSiteGeography)
        if (!stateId) {
          ;[stateId] = await knex('State').insert({ name: provinceName })
          ;[originSiteGeographyId] = await knex('Geography').insert({
            countryId,
            stateId,
          })
        }
        if (!lgaId && districtName) {
          ;[lgaId] = await knex('Lga').insert({ name: districtName })
          ;[originSiteGeographyId] = await knex('Geography').insert({
            countryId,
            stateId,
            lgaId,
          })
        }
      }
      let originSiteId = null
      const limsFacilityId = payload.ClientUID // "354b7f04781c4bbeaf87500031b82b11"
      const facilityName = payload.Client // "Henderson Clinic"
      if (limsFacilityId) {
        const originSite =
          (await knex('Site as s')
            .join('Geography as g', 's.geographyId', 'g.id')
            .where('g.countryId', countryId)
            .andWhere('s.partnerId', partnerId)
            .andWhere('s.externalId', limsFacilityId)
            .first('s.id', 'g.stateId', 'g.lgaId', 's.name')) || {}
        originSiteId = originSite.id
        if (!stateId) {
          ;({ stateId } = originSite)
        }
        if (!lgaId) {
          ;({ lgaId } = originSite)
        }
        if (!originSiteGeographyId) {
          const originSiteGeography =
            (await knex('Geography as g')
              .where('g.countryId', countryId)
              .andWhere(function() {
                if (!stateId) {
                  this.whereNull('g.stateId')
                } else {
                  this.where('g.stateId', stateId)
                }
              })
              .andWhere(function() {
                if (!lgaId) {
                  this.whereNull('g.lgaId')
                } else {
                  this.where('g.lgaId', lgaId)
                }
              })
              .first('g.id')) || {}
          originSiteGeographyId = originSiteGeography.id
        }
        if (!originSiteId) {
          ;[originSiteId] = await knex('Site').insert({
            name: facilityName,
            externalId: limsFacilityId,
            partnerId,
            geographyId: originSiteGeographyId,
          })
        } else if (
          (!originSite.stateId && stateId) ||
          (!originSite.lgaId && lgaId) ||
          (originSite.name !== facilityName && facilityName)
        ) {
          const updatedSiteInfo = {}
          if (
            (!originSite.stateId && stateId) ||
            (!originSite.lgaId && lgaId)
          ) {
            updatedSiteInfo.geographyId = originSiteGeographyId
            updatedSiteInfo.updatedOn = now
          }
          if (originSite.name !== facilityName && facilityName) {
            updatedSiteInfo.name = facilityName
            updatedSiteInfo.updatedOn = now
          }
          await knex('Site')
            .where('id', originSiteId)
            .update(updatedSiteInfo)
        }
      }
      // Get or Create Sample
      const limsSampleId = payload.getSampleID // "SP17-002058"
      if (!limsSampleId) {
        return
      }
      const sampleDateCollected = payload.DateSampled // "2017/09/25 00:00:00 GMT+0"
      const sampleType = payload.SampleTypeTitle // "Sputum"
      const sampleTypeMapping = {
        'Blood plasma': 'Plasma',
        'Dried Blood Spot': 'DBS',
        Sputum: 'Sputum',
      }
      let sampleTypeExternalId = 'Other'
      if (sampleType && sampleTypeMapping[sampleType]) {
        sampleTypeExternalId = sampleTypeMapping[sampleType]
      }
      const sample =
        (await knex('Sample as s')
          .join('SampleType as st', 's.sampleTypeId', 'st.id')
          .where(function() {
            this.where('s.externalId', limsSampleId).andWhere(
              'st.externalId',
              sampleTypeExternalId
            )
            if (originSiteId) {
              this.andWhere('s.originSiteId', originSiteId)
            }
          })
          .first('s.*')) || {}
      let { id: sampleId } = sample
      if (!sampleId) {
        ;[sampleId] = await knex('Sample').insert({
          externalId: limsSampleId,
          collectedOn: parseDateOrDefault(sampleDateCollected),
          sampleTypeId: await sampleTypeToId(sampleTypeExternalId),
          originSiteId,
        })
      } else if (!sample.collectedOn && sampleDateCollected) {
        await knex('Sample')
          .where('id', sampleId)
          .update({
            collectedOn: parseDateOrDefault(sampleDateCollected),
          })
      }
      const baseResultData = {
        senaite: {
          analysisRequest: {
            creationDate: payload.creation_date, // "2017/10/23 09:04:58 GMT+2"
            creator: payload.Creator, // "kadyea"
            creatorEmail: payload.CreatorEmail, // "kadyea@nmrl.org.zw"
            creatorFullName: payload.CreatorFullName, // "kadyea"
            dateVerified: payload.getDateVerified, // null
            doctorTitle: payload.getDoctorTitle, // ""
            doctorUid: payload.getDoctorUID, // ""
            modificationDate: payload.modification_date, // "2019/02/18 11:15:15.191914 GMT+2"
            printed: payload.getPrinted, // "0"
            priority: payload.Priority, // "3"
            profilesTitleStr: payload.ProfilesTitleStr, // "TB Culture"
            uid: payload.UID, // "b98da3709f1845f7bef097ed5a95c634"
          },
          referringFacility: {
            contactEmail: payload.ContactEmail, // ""
            contactFullName: payload.ContactFullName, // "Sister in charge"
            contactUid: payload.ContactUID, // "24cf4e36f70c41aeaf2959cb6cdd27a1"
          },
          sample: {
            appearance: null,
            appearanceRemarks: null,
            volume: null,
            volumeRemarks: null,
            dateReceived: payload.DateReceived, // "2017/10/24 12:02:16 GMT+2"
            partitionId: payload.id, // "SP17-002058-R01"
            receivedBy: payload.ReceivedBy, // "muzavazip"
            samplerEmail: payload.SamplerEmail, // "kadyea@nmrl.org.zw"
            typeUid: payload.SampleTypeUID, // "ac0cbd54fc4d4c86b9e42fe4c870c184"
            uid: payload.SampleUID, // "dc4275a004c24b2fb2c20b319d9a088c"
          },
          result: {
            title: null,
            uid: null,
            retested: null,
            result: null,
            resultText: null,
            value: null,
            resultCaptureDate: null,
            remarks: null,
            unit: null,
            pointOfCapture: null,
            manualEntryOfResults: null,
            instrument: null,
            instrumentEntryOfResults: null,
            hidden: null,
            hiddenManually: null,
            analyst: null,
            verificators: null,
            testReviewState: null,
            worksheetAnalysisReviewState: null,
            creationDate: null,
            creator: null,
            modificationDate: null,
          },
        },
      }
      const patientData = {
        senaite: {
          patientId: payload.getPatientID, // "P17-00590"
          patientUid: payload.Patient_uid, // "eda130e9e110406fa9b0b063c6d95e40"
          referringFacilityPatientName: payload.Patient, // "Frank Kangara"
          referringFacilityPatientUid: payload.ClientPatientID, // "8e233dceaa6b4551ada8d6ff7485e282"
          referringFacilitySampleId: payload.ClientSampleID, // "Frank Kangara"
        },
      }

      const sampleAppearanceAnalysis = _.find(payload.Analyses, {
        id: 'SampleAppearance',
      })
      if (_.get(sampleAppearanceAnalysis, 'Result')) {
        if (!_.isEmpty(sampleAppearanceAnalysis.ResultOptions)) {
          const selectedSampleAppearance = _.find(
            sampleAppearanceAnalysis.ResultOptions,
            { ResultValue: sampleAppearanceAnalysis.Result }
          )
          if (_.get(selectedSampleAppearance, 'ResultText')) {
            if (sampleAppearanceAnalysis.Unit) {
              baseResultData.senaite.sample.appearance = `${selectedSampleAppearance.ResultText} ${sampleAppearanceAnalysis.Unit}`
            } else {
              baseResultData.senaite.sample.appearance =
                selectedSampleAppearance.ResultText
            }
          } else if (_.get(selectedSampleAppearance, 'value')) {
            baseResultData.senaite.sample.appearance =
              selectedSampleAppearance.value
          }
        } else {
          baseResultData.senaite.sample.appearance =
            sampleAppearanceAnalysis.Result
        }
      }
      if (_.get(sampleAppearanceAnalysis, 'Remarks')) {
        baseResultData.senaite.sample.appearanceRemarks =
          sampleAppearanceAnalysis.Remarks
      }
      const sampleVolumeAnalysis = _.find(payload.Analyses, {
        id: 'SampleVolume',
      })
      if (_.get(sampleVolumeAnalysis, 'Result')) {
        if (!_.isEmpty(sampleVolumeAnalysis.ResultOptions)) {
          const selectedSampleVolume = _.find(
            sampleVolumeAnalysis.ResultOptions,
            { ResultValue: sampleVolumeAnalysis.Result }
          )
          if (_.get(selectedSampleVolume, 'ResultText')) {
            if (sampleVolumeAnalysis.Unit) {
              baseResultData.senaite.sample.volume = `${selectedSampleVolume.ResultText} ${sampleVolumeAnalysis.Unit}`
            } else {
              baseResultData.senaite.sample.volume =
                selectedSampleVolume.ResultText
            }
          } else if (_.get(selectedSampleVolume, 'value')) {
            baseResultData.senaite.sample.volume = selectedSampleVolume.value
          }
        } else {
          baseResultData.senaite.sample.volume = sampleVolumeAnalysis.Result
        }
      }
      if (_.get(sampleVolumeAnalysis, 'Remarks')) {
        baseResultData.senaite.sample.volumeRemarks =
          sampleVolumeAnalysis.Remarks
      }

      const testResultAnalyses = _.filter(
        payload.Analyses,
        analysis => !['SampleAppearance', 'SampleVolume'].includes(!analysis.id)
      )
      // Test Details
      const assayIds = await allAssayToId()
      if (!_.isEmpty(testResultAnalyses)) {
        await Promise.each(testResultAnalyses, async testResultAnalysis => {
          let assayId = assayIds.senaiteUnknown
          if (testResultAnalysis.id === 'MGITRESULT') {
            assayId = assayIds.assayBdMgitAst
          }
          // TODO: Perform duplicate checking on MGIT data processor
          const resultRecord = (await knex('Result')
            .where('sampleId', sampleId)
            .andWhere('assayId', assayId)
            .first()) || {
            patientData: _.merge({}, patientData),
            resultData: _.merge({}, baseResultData),
          }
          if (resultRecord.id) {
            resultRecord.patientData = _.merge(
              resultRecord.patientData
                ? JSON.parse(resultRecord.patientData)
                : {},
              patientData
            )
            resultRecord.resultData = _.merge(
              resultRecord.resultData
                ? JSON.parse(resultRecord.resultData)
                : {},
              baseResultData
            )
          } else {
            resultRecord.externalId = testResultAnalysis.UID
            resultRecord.assayId = assayId
            resultRecord.partnerId = partnerId
            resultRecord.sampleId = sampleId
            resultRecord.deviceId = deviceId
            resultRecord.rawData = JSON.stringify(payload)
            resultRecord.createdOn = now
          }
          if (!resultRecord.geographyId) {
            resultRecord.geographyId = geographyId
          }
          if (!resultRecord.siteId) {
            resultRecord.siteId = siteId
          }
          if (!resultRecord.longitude) {
            resultRecord.longitude = longitude
          }
          if (!resultRecord.latitude) {
            resultRecord.latitude = latitude
          }
          if (!resultRecord.resultSourceId) {
            resultRecord.resultSourceId = await resultSourceToId('LIMS')
          }
          if (!resultRecord.resultTypeId) {
            resultRecord.resultTypeId = await resultTypeToId('Patient')
          }
          /*
          TODO: Assign Result Categories
          `resultCategory1` int(10) unsigned DEFAULT NULL,
            `resultCategory2` int(10) unsigned DEFAULT NULL,
          */
          resultRecord.updatedOn = now

          resultRecord.resultData.senaite.result.title =
            testResultAnalysis.title // "MGIT RESULT"
          resultRecord.resultData.senaite.result.uid = testResultAnalysis.UID // "d2b24013cefd4ab49b55ca1b7afcee52"
          resultRecord.resultData.senaite.result.retested =
            testResultAnalysis.Retested // false
          resultRecord.resultData.senaite.result.result =
            testResultAnalysis.Result // ""
          const resultOptions = testResultAnalysis.ResultOptions // Array with objects like { "ResultText": "Positive", "ResultValue": "0", "value": "" }
          const selectedResultOption =
            _.find(resultOptions, {
              ResultValue: resultRecord.resultData.senaite.result.result,
            }) || {}
          resultRecord.resultData.senaite.result.resultText =
            selectedResultOption.ResultText
          resultRecord.resultData.senaite.result.value =
            selectedResultOption.value
          resultRecord.resultData.senaite.result.resultCaptureDate = parseDateOrDefault(
            testResultAnalysis.ResultCaptureDate
          ) // "2018/03/20 06:23:3.774431 GMT+2"
          resultRecord.resultData.senaite.result.remarks =
            testResultAnalysis.Remarks // ""
          resultRecord.resultData.senaite.result.unit = testResultAnalysis.Unit // ""
          resultRecord.resultData.senaite.result.pointOfCapture =
            testResultAnalysis.PointOfCapture // "lab"
          resultRecord.resultData.senaite.result.manualEntryOfResults =
            testResultAnalysis.ManualEntryOfResults // true
          resultRecord.resultData.senaite.result.instrument =
            testResultAnalysis.Instrument // null
          resultRecord.resultData.senaite.result.instrumentEntryOfResults =
            testResultAnalysis.InstrumentEntryOfResults // false
          resultRecord.resultData.senaite.result.hidden =
            testResultAnalysis.Hidden // true
          resultRecord.resultData.senaite.result.hiddenManually =
            testResultAnalysis.HiddenManually // false
          resultRecord.resultData.senaite.result.analyst =
            testResultAnalysis.Analyst // "" <- LIMS Username
          resultRecord.resultData.senaite.result.verificators =
            testResultAnalysis.Verificators // "" <- LIMS Username
          resultRecord.resultData.senaite.result.testReviewState =
            testResultAnalysis.review_state // "verified"
          resultRecord.resultData.senaite.result.worksheetAnalysisReviewState =
            testResultAnalysis.worksheetanalysis_review_state // "unassigned"
          resultRecord.resultData.senaite.result.creationDate = parseDateOrDefault(
            testResultAnalysis.creation_date
          ) // "2017/10/23 09:04:58 GMT+2"
          resultRecord.resultData.senaite.result.creator =
            testResultAnalysis.Creator // "kadyea"
          resultRecord.resultData.senaite.result.modificationDate = parseDateOrDefault(
            testResultAnalysis.modification_date
          ) // "2018/03/20 06:23:4.257171 GMT+2"

          resultRecord.patientData = JSON.stringify(resultRecord.patientData)
          resultRecord.resultData = JSON.stringify(resultRecord.resultData)
          if (resultRecord.id) {
            await knex('Result')
              .where('id', resultRecord.id)
              .update(resultRecord)
          } else {
            await knex('Result').insert(resultRecord)
          }
        })
      }
    })
  }
}

module.exports = DefaultSenaiteLIMS
