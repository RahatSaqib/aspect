const _ = require('lodash')
const Boom = require('boom')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getUtcTime } = require('../../shared/date')
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
    const { auth, payload } = request
    const now = getUtcTime()
    await transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
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

      // Get or Create Geography & Facility
      // Remote Facility Details
      const facilityName = payload.Client // "Henderson Clinic"
      const limsFacilityId = payload.ClientUID // "354b7f04781c4bbeaf87500031b82b11"
      const limsPatientId = payload.ClientPatientID // "8e233dceaa6b4551ada8d6ff7485e282"
      const facilityContactName = payload.ContactFullName // "Sister in charge"
      const limsFacilityContactId = payload.ContactFullName // "24cf4e36f70c41aeaf2959cb6cdd27a1"
      const provinceName = payload.getProvince // "Mashonaland Central"
      const lgaName = payload.getDistrict // "Mazowe"

      // Get or Create Result with Result Data & Patient Data
      // Patient Details
      const patientId = payload.getPatientID // "P17-00590"
      const facilityPatientId = payload.ClientSampleID // "Frank Kangara"
      const patientName = payload.Patient // "Frank Kangara"
      const limsPatientId = payload.Patient_uid // "eda130e9e110406fa9b0b063c6d95e40"

      // Sample Details
      const limsSampleId = payload.SampleUID // "dc4275a004c24b2fb2c20b319d9a088c"
      const sampleId = payload.getSampleID // "SP17-002058"
      const samplePartitionId = payload.id // "SP17-002058-R01"
      const sampleDateReceived = payload.DateReceived // "2017/10/24 12:02:16 GMT+2"
      const sampleDateCollected = payload.DateSampled // "2017/09/25 00:00:00 GMT+0"
      const sampleCollectedByEmail = payload.SamplerEmail // "kadyea@nmrl.org.zw"
      const receivedBy = payload.ReceivedBy // "muzavazip"
      const sampleType = payload.SampleTypeTitle // "Sputum"
      const limsSampleTypeId = payload.SampleTypeUID // "ac0cbd54fc4d4c86b9e42fe4c870c184"

      // Lab Request Details
      const labRequestId = payload.UID // "b98da3709f1845f7bef097ed5a95c634"
      const printed = payload.getPrinted // "0"
      const priority = payload.Priority // "3"
      const profile = payload.ProfilesTitleStr // "TB Culture"
      const dateVerified = payload.getDateVerified // null
      const doctorTitle = payload.getDoctorTitle // ""
      const limsDoctorId = payload.getDoctorUID // ""

      // Lab Request Audit Fields
      const limsCreatedBy = payload.Creator // "kadyea"
      const limsCreatedByEmail = payload.CreatorEmail // "kadyea@nmrl.org.zw"
      const limsCreatedByFullName = payload.CreatorFullName // "kadyea"
      const limsCreationDate = payload.creation_date // "2017/10/23 09:04:58 GMT+2"
      const limsLastModifiedDate = payload.modification_date // "2019/02/18 11:15:15.191914 GMT+2"

      // Test Details
      if (!_.isEmpty(payload.Analyses)) {
        _.each(payload.Analyses, testDetail => {
          const testType = testDetail.id // "MGITRESULT"
          if (!['SampleAppearance', 'SampleVolume'].includes(testType)) {
            const testTypeName = testDetail.title // "MGIT RESULT"
            const limsTestId = testDetail.UID // "d2b24013cefd4ab49b55ca1b7afcee52"
            const retested = testDetail.Retested // false
            const resultOptions = testDetail.ResultOptions // Array with objects like { "ResultText": "Positive", "ResultValue": "0", "value": "" }
            const selectedResultOption = testDetail.Result // ""
            const selectedResult =
              _.find(resultOptions, { ResultValue: selectedResultOption }) || {}
            const resultText = selectedResult.ResultText
            const resultValue = selectedResult.value
            const limsDateResultCaptured = testDetail.ResultCaptureDate // "2018/03/20 06:23:3.774431 GMT+2"
            const remarks = testDetail.Remarks // ""
            const resultUnit = testDetail.Unit // ""
            const pointOfCapture = testDetail.PointOfCapture // "lab"
            const manualEntryOfResults = testDetail.ManualEntryOfResults // true
            const instrument = testDetail.Instrument // null
            const instrumentEntryOfResults = testDetail.InstrumentEntryOfResults // false
            const hidden = testDetail.Hidden // true
            const hiddenManually = testDetail.HiddenManually // false
            const analyst = testDetail.Analyst // "" <- LIMS Username
            const verificators = testDetail.Verificators // "" <- LIMS Username
            const testReviewState = testDetail.review_state // "verified"
            const testWorksheetAnalysisReviewState =
              testDetail.worksheetanalysis_review_state // "unassigned"
          } else if (testType === 'SampleAppearance') {
            const sampleAppearanceOptions = testDetail.ResultOptions // Array of objects
            const sampleAppearanceSelectedOption = testDetail.Result // "1"
            const selectedSampleAppearance =
              _.find(sampleAppearanceOptions, {
                ResultValue: sampleAppearanceSelectedOption,
              }) || {}
            const sampleAppearanceText = selectedSampleAppearance.ResultText // "Mucoid"
            const sampleAppearanceRemarks = testDetail.Remarks // ""
          } else if (testType === 'SampleVolume') {
            const sampleVolumeOptions = testDetail.ResultOptions // Array of objects
            const sampleVolumeSelectedOption = testDetail.Result // "1"
            const selectedSampleVolume =
              _.find(sampleVolumeOptions, {
                ResultValue: sampleVolumeSelectedOption,
              }) || {}
            const sampleVolumeText =
              selectedSampleVolume.ResultText + ' ' + testDetail.Unit || null // "3-5 ml"
            const sampleVolumeRemarks = testDetail.Remarks // ""
          }

          // Test Details Audit Fields
          const testLimsCreatedBy = testDetail.Creator // "kadyea"
          const testLimsCreationDate = testDetail.creation_date // "2017/10/23 09:04:58 GMT+2"
          const testLimsLastModifiedDate = testDetail.modification_date // "2018/03/20 06:23:4.257171 GMT+2"
        })
      }

      // "Digest": "{'composite': False, 'client_order_num': '', 'managers': {'dict': {'kadyea': {'name': u'Agripa Kadye', 'departments': '', 'phone': u'', 'signature': '', 'salutation': u'Mr', 'email': u'kadyea@nmrl.org.zw', 'job_title': u''}}, 'ids': ['kadyea']}, 'parent_analysisrequest': None, 'ar_attachments': [], 'member_discount': '0.00', 'sample': {'sampler': {}, 'date_sampled': DateTime('2017/09/25 00:00:00 GMT+0'), 'obj': <Sample at SP17-002058>, 'date_expired': DateTime('2018/03/20 06:23:5.210258 GMT+2'), 'url': 'http://192.168.0.25/clients/client17-1100/SP17-002058', 'sample_point': {}, 'client_sampleid': 'Frank Kangara', 'date_disposed': DateTime('2018/03/20 06:23:5.207907 GMT+2'), 'adhoc': False, 'date_received': DateTime('2017/10/24 12:02:15 GMT+2'), 'composite': False, 'sampling_date': DateTime('2018/03/20 06:23:5.308375 GMT+2'), 'sample_type': {'url': 'http://192.168.0.25/bika_setup/bika_sampletypes/sampletype-12', 'obj': <SampleType at sampletype-12>, 'id': 'sampletype-12', 'title': 'Sputum'}, 'date_disposal': DateTime('2017/09/25 00:00:00 GMT+2'), 'remarks': '', 'id': 'SP17-002058'}, 'invalid': False, 'laboratory': {'confidence': None, 'obj': <Laboratory at laboratory>, 'title': 'NMRL', 'url': '', 'accreditation_body': '', 'accredited': False, 'address': \"<div class='address'><span>2nd Floor New Laboratory Complex</span><span>Southerton</span><span>Harare</span><span>Harare</span><span>Zimbabwe</span></div>\", 'logo': 'http://192.168.0.25/logo_print.png', 'supervisor': '', 'accreditation_logo': ''}, 'id': 'SP17-002058-R01', 'categorized_analyses': {'Lab Analyses': {'TB Sample Analysis': [{'scientific_name': False, 'formatted_result': 'Mucoid', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': '', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Appearance', 'outofrange': False, 'accredited': False, 'id': 'SampleAppearance', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': '', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleAppearance>, 'retested': False, 'previous_results': '', 'keyword': 'SampleAppearance', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.211296 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}, {'scientific_name': False, 'formatted_result': '1-3', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': 'ml', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Volume', 'outofrange': False, 'accredited': False, 'id': 'SampleVolume', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': 'ml', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleVolume>, 'retested': False, 'previous_results': '', 'keyword': 'SampleVolume', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.034411 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}]}}, 'invoiced': False, 'totalprice': Decimal('0.0000'), 'hasblanks': False, 'qcanalyses': [], 'points_of_capture': ['Lab Analyses'], 'categorized_qcanalyses': {}, 'adhoc': False, 'date_received': '2017-10-24T12:02:16+02:00', 'late': True, 'specifications': {}, 'contact': {'pubpref': ('email', 'pdf', 'print', 'smsresult'), 'fullname': 'Sister in charge', 'obj': <Contact at contact-508>, 'email': ''}, 'invoice_exclude': False, 'department_analyses': {'fcf36ce00a2d451aaef7e82f06636b0a': {'Lab Analyses': {'TB Sample Analysis': [{'scientific_name': False, 'formatted_result': 'Mucoid', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': '', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Appearance', 'outofrange': False, 'accredited': False, 'id': 'SampleAppearance', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': '', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleAppearance>, 'retested': False, 'previous_results': '', 'keyword': 'SampleAppearance', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.211296 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}, {'scientific_name': False, 'formatted_result': '1-3', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': 'ml', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Volume', 'outofrange': False, 'accredited': False, 'id': 'SampleVolume', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': 'ml', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleVolume>, 'retested': False, 'previous_results': '', 'keyword': 'SampleVolume', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.034411 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}]}}}, 'date_sampled': '2017-09-25T00:00:00', 'prepublish': True, 'reporter': {'username': u'tinarwok', 'fullname': 'Kennedy Tinarwo', 'email': 'tinarwok@nmrl.org.zw'}, 'an_attachments': [], 'date_published': '2019-02-18T11:14:50+02:00', 'portal': {'url': 'http://192.168.0.25', 'obj': <PloneSite at senaite>}, 'hascontrols': False, 'remarks': '', 'analyses': [{'scientific_name': False, 'formatted_result': 'Mucoid', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': '', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Appearance', 'outofrange': False, 'accredited': False, 'id': 'SampleAppearance', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': '', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleAppearance>, 'retested': False, 'previous_results': '', 'keyword': 'SampleAppearance', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.211296 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}, {'scientific_name': False, 'formatted_result': '1-3', 'result': '1', 'formatted_specs': '', 'formatted_uncertainty': '', 'point_of_capture': 'Lab Analyses', 'refsample': 'SP17-002058', 'specs': {'max': '', 'min': '', 'warn_max': '', 'warn_min': ''}, 'unit': 'ml', 'previous': [], 'category': 'TB Sample Analysis', 'title': 'Sample Volume', 'outofrange': False, 'accredited': False, 'id': 'SampleVolume', 'worksheet_url': None, 'type': 'Analysis', 'formatted_unit': 'ml', 'reftype': None, 'remarks': '', 'obj': <Analysis at SampleVolume>, 'retested': False, 'previous_results': '', 'keyword': 'SampleVolume', 'worksheet': None, 'uncertainty': None, 'capture_date': DateTime('2018/03/20 06:23:4.034411 GMT+2'), 'request_id': 'SP17-002058-R01', 'isnumber': True}], 'child_analysisrequest': None, 'subtotal': Decimal('0.00'), 'haspreviousresults': False, 'categories': ['TB Sample Analysis'], 'client_reference': '', 'obj': <AnalysisRequest at SP17-002058-R01>, 'vat_amount': Decimal('0.0000'), 'footer': '', 'url': 'http://192.168.0.25/clients/client17-1100/SP17-002058-R01', 'client_sampleid': 'Frank Kangara', 'batch': {}, 'client': {'fax': '', 'obj': <Client at client17-1100>, 'name': 'Henderson Clinic', 'url': 'http://192.168.0.25/clients/client17-1100', 'phone': '+263778126772', 'address': \"<div class='address'></div>\", 'id': 'client17-1100'}, 'resultsinterpretationdepts': {'': {'uid': 'general', 'richtext': ''}, 'TB': {'uid': 'fcf36ce00a2d451aaef7e82f06636b0a', 'richtext': ''}}, 'hasduplicates': False, 'resultsinterpretation': ''}",
    })
  }
}

module.exports = DefaultSenaiteLIMS
