const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('boom')
const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const {
  getDateOrDefault,
  parseDateOrDefault,
  dateEqual,
} = require('../../shared/date')
const { convertStringToFloat } = require('../../shared/string')
const { deviceSeen } = require('../../device/actions')
const { resultUpdated, resultLogged } = require('../../result/actions')
const { SynchronousDataProcessor } = require('./_base')
const {
  sampleTypeToId,
  assayToId,
  resultSourceToId,
  resultTypeToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
} = require('../../shared/dictionary')

class PhilippinesNtrlDatabase extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 60000
    this.response = {}
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }

  async upsertResult(
    knex,
    rawMessage,
    site,
    result,
    resultCategory1Id,
    resultCategory2Id,
    newResultData,
    resultSignOff,
    resultStartedOn,
    resultEndedOn,
    operator,
    remarks,
    patientData,
    utcNow,
    resultCategories,
    resultWorkflowStatuses,
    resultOverwritePriority
  ) {
    const mergeDeep = (baseValue, sourceValue) => {
      if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
        return sourceValue
      }
      if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
        return baseValue
      }
      if (_.isArray(baseValue) && _.isArray(sourceValue)) {
        return [...(baseValue || []), ...(sourceValue || [])]
      }
      if (_.isPlainObject(baseValue) && _.isPlainObject(sourceValue)) {
        const mergedValue = {
          ...baseValue,
        }
        Object.keys(sourceValue).forEach(sourceValueKey => {
          mergedValue[sourceValueKey] = mergeDeep(
            mergedValue[sourceValueKey],
            sourceValue[sourceValueKey]
          )
        })
        return mergedValue
      }
      return sourceValue || baseValue
    }
    if (!result.resultCategory1) {
      result.resultCategory1 = resultCategories.Missing
    }
    if (!result.resultCategory2) {
      result.resultCategory2 = resultCategories.Missing
    }
    if (
      resultOverwritePriority.indexOf(resultCategory1Id) <
      resultOverwritePriority.indexOf(result.resultCategory1)
    ) {
      result.resultCategory1 = resultCategory1Id
    }
    if (
      resultOverwritePriority.indexOf(resultCategory2Id) <
      resultOverwritePriority.indexOf(result.resultCategory2)
    ) {
      result.resultCategory2 = resultCategory2Id
    }
    if (remarks && (!result.notes || !result.notes.includes(remarks.trim()))) {
      if (!result.notes) {
        result.notes = ''
      } else {
        result.notes += '\n'
      }
      result.notes += remarks
    }
    if (result.id) {
      if (!result.siteId) {
        result.siteId = site.id
      }
      if (site.longitude) {
        result.longitude = site.longitude
      }
      if (site.latitude) {
        result.latitude = site.latitude
      }
      if (!result.startedOn) {
        result.startedOn = resultStartedOn
      }
      if (!result.endedOn) {
        result.endedOn = resultEndedOn
      }
      const resultData = mergeDeep(JSON.parse(result.resultData || '{}'), {
        encodedResult: newResultData,
        resultSignOff,
      })
      result.resultData = JSON.stringify(resultData)
      const resultPatientData = JSON.parse(result.patientData || '{}')
      result.patientData = JSON.stringify(
        mergeDeep(resultPatientData, patientData)
      )
      if (result.rawData && result.rawData.indexOf(rawMessage) === -1) {
        result.rawData += `\n${rawMessage}`
      } else if (!result.rawData) {
        result.rawData = rawMessage
      }
      result.updatedOn = utcNow
      result.updatedBy = null
    }
    if (!result.id) {
      const [resultId] = await knex('Result').insert(result)
      result.id = resultId
    } else {
      await knex('Result').where('id', result.id).update(result)
    }
    const deviceLogId = await this.appendDeviceLog(
      knex,
      result.deviceId,
      result.id,
      rawMessage,
      utcNow
    )
    const resultWorkflowStatusLogId = await this.appendResultWorkflowLogs(
      knex,
      result,
      site,
      operator,
      utcNow,
      resultCategories,
      resultSignOff,
      resultWorkflowStatuses,
      deviceLogId
    )
    if (resultWorkflowStatusLogId) {
      await knex('Result')
        .where('id', result.id)
        .update({ resultWorkflowStatusLogId })
    }
    this.messageContext.dispatch(resultUpdated(result.id, deviceLogId))
    this.response.resultIds = [...this.response.resultIds, result.id]
  }

  async appendResultWorkflowLogs(
    knex,
    result,
    site,
    operator,
    utcNow,
    resultCategories,
    resultSignOff,
    resultWorkflowStatuses,
    deviceLogId
  ) {
    const resultWorkflowStatusId =
      result.resultCategory1 === resultCategories.Missing &&
      result.resultCategory2 === resultCategories.Missing
        ? resultWorkflowStatuses.Ordered
        : resultWorkflowStatuses.Processed
    const resultWorkflowLog = {
      resultId: result.id,
      resultWorkflowStatusId,
      operator,
      reason: `Data from ${site.deviceName}`,
      changedOn: utcNow,
      createdOn: utcNow,
    }
    let resultWorkflowStatusLogId = null
    const resultWorkflowStatusPriority = [
      resultWorkflowStatuses.Purged,
      resultWorkflowStatuses.Flagged,
      resultWorkflowStatuses.Acknowledged,
      resultWorkflowStatuses.Delivered,
      resultWorkflowStatuses.Deliverable,
      resultWorkflowStatuses.Validated,
      resultWorkflowStatuses.Error,
      resultWorkflowStatuses.Processed,
      resultWorkflowStatuses.InProgress,
      resultWorkflowStatuses.Ordered,
      resultWorkflowStatuses.OK,
    ]
    if (!result.resultWorkflowStatusLogId) {
      ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert(
        resultWorkflowLog
      )
      this.messageContext.dispatch(resultLogged(result.id, deviceLogId))
    } else {
      const existingResultWorkflowLog = await knex('ResultWorkflowLog')
        .where('id', result.resultWorkflowStatusLogId)
        .first()
      if (
        !existingResultWorkflowLog ||
        resultWorkflowStatusPriority.indexOf(resultWorkflowStatusId) <
          resultWorkflowStatusPriority.indexOf(
            existingResultWorkflowLog.resultWorkflowStatusId
          )
      ) {
        ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert(
          resultWorkflowLog
        )
        this.messageContext.dispatch(resultLogged(result.id, deviceLogId))
      }
    }
    if (
      resultSignOff &&
      resultSignOff.laboratoryTechnician &&
      resultSignOff.laboratorySupervisor &&
      resultSignOff.laboratoryManager
    ) {
      const mostRecentResultWorkflowStatusLogId =
        resultWorkflowStatusLogId || result.resultWorkflowStatusLogId
      let mostRecentResultWorkflowLog = null
      if (mostRecentResultWorkflowStatusLogId) {
        mostRecentResultWorkflowLog = await knex('ResultWorkflowLog')
          .where('id', mostRecentResultWorkflowStatusLogId)
          .first()
      }
      if (
        !mostRecentResultWorkflowLog ||
        resultWorkflowStatusPriority.indexOf(resultWorkflowStatuses.Validated) <
          resultWorkflowStatusPriority.indexOf(
            mostRecentResultWorkflowLog.resultWorkflowStatusId
          )
      ) {
        ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert({
          resultId: result.id,
          resultWorkflowStatusId: resultWorkflowStatuses.Validated,
          operator: resultSignOff.laboratoryManager,
          reason: `Data from ${site.deviceName}`,
          changedOn: utcNow,
          createdOn: utcNow,
        })
        ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert({
          resultId: result.id,
          resultWorkflowStatusId: resultWorkflowStatuses.Deliverable,
          operator: resultSignOff.laboratoryManager,
          reason: `Data from ${site.deviceName}`,
          changedOn: utcNow,
          createdOn: utcNow,
        })
        this.messageContext.dispatch(resultLogged(result.id, deviceLogId))
      }
    }
    return Promise.resolve(resultWorkflowStatusLogId)
  }

  async appendDeviceLog(knex, deviceId, resultId, rawMessage, utcNow) {
    const remoteAddress = getRemoteAddress(this.request)
    const [deviceLogId] = await knex('DeviceLog').insert({
      deviceId,
      resultId,
      source: 'Philippines NTRL DB Record Updated',
      createdOn: utcNow,
      senderIp: remoteAddress,
      rawMessage,
    })
    if (_.isNil(this.response.deviceLogIds)) {
      this.response.deviceLogIds = []
    }
    this.response.deviceLogIds = [...this.response.deviceLogIds, deviceLogId]
    return deviceLogId
  }

  getResultSignOff(testType, payload) {
    return {
      laboratoryTechnician: payload[`${testType}SignedOffBy1`],
      laboratorySupervisor: payload[`${testType}SignedOffBy2`],
      laboratoryManager: payload[`${testType}SignedOffBy3`],
    }
  }
}

class PhilippinesNtrlPmdt extends PhilippinesNtrlDatabase {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    // A set of the raw values received from thr NTRL database
    //  mapped to the site external IDs that should be used to
    //  determine sample collection site.
    this.facilityMappings = {
      'a.h lacson stc': 'A.H. Lacson STC',
      'a.h. lacson stc': 'A.H. Lacson STC',
      'abra provincial hospital': 'Abra Provincial Hospital',
      'adela serra ty memorial medical center stc':
        'Adela Serra Ty Memorial Medical Center STC',
      'adnph-pmdt': 'Agusan Del Norte Provincial Hospital PMDT-STC',
      'agusan del norte provincial hospital':
        'Agusan Del Norte Provincial Hospital PMDT-STC',
      'agusan del norte provincial hospital pmdt-stc':
        'Agusan Del Norte Provincial Hospital PMDT-STC',
      'allied care experts medical center baypointe':
        'Allied Care Experts Medical Center Baypointe',
      'amai pakpak medical center': 'Amai Pakpak Medical Center',
      'amma jadsac district hospital': 'Amma Jadsac District Hospital',
      'angeles university foundation medical center':
        'Angeles University Foundation Medical Center',
      'antipolo city health office': 'IVA - ANTIPOLO CHO',
      'antipolo-stc': 'IVA - ANTIPOLO CHO',
      'apari district hospital': 'Aparri Provincial Hospital STC',
      'aparri district hospital': 'Aparri Provincial Hospital STC',
      'aparri provincial hospital stc': 'Aparri Provincial Hospital STC',
      'appari district hospital': 'Aparri Provincial Hospital STC',
      astmmc: 'Adela Serra Ty Memorial Medical Center STC',
      'atang dela rama': 'Atang Dela Rama HC',
      'atang dela rama hc': 'Atang Dela Rama HC',
      'aurora hc': 'Aurora HC',
      'bacarra mho': 'Bacarra Municipal Health Office STC',
      'bacarra mho stc': 'Bacarra Municipal Health Office STC',
      'bacarra municipal health office stc':
        'Bacarra Municipal Health Office STC',
      'bacarra rhu': 'Bacarra Municipal Health Office STC',
      'bacoor chd': 'Bacoor City Health Office PMDT STC',
      'bacoor cho': 'Bacoor City Health Office PMDT STC',
      'bacoor city health': 'Bacoor City Health Office PMDT STC',
      'bacoor city health office': 'Bacoor City Health Office PMDT STC',
      'bacoor city health office pmdt stc':
        'Bacoor City Health Office PMDT STC',
      'bacoor. cho': 'Bacoor City Health Office PMDT STC',
      'baguio general hospital': 'Baguio General Hospital & Medical Center',
      'baguio general hospital & medical center':
        'Baguio General Hospital & Medical Center',
      'baguio general hospital and medical center':
        'Baguio General Hospital & Medical Center',
      'baguio general hospital medical center':
        'Baguio General Hospital & Medical Center',
      'balasan municipal health office': 'Balasan Municipal Health Office',
      'baliuag district  hosp.': 'Baliuag District Hospital PMDT STC',
      'baliuag district hosp.': 'Baliuag District Hospital PMDT STC',
      'baliuag district hospital': 'Baliuag District Hospital PMDT STC',
      'baliuag district hospital pmdt stc':
        'Baliuag District Hospital PMDT STC',
      'baliwag district hosp.': 'Baliuag District Hospital PMDT STC',
      'bamban 2': 'Bamban 2',
      'bantay municipal health office': 'Bantay Municipal Health Office',
      'baoor cho': 'Bacoor City Health Office PMDT STC',
      'baras medicare and community hospital':
        'Baras Medicare and Community Hospital',
      'baras medicare community hospital':
        'Baras Medicare and Community Hospital',
      'basud mho': 'Basud MHO STC',
      'basud mho pmdt stc': 'Basud MHO STC',
      'basud mho stc': 'Basud MHO STC',
      'basud mho -stc': 'Basud MHO STC',
      'bat gamc': 'Bat GAMC',
      'bataan general hospital': 'Bataan General Hospital',
      'batac city health office': 'Batac City Health Office',
      'batangas medical center pmdt tc': 'IVA - BATANGAS MEDICAL CTR',
      'batasan hills super health center pmdt stc':
        'Batasan Hills Super Health Center PMDT STC',
      begh: 'BeGH',
      'belmonte health center pmdt': 'Belmonte Health Center PMDT',
      bghmc: 'Baguio General Hospital & Medical Center',
      bghms: 'Baguio General Hospital & Medical Center',
      'bhdc- stc': 'BHDC-STC',
      'bhdc-stc': 'BHDC-STC',
      'bicol medical center': 'Bicol Medical Center',
      'bicol regional general hospital & geriotic medical center':
        'Bicol Regional General Hospital & Geriotic Medical Center',
      'bicol regional training and teaching hospital':
        'Bicol Regional Training and Teaching Hospital',
      'bicol sanitarium': 'Bicol Sanitarium',
      'binguet gen. hosp.': 'Binguet Gen. Hosp.',
      'bislig district hospital stc': 'Bislig District Hospital STC',
      'bjmp 4a regional infirmary tb dot': 'BJMP 4A Regional Infirmary TB DOT',
      'bjmp mmdj6 pmdt stc': 'BJMP 4A Regional Infirmary TB DOT',
      bmch: 'Baras Medicare and Community Hospital',
      bmho: 'Bantay Municipal Health Office',
      'bmho stc': 'Bantay Municipal Health Office',
      'boac rural health unit': 'Boac Rural Health Unit',
      'bondo peninsula district hosp.':
        'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bondoc peninsula dist. hosp.':
        'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bondoc peninsula district': 'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bondoc peninsula district hopistal':
        'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bondoc peninsula district hosp.':
        'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bondoc peninsula district hospital':
        'IVA - BONDOC PENINSULA DISTRICT HOSPITAL',
      'bontoc general hospital': 'Bontoc General Hospital',
      brggmc: 'Bicol Regional General Hospital & Geriotic Medical Center',
      brghgmc: 'Bicol Regional General Hospital & Geriotic Medical Center',
      'brghgmc - bicol sanitarium':
        'Bicol Regional General Hospital & Geriotic Medical Center',
      'brgy 310 health center': 'BRGY 310 Health Center',
      'bs pmdt': 'BS PMDT',
      'bukidnon provincial medical center':
        'Bukidnon Provincial Medical Center',
      'bulacan distric hosp.': 'Bulacan Distric Hosp.',
      'bulacan medical center': 'III - BULACAN MED CTR',
      bulmc: 'III - BULACAN MED CTR',
      'bulmc tb dots': 'III - BULACAN MED CTR',
      'butuan medical center stc': 'III - BULACAN MED CTR',
      'cadiz city health office': 'Cadiz City Health Office',
      'cadiz city health ofice': 'Cadiz City Health Office',
      'cadiz city hhealth office': 'Cadiz City Health Office',
      'cagayan valley medical center pmdt stc':
        'Cagayan Valley Medical Center PMDT STC',
      'cainta municipal hospital - ppmd unit': 'IVA - CAINTA PPMD/PMDT',
      'cainta ppmd': 'IVA - CAINTA PPMD/PMDT',
      'calamba cho': 'IVA - CALAMBA CHO',
      'calamba city health office i pmdt stc': 'IVA - CALAMBA CHO',
      'calamba city health office pmdt stc': 'IVA - CALAMBA CHO',
      'calbayog city health office': 'Calbayog City Health Office',
      'caraga regional hospital pmdt tc': 'Caraga Regional Hospital PMDT TC',
      ccho: 'IVA - CALAMBA CHO',
      'ccity of san fernando pampanga  rhu i':
        'City Of San Fernando Pampanga  RHU I',
      'cdh stc': 'CDH STC',
      'cdhu tb dots': 'CDUH TB DOTS CENTER',
      cduh: 'CDUH TB DOTS CENTER',
      'cduh tb dotd': 'CDUH TB DOTS CENTER',
      'cduh tb dots': 'CDUH TB DOTS CENTER',
      'cduh tb dots center': 'CDUH TB DOTS CENTER',
      'cebu doctors hosp.': "Cebu Doctor's University Hospital",
      'cebu doctors university': "Cebu Doctor's University Hospital",
      "cebu doctor's university hospital": "Cebu Doctor's University Hospital",
      'cebu provincial hospital carcar city':
        "Cebu Doctor's University Hospital",
      'cebu tb reference lab': 'Cebu Tuberculosis Reference Laboratory',
      'cebu tb reference lab.': 'Cebu Tuberculosis Reference Laboratory',
      'cebu tuberculosis reference laboratory':
        'Cebu Tuberculosis Reference Laboratory',
      'cebu velez gen. hosp': 'Cebu Velez General Hosp.',
      'cebu velez gen. hosp.': 'Cebu Velez General Hosp.',
      'cebu velez general hosp.': 'Cebu Velez General Hosp.',
      'chong hua hosp.': 'Chong Hua Hospital',
      'chong hua hospital': 'Chong Hua Hospital',
      'chong hua hospital - fuente': 'Chong Hua Hospital',
      'chong hua hospital mandaue': 'Chong Hua Hospital',
      'chonghua hospital': 'Chong Hua Hospital',
      'chung hua hosp.': 'Chong Hua Hospital',
      'chunghua hospital': 'Chong Hua Hospital',
      'city of san fernando pamoanga': 'City Of San Fernando Pampanga',
      'city of san fernando pampanga': 'City Of San Fernando Pampanga',
      'city of san fernando pampanga  rhu i':
        'City Of San Fernando Pampanga  RHU I',
      'city of san fernando pampanga 2': 'City Of San Fernando Pampanga RHU II',
      'city of san fernando pampanga rhu':
        'City Of San Fernando Pampanga  RHU I',
      'city of san fernando pampanga rhu 2':
        'City Of San Fernando Pampanga RHU II',
      'city of san fernando pampanga rhu i':
        'City Of San Fernando Pampanga  RHU I',
      'city of san fernando pampanga rhu ii':
        'City Of San Fernando Pampanga RHU II',
      'city of san fernando pampanga rhu2':
        'City Of San Fernando Pampanga RHU II',
      'city of san fernando panpanga': 'City Of San Fernando Pampanga',
      'claro m recto memorial district hopsital pmdt':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m recto memorial district hosp.':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m recto memorial district hospital':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m. recto district hosp.': 'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m. recto memorial district hosp.':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m. recto memorial district hospital':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m. recto memorial hosp.': 'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'claro m. recto memorial med. center':
        'IVA - CLARO M. RECTO MEM . DIST. HOSP',
      'concepcion district hospital': 'III - CONCEPCION DISTRICT HOSP.',
      'corazon aquino hc': 'Corazon Aquino Health Center',
      'corazon aquino health center': 'Corazon Aquino Health Center',
      coron: 'Coron STC',
      'coron rhu': 'Coron STC',
      'coron stc': 'Coron STC',
      'cotabato provincial hospital pmdt stc': 'Cotobato Provincial Hospital',
      'cotabato regional and medical center tc': 'Cotobato Provincial Hospital',
      'cotobato provincial hospital': 'Cotobato Provincial Hospital',
      'cotobato regional and medical center': 'Cotobato Provincial Hospital',
      cph: 'Cotobato Provincial Hospital',
      crh: 'Cotobato Provincial Hospital',
      crmc: 'CRMC TB Center',
      'crmc tb center': 'CRMC TB Center',
      'crmc tb dots': 'CRMC TB Center',
      'csfp rhu': 'CSFP RHU',
      'datu halun sakilan memorial hospital':
        'Datu Halun Sakilan Memorial Hospital',
      'davao del sur provincial hospital':
        'Davao Del Sur Provincial Hospital PMDT STC',
      'davao del sur provincial hospital pmdt stc':
        'Davao Del Sur Provincial Hospital PMDT STC',
      'davao regional medical center pmdt stc':
        'Davao Del Sur Provincial Hospital PMDT STC',
      dcmmh: 'DCMMH',
      'de la salle health sciences institute tc':
        'IVA - DE LA SALLE HEALTH SCIENCES INSTITUTE',
      deccsmh: 'DECCSMH STC',
      'deccsmh stc': 'DECCSMH STC',
      'democrito o. plaza memorial hospital':
        'Democrito O. Plaza Memorial Hospital',
      'dimasalang hc': 'Dimasalang HC',
      'dimasalang idots': 'Dimasalang HC',
      'dinalupihan rural health unit ii': 'Dinalupihan Rural Health Unit II',
      'dingras district hospital': 'Dingras District Hospital PMDT STC',
      'dingras district hospital pmdt stc':
        'Dingras District Hospital PMDT STC',
      'dioneda g. maglinte': 'Dioneda G. Maglinte',
      djprh: 'DJPRH',
      'don emilio del valle memorial hospital pmdt stc':
        'Don Emilio del Valle Memorial Hospital PMDT STC',
      'doña nena health center': 'Doña Nena Health Center',
      'dr. amado diaz provencial foundation hospital stc (dadpfh)':
        'Dr. Amado Diaz Provencial Foundation Hospital STC (DADPFH)',
      'dr. antonio l. valle sr. memorial hc':
        'Dr. Antonio L. Valle Sr. Memorial Health Center PMDT STC',
      'dr. antonio l. valle sr. memorial health center':
        'Dr. Antonio L. Valle Sr. Memorial Health Center PMDT STC',
      'dr. antonio l. valle sr. memorial health center pmdt stc':
        'Dr. Antonio L. Valle Sr. Memorial Health Center PMDT STC',
      'dr. antonio l. velle sr. memorial hc':
        'Dr. Antonio L. Valle Sr. Memorial Health Center PMDT STC',
      'dr. elvira manaloto-lagrosa health center pmdt stc':
        'Dr. Elvira Manaloto-Lagrosa Health Center PMDT STC',
      'dr. emigdio c. cruz sr. memorial hosp.':
        'Dr. Emigdio C. Cruz Sr. Memorial Hosp.',
      'dr. jorge p. royeca hospital (djrph)':
        'Dr. Jorge P. Royeca Hospital (DJRPH)',
      'dr. jose n. rodriguez memorial hospital pmdt tc':
        'Dr. Jose N. Rodriguez Memorial Hospital PMDT TC',
      'dr. jose rizal memorial hospital - pmdt stc':
        'Dr. Jose Rizal Memorial Hospital - PMDT STC',
      'dr. pablo o. torre memorial hospital pmdt tc':
        'Dr. Pablo O. Torre Memorial Hospital PMDT TC',
      'dr. paulino j. garcia memorial research and medical center':
        'III - Dr. PJGMRMC STC',
      'dr. paulino j. garcia memorial researcha and medical center':
        'III - Dr. PJGMRMC STC',
      'dr. rafael s. tumbokon memorial hospital pmdt stc':
        'Dr. Rafael S. Tumbokon Memorial Hospital PMDT STC',
      'dr. rigmdmc': 'Dr. RIGMDMC',
      'drhu ii': 'DRHU II',
      dsph: 'DSPH',
      'e. aldana health center': 'E. Aldana Health Center',
      'east avenue medical center': 'East Avenue Medical Center PMDT STC',
      'east avenue medical center pmdt stc':
        'East Avenue Medical Center PMDT STC',
      'eastern samar provincial hospital pmdt stc':
        'Eastern Samar Provincial Hospital PMDT STC',
      'el nido rural health unit': 'El Nido Rural Health Unit',
      'elias aldana health center': 'ELIAS ALDANA HEALTH CENTER',
      'endoscopi unit': 'Endoscopy Unit',
      'endoscopy unit': 'Endoscopy Unit',
      'estern samar prov. hosp.': 'Eastern Samar Provincial Hospital PMDT STC',
      eswl: 'ESWL',
      'eversley childs sanitarium tc': 'Eversley Childs Sanitarium TC',
      'gabmmc-stc': 'Gat Andres Bonifacio Memorial Medical Center PMDT STC',
      'gat andres bonifacio memorial medical center pmdt stc':
        'Gat Andres Bonifacio Memorial Medical Center PMDT STC',
      gcgmh: 'GCGMH',
      'gen. emilio aguinaldo memorial hospital pmdt stc':
        'Gen. Emilio Aguinaldo Memorial Hospital PMDT STC',
      'gen. mariano alvarez rhu': 'Gen. Mariano Alvarez RHU',
      'gen. mariano alvarez rhu ii': 'Gen. Mariano Alvarez RHU II',
      'gen. mariano alvrez rhu ii': 'Gen. Mariano Alvarez RHU II',
      'general emiliio aguinaldo memorial hospital pmdt stc':
        'General Emilio Aguinaldo Memorial Hospital PMDT STC',
      'general emilio aguinaldo memorial hospital pmdt stc':
        'General Emilio Aguinaldo Memorial Hospital PMDT STC',
      'general emilio aguinaldomemorial hospital':
        'General Emilio Aguinaldo Memorial Hospital PMDT STC',
      'general mariano alvarez rhu2 pmdt stc': 'Gen. Mariano Alvarez RHU II',
      'gilberto d. teodoro memorial hosp.':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gilberto o teodoro memorial hosp.':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gilberto o. teodoro memorial hosp.':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gilberto o. teodoro memorial hospital':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gilberto o. teodoro memorial hospital tarlac':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gilberto teodoro memorial hosp.':
        'Gilberto O. Teodoro Memorial Hospital Tarlac',
      'gingoog city health office': 'Gingoog City Health Office',
      'gotmh  pmdt stc': 'GOTMH  PMDT STC',
      'gov. celestino gallares memorial hosp.':
        'Governor Celestino Gallares Memorial Hospital PMDT STC',
      'governor celestino gallares memorial hospital':
        'Governor Celestino Gallares Memorial Hospital PMDT STC',
      'governor celestino gallares memorial hospital pmdt stc':
        'Governor Celestino Gallares Memorial Hospital PMDT STC',
      'grace park health center pmdt stc': 'Grace Park Health Center PMDT STC',
      'guimba community hosp.': 'Guimba Community Hospital PMDT STC',
      'guimba community hospital pmdt stc':
        'Guimba Community Hospital PMDT STC',
      'guimba district hosp.': 'Guimba Community Hospital PMDT STC',
      'guimba municipal health office pmdt stc': 'III - GUIMBA RHU I',
      'guimba rural health unit i': 'III - GUIMBA RHU I',
      'guimbal municipal health office': 'III - GUIMBA RHU I',
      'guimbal rural health': 'III - GUIMBA RHU I',
      'guimbal rural health - pmdt stc': 'III - GUIMBA RHU I',
      'gumaca district hospital pmdt stc': 'IVA - GUMACA DISTRICT HOSP.',
      'hagonoy rhu i': 'Hagonoy RHU I',
      'hagonoy rhui': 'Hagonoy RHU I',
      'hrhu i pmdt stc': 'HRHU I PMDT STC',
      'iba  rural health unit': 'IBA Rural Health Unit',
      'iba rural health unit': 'IBA Rural Health Unit',
      idh: 'IDH',
      'iligan society of internists pmdt stc':
        'Iligan Society of Internists PMDT STC',
      'ilocos training and regional medical center- pmdt tc':
        'Ilocos Training and Regional Medical Center- PMDT TC',
      imho: 'IMHO',
      'imus cho  i': 'Imus City Health Office I - PMDT STC',
      'imus cho i': 'Imus City Health Office I - PMDT STC',
      'imus city health office': 'Imus City Health Office I - PMDT STC',
      'imus city health office 1': 'Imus City Health Office I - PMDT STC',
      'imus city health office i': 'Imus City Health Office I - PMDT STC',
      'imus city health office i - pmdt stc':
        'Imus City Health Office I - PMDT STC',
      'iom manila health center': 'IOM Manila Health Center',
      'iom mhc': 'IOM Manila Health Center',
      'iom- mhc': 'IOM Manila Health Center',
      'iom-manila hc': 'IOM Manila Health Center',
      'iom-mhc': 'IOM Manila Health Center',
      'ipil municipal health office': 'Ipil Municipal Health Office',
      'iwahig prison and penal farm': 'Iwahig Prison and Penal Farm',
      'james l. gordon memorial hospital': 'James L. Gordon Memorial Hospital',
      jbdaph: 'JBDAPH PMDT STC',
      'jbdaph pmdt stc': 'JBDAPH PMDT STC',
      'jonife m. casupanan': 'Jonife M. Casupanan',
      'jose b. lingad memorial regional hospital stc':
        "III - JOSE B. LINGAD MEM REG'L HOSP.",
      'jose fabella hc': 'Jose Fabella HC',
      'josefina belmonte duran albay prov. hosp.':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hosp pmdt stc':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hosp pmdtstc':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hosp.':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hospital':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hospital pmdt':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay provincial hospital pmdt stc':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmonte duran albay stc':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefina belmontye duran albay provincial hospital':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'josefna belmonte duran albay provincial hospital':
        'Josefina Belmonte Duran Albay Provincial Hospital PMDT STC',
      'jsmmc remal center': 'JSMMC REMAL CENTER',
      'kabalikat sa kalusugan mdrtb half way housing facility':
        'Kabalikat Sa Kalusugan MDRTB Half Way Housing Facility',
      'kalinga provincial hospital': 'Kalinga Provincial Hospital',
      'karuhatan health center': 'Karuhatan Health Center',
      'kolambongan rhu': 'Kolambungan RHU PMDT STC',
      'kolambugan rhu': 'Kolambungan RHU PMDT STC',
      'kolambungan rhu': 'Kolambungan RHU PMDT STC',
      'kolambungan rhu pmdt stc': 'Kolambungan RHU PMDT STC',
      'koronadal city health office tc': 'Koronadal City Health Office TC',
      'la carlota city health office': 'La Carlota City Health Office',
      'la union med. center': 'La Union Medical Center PMDT STC',
      'la union medical center': 'La Union Medical Center PMDT STC',
      'la union medical center pmdt stc': 'La Union Medical Center PMDT STC',
      'lacson health center pmdt stc': 'A.H. Lacson STC',
      'lamitan city health office': 'Lamitan City Health Office',
      lccho: 'IVA - LIPA CITY CHO',
      ldzdh: 'LDZDH',
      'lipa city health office': 'IVA - LIPA CITY CHO',
      'lorenzo d. zayco district hospital':
        'Lorenzo D. Zayco District Hospital',
      'los baños rural heath unit 1 pmdt stc': 'IVA - LOS BAÑOS RHU',
      'lubao rhu iii': 'Lubao RHU III',
      'lubao rural health unit': 'Lubao Rural Health Unit PMDT STC',
      'lubao rural health unit 111': 'Lubao RHU III',
      'lubao rural health unit ii': 'Lubao Rural Health Unit II',
      'lubao rural health unit pmdt': 'Lubao Rural Health Unit PMDT STC',
      'lubao rural health unit pmdt stc': 'Lubao Rural Health Unit PMDT STC',
      'lung center of the philippines  - national center for pulmonary research':
        'Lung Center of the Philippines  - National Center for Pulmonary Research',
      'mabalacat rural health unit': 'III - MABALACAT RHU I',
      'mabalacat rural health unit i_pmdt  stc': 'III - MABALACAT RHU I',
      'macabebe rhui': 'Macabebe RHUI',
      'mactan doctors hosp.': 'Mactan Doctors Hosp.',
      'maguindanao provincial hospital': 'Maguindanao Provincial Hospital',
      'manolo fortich rhu': 'Manolo Fortich RHU',
      'margosatubig regional hospital pmdt stc':
        'Margosatubig Regional Hospital PMDT STC',
      'maria aurora community hospital': 'Maria Aurora Community Hospital',
      'mariano marcos memorial hosp. and med. center':
        'Mariano Marcos Memorial Hosp. and Med. Center',
      'marikina cough center': 'Marikina Cough Center',
      'masambong hc': 'Masambong Health Center',
      'masambong health center': 'Masambong Health Center',
      'masbate provincial hospital pmdt stc':
        'Masbate Provincial Hospital PMDT STC',
      'mati city health office': 'Mati City Health Office',
      'mauban mho': 'Mauban Rural Health Unit PMDT STC',
      'mauban rhu': 'Mauban Rural Health Unit PMDT STC',
      'mauban rhu i': 'Mauban Rural Health Unit PMDT STC',
      'mauban rural health': 'Mauban Rural Health Unit PMDT STC',
      'mauban rural health unit': 'Mauban Rural Health Unit PMDT STC',
      'mauban rural health unit pmdt stc': 'Mauban Rural Health Unit PMDT STC',
      'mayor hilarion a. ramiro, sr. regional training and teaching hospital pmdt stc':
        'Mayor Hilarion A. Ramiro, Sr. Regional Training and Teaching Hospital PMDT STC',
      'mcu-hsw': 'MCU-HSW',
      'mendero med. center': 'Mendero Med. Center',
      'mis. occ. prov. hosp.': 'Misamis Occidental Provincial Hospital PMDT',
      'misamis occidental prov. hosp.':
        'Misamis Occidental Provincial Hospital PMDT',
      'misamis occidental provincial hospital':
        'Misamis Occidental Provincial Hospital PMDT',
      'misamis occidental provincial hospital pmdt':
        'Misamis Occidental Provincial Hospital PMDT',
      'moncada rhu': 'III - MONCADA CTR',
      'moonwalk health center pmdt stc': 'Moonwalk Health Center PMDT STC',
      'mrh stc': 'MRH STC',
      'mrxuh tb dots c/o xu-chcc': 'MRXUH TB DOTS C/O XU-CHCC',
      'nabas rhu': 'Nabas Rural Health Unit PMDT STC',
      'nabas rhu pmdt stc': 'Nabas Rural Health Unit PMDT STC',
      'nabas rural health unit': 'Nabas Rural Health Unit PMDT STC',
      'nabas rural health unit pmdt stc': 'Nabas Rural Health Unit PMDT STC',
      'nabas rural heath unit pmdt stc': 'Nabas Rural Health Unit PMDT STC',
      'nabasrhu pmdt stc': 'Nabas Rural Health Unit PMDT STC',
      'nagpayong super hc': 'Nagpayong Super HC',
      'narra municipal health office': 'Narra Municipal Health Office',
      'nasugbu rural health unit': 'IVA - NASUGBU RHU',
      ndch: 'NDCH',
      'negros occidental provincial hospital':
        'Negros Occidental Provincial Hospital',
      'negros oriental chest clinic and dispensary':
        'Negros Oriental Chest Clinic and Dispensary',
      'negros oriental povincial hospital pmdt stc':
        'Negros Occidental Provincial Hospital',
      'neurosurgery- ctrl': 'Neurosurgery- CTRL',
      'new bilibid prison hospital': 'New Bilibid Prison Hospital',
      'north daang hari super health center':
        'North Daang Hari Super Health Center PMDT STC',
      'north daang hari super health center pmdt stc':
        'North Daang Hari Super Health Center PMDT STC',
      'north samar provinvial hospital': 'Northern Samar Provincial Hospital',
      'northern  samar provinvial hospital':
        'Northern Samar Provincial Hospital',
      'northern mindanao tb reference center':
        'Northern Mindanao TB Reference Center',
      'northern samar prov. hosp.': 'Northern Samar Provincial Hospital',
      'northern samar provincial hospital':
        'Northern Samar Provincial Hospital',
      'northern samar provinvial hospital':
        'Northern Samar Provincial Hospital',
      'occidental mindoro provincial hospital':
        'Occidental Mindoro Provincial Hospital',
      omsdh: 'OMSDH',
      'oriental mindoro provincial hospital':
        'Oriental Mindoro Provincial Hospital',
      'oriental mindoro south district hospital':
        'Oriental Mindoro Southern District Hospital PMDT STC',
      'oriental mindoro southern dh':
        'Oriental Mindoro Southern District Hospital PMDT STC',
      'oriental mindoro southern district hospita pmdt stc':
        'Oriental Mindoro Southern District Hospital PMDT STC',
      'oriental mindoro southern district hospital':
        'Oriental Mindoro Southern District Hospital PMDT STC',
      'oriental mindoro southern district hospital pmdt stc':
        'Oriental Mindoro Southern District Hospital PMDT STC',
      ormph: 'ORMPH',
      ormsdh: 'ORMSDH',
      orph: 'ORPH',
      'ospital ng palawan': 'Ospital ng Palawan',
      'pablo n. marquez memorial health & diagnostic center':
        'Pablo N. Marquez Memorial Health and Diagnostic Center- PMDT STC',
      'pablo n. marquez memorial health and diagnostic center':
        'Pablo N. Marquez Memorial Health and Diagnostic Center- PMDT STC',
      'pablo n. marquez memorial health and diagnostic center- pmdt stc':
        'Pablo N. Marquez Memorial Health and Diagnostic Center- PMDT STC',
      'pablo n. marquez memorial health diagnostic center':
        'Pablo N. Marquez Memorial Health and Diagnostic Center- PMDT STC',
      'pablo n. marquez morial health and diagnostic center':
        'Pablo N. Marquez Memorial Health and Diagnostic Center- PMDT STC',
      'pagsanjan rural health unit': 'IVA - PAGSANJAN RHU',
      'pagsinan rhu': 'Pagsinan RHU',
      'pamana hc': 'Pamana Health Center PMDT STC',
      'pamana health center pmdt stc': 'Pamana Health Center PMDT STC',
      'panabo polymedic hospital': 'Panabo Polymedic Hospital',
      'panatag health center': 'Panatag Health Center',
      'pangasinan ph': 'Pangasinan Provincial Hospital PMDT STC',
      'pangasinan prov. hosp': 'Pangasinan Provincial Hospital PMDT STC',
      'pangasinan prov. hosp.': 'Pangasinan Provincial Hospital PMDT STC',
      'pangasinan provincial hospital':
        'Pangasinan Provincial Hospital PMDT STC',
      'pangasinan provincial hospital pmdt stc':
        'Pangasinan Provincial Hospital PMDT STC',
      'pangasinan rhu': 'Pangasinan RHU',
      'pangasinanprov. hosp.': 'Pangasinan Provincial Hospital PMDT STC',
      'pangil rural health unit': 'IVA - PANGIL RHU',
      'paniqui rhu 1': 'Paniqui RHU I-STC',
      'paniqui rhu i': 'Paniqui RHU I-STC',
      'paniqui rhu i-stc': 'Paniqui RHU I-STC',
      'paniqui rhui': 'Paniqui RHU I-STC',
      'panopdopan district hosp.': 'Panopdopan District Hospital',
      'panopdopan district hospital': 'Panopdopan District Hospital',
      'pasig tc': 'Pasig Treatment center PMDT STC',
      'pasig tc-stc': 'Pasig Treatment center PMDT STC',
      'pasig treatment': 'Pasig Treatment center PMDT STC',
      'pasig treatment center': 'Pasig Treatment center PMDT STC',
      "pasig treatment center'": 'Pasig Treatment center PMDT STC',
      'pasig treatment center pmdt stc': 'Pasig Treatment center PMDT STC',
      'pasig tx center': 'Pasig Treatment center PMDT STC',
      'passi cho pmdt stc': 'Passi City Health Office',
      'passi city health office': 'Passi City Health Office',
      pcdh: 'PCDH',
      perpetual: 'Perpetual Succour Hosp. Public Private Mix Dots',
      'perpetual succour hosp. public private mix dots':
        'Perpetual Succour Hosp. Public Private Mix Dots',
      'philippines tuberculosis society, inc., negros occ. pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., negros occ.pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., negros occedental pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., negros occi. pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., negros occidental pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., nocc pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., noccd pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., nooccd pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., qi pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'philippines tuberculosis society, inc., tayuman pmdt tc':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      pnmmhdc: 'PNMMHDC',
      'pph pmdt stc': 'PPH PMDT STC',
      psh: 'PSH',
      'psh-ppmd': 'PSH-PPMD',
      'ptsi noccd':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'ptsi tayuman':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'ptsi tayuman pmdt':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'ptsi-negros occidental chest clinic and dispensery':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'ptsi-tayuman':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      'ptsi-tyuman':
        'Philippines Tuberculosis Society, Inc., Negros Occidental PMDT TC',
      qpmc: 'IVA - QUEZON MED CTR',
      'quezon city jail pmdt stc': 'Quezon City Jail PMDT STC',
      'quezon medical center': 'IVA - QUEZON MED CTR',
      'quezon medical center stc': 'IVA - QUEZON MED CTR',
      'quezon prov. mc': 'IVA - QUEZON MED CTR',
      'quezon province health office': 'Quezon Province Health Office',
      'quirino memorial med. center':
        'Quirino Memorial Medical Center PMDT STC',
      'quirino memorial med. center.':
        'Quirino Memorial Medical Center PMDT STC',
      'quirino memorial medical': 'Quirino Memorial Medical Center PMDT STC',
      'quirino memorial medical center':
        'Quirino Memorial Medical Center PMDT STC',
      'quirino memorial medical center pmdt stc':
        'Quirino Memorial Medical Center PMDT STC',
      'quirino prov. med. center': 'Quirino Memorial Medical Center PMDT STC',
      'quirino province medical center':
        'Quirino Memorial Medical Center PMDT STC',
      r2tmc: 'R2TMC',
      'rafael lazatin memorial center':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin memorial med. center':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin memorial medical center':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin memorial medical center - pmdt':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin memorial medical center pmdt stc':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin memorial medical center -pmdt stc':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rafael lazatin meorial medical center':
        'Rafael Lazatin Memorial Medical Center PMDT STC',
      'rau baganga': 'RAU Baganga',
      'rcho stc': 'RCHO STC',
      'rcho stl': 'RCHO STC',
      'reggion 1 medical center pmdt stc': 'Region 1 Medical Center PMDT STC',
      'region 1 medical center pmdt stc': 'Region 1 Medical Center PMDT STC',
      'region 2 medical center pmdt stc': 'Region 2 Medical Center PMDT STC',
      'region 2 trauma & medical center pmdt stc':
        'Region 2 Medical Center PMDT STC',
      'region 2 trauma and medical center': 'Region 2 Medical Center PMDT STC',
      'region 2 trauma and medical center pmdt stc':
        'Region 2 Medical Center PMDT STC',
      'region ii trauma and medical center': 'Region 2 Medical Center PMDT STC',
      'rhu 2 isabela': 'RHU 2 Isabela',
      'rhu 3 lubao': 'RHU 3 Lubao',
      'rhu talisayan': 'RHU Talisayan',
      'rhu-2 isabela west': 'RHU-2 Isabela West',
      rlmmc: 'RLMMC PMDT STC',
      'rlmmc pmdt': 'RLMMC PMDT STC',
      'rlmmc pmdt stc': 'RLMMC PMDT STC',
      rmmmh: 'RMMMH',
      'rodriguez rural health': 'IVA - RODRIGUEZ RHU',
      'rodriguez rural health unit pmdt stc': 'IVA - RODRIGUEZ RHU',
      'rogaciano m. mercado memorial hospital':
        'III - ROGACIANO M. MERCADO MEM HOSP.',
      'romana pangan district hosp.': 'Romana Pangan District Hospital STC',
      'romana pangan district hospital': 'Romana Pangan District Hospital STC',
      'romana pangan district hospital stc':
        'Romana Pangan District Hospital STC',
      'romanapangan district hosp.': 'Romana Pangan District Hospital STC',
      'romblon provincial hospital': 'Romblon Provincial Hospital',
      'romblon provoncial hospital': 'Romblon Provincial Hospital',
      'roxas city health office pmdt stc': 'Roxas City Health Office PMDT STC',
      'salubris med. center': 'Salubris Med. Center',
      'san andres': 'San Andres',
      'san antonio district hospital': 'San Antonio District Hospital',
      'san carlos cho': 'San Carlos City Health Office',
      'san carlos city health office': 'San Carlos City Health Office',
      'san fernando rural health unit i': 'San Fernando Rural Health Unit I',
      'san fernando rural health unit ii': 'San Fernando Rural Health Unit II',
      'san jose city general hospital': 'III - SAN JOSE CITY GEN. HOSP.',
      'san jose del monte  city health center':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte chc iv':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte cho':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte city hc iv':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte city health ccenter rural health unit pmdt stc':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte city health center':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      "san jose del monte city health center'":
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte city health center iv':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monte cuty health center':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose del monter city health center':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose delmonte chc iv':
        'III - OSPITAL NG LUNGSOD NG SAN JOSE DEL MONTE',
      'san jose rural health unit pmdt stc':
        'San Jose Rural Health Unit PMDT STC',
      'san juan rural health unit': 'IVA - SAN JUAN RHU',
      'san juan rural health unit pmdt stc': 'IVA - SAN JUAN RHU',
      'san lan lazaro hospital pmdt tc': 'San Lazaro Hospital PMDT TC',
      'san lazaro hospital pmdt tc': 'San Lazaro Hospital PMDT TC',
      'san lazaro ruiz womens hospital pmdt stc':
        'San Lazaro Ruiz Womens Hospital PMDT STC',
      "san lorenzo ruiz women's hospital":
        'San Lazaro Ruiz Womens Hospital PMDT STC',
      'san mateo super health center': 'IVA - SAN MATEO SUPER HEALTH CTR',
      'san mateo super health center pmdt stc':
        'IVA - SAN MATEO SUPER HEALTH CTR',
      'san miguel district hosp.': 'III - SAN MIGUEL DISTRICT HOSP.',
      'san miguel district hospital': 'III - SAN MIGUEL DISTRICT HOSP.',
      'san nicolas health center': 'San Nicolas Health Center',
      'san pascual dots center': 'San Pascual DOTS Center',
      'san ramon prison and penal farm': 'San Ramon Prison and Penal Farm',
      'san ramon prison penal farm': 'San Ramon Prison and Penal Farm',
      'sanlorenzo ruiz womens hospital':
        'San Lazaro Ruiz Womens Hospital PMDT STC',
      'santa rosa city health office 1 pmdt stc': 'IVA - STA ROSA CHO1',
      'santolan health center': 'Santolan Super HC',
      'santolan stc': 'Santolan Super HC',
      'santolan super hc': 'Santolan Super HC',
      'schistosomiasis control and research hospital':
        'Schistosomiasis Control and Research Hospital',
      scrh: 'Schistosomiasis Control and Research Hospital',
      'sebaste rhu': 'Sebaste RHU PMDT STC',
      'sebaste rhu pmdt stc': 'Sebaste RHU PMDT STC',
      'siargao district hospital pmdt stc':
        'Siargao District Hospital PMDT STC',
      'sibic rhu': 'Sibic RHU',
      'sigh stc': 'SIGH STC',
      slu: 'SLU HSH',
      'slu hsh': 'SLU HSH',
      sluhsh: 'SLU HSH',
      smdh: 'SMDH',
      'sorsogon medical mission group hospital and health services cooperative pmdt tc':
        'Sorsogon Medical Mission Group Hospital and Health Services Cooperative PMDT TC',
      'sotto ward 9': 'Sotto ward 9',
      'southern isabela general hospital': 'Southern Isabela General Hospital',
      'southern isabela medical': 'Southern Isabela General Hospital',
      'southern isabela medical center': 'Southern Isabela General Hospital',
      'southern palawan provincial hospital':
        'Southern Palawan Provincial Hospital',
      'southern philippines medical center pmdt tc':
        'Southern Philippines Medical Center PMDT TC',
      'spmc-pmdt': 'SPMC-PMDT',
      spph: 'SPPH',
      'st. vincent gen. hosp.': 'St. Vincent Gen. Hosp.',
      'sta. rosa city health office i - pmdt stc': 'IVA - STA ROSA CHO1',
      'sta.rosa city health office': 'IVA - STA ROSA CHO1',
      'subic rhu': 'Subic Rural Health Unit',
      'subic rural health unit': 'Subic Rural Health Unit',
      'sultan kudarat provincial hospital pmdt stc':
        'Sultan Kudarat Provincial Hospital PMDT STC',
      'sulu provincial hospital stc': 'Sulu Provincial Hospital STC',
      'super batasan': 'Super Batasan',
      svga: 'SVGA',
      swhsh: 'SWHSH',
      'taal rural health unit': 'IVA - TAAL RHU',
      'taal rural health unit stc': 'IVA - TAAL RHU',
      'tagaytay city health office': 'IVA - TAGAYTAY CHO',
      tala: 'Tala',
      tanay: 'IVA - TANAY',
      'tanay rural health unit pmdt stc': 'IVA - TANAY',
      'tarlac city hc': 'Tarlac City Health Center',
      'tarlac city health center': 'Tarlac City Health Center',
      'tarlac provincial hospital': 'III - TARLAC PROV. HOSP.',
      'tejeros health center makati': 'Tejeros Health Center Makati',
      'teresita l. jalandoni provincial hospital pmdt stc':
        'Teresita L. Jalandoni Provincial Hospital PMDT STC',
      'the medical city iloilo pcu4': 'The medical City Iloilo PCU4',
      tliph: 'TLIPH',
      'tondo  health center pmdt stc': 'Tondo Foreshore Health Center PMDT STC',
      'tondo foreshore health center pmdt stc':
        'Tondo Foreshore Health Center PMDT STC',
      'tondo hc': 'Tondo Foreshore Health Center PMDT STC',
      'tondo health center': 'Tondo Foreshore Health Center PMDT STC',
      'tropical disease foundation pmdt stc':
        'Tropical Disease Foundation PMDT STC',
      'tumana health center': 'Tumana Health Center',
      'tunasan health center': 'Tunasan Health Center',
      'united doctors of st. camillus  de lellies hosp.':
        'United Doctors Of St. Camillus  De Lellies Hosp.',
      'university of cebu  med. center': 'University of Cebu Medical Center',
      'university of cebu medical center': 'University of Cebu Medical Center',
      'up prime tb dots clinic': 'UP Prime TB DOTS CLINIC',
      updh: 'UPDH PMDT STC',
      'updh pmdt stc': 'UPDH PMDT STC',
      'urdaneta district hospital': 'Urdaneta District Hospital',
      'v. luna general hospital': 'V. Luna General Hospital',
      'vcj-bjmp': 'VCJ-BJMP',
      'vcmc - annex v': 'VCMC - Annex V',
      'veterans regional hospital': 'Veterans Regional Hospital',
      'vicente sotto memorial medical center stc':
        'Vicente Sotto Memorial Medical Center STC',
      'victor larobis': 'Victor Larobis',
      'visayas community med. center': 'Visayas community Medical Center',
      'visayas community medical center': 'Visayas community Medical Center',
      vlmc: 'Victor Larobis',
      'vrh- tb dots': 'Veterans Regional Hospital',
      wddh: 'WDDH',
      'wesr rembo hc': 'Wesr Rembo Health Center',
      'wesr rembo health center': 'Wesr Rembo Health Center',
      'west  rembo hc': 'Wesr Rembo Health Center',
      'west crame': 'West Crame Health Center PMDT STC',
      'west crame hc': 'West Crame Health Center PMDT STC',
      'west crame health center': 'West Crame Health Center PMDT STC',
      'west crame health center pmdt stc': 'West Crame Health Center PMDT STC',
      'west rame hc': 'West Crame Health Center PMDT STC',
      'west rembo': 'West Rembo Health Center PMDT STC',
      'west rembo  hc': 'West Rembo Health Center PMDT STC',
      'west rembo hc': 'West Rembo Health Center PMDT STC',
      'west rembo hc pmdt': 'West Rembo Health Center PMDT STC',
      'west rembo hc.': 'West Rembo Health Center PMDT STC',
      'west rembo health center': 'West Rembo Health Center PMDT STC',
      'west rembo health center pmdt': 'West Rembo Health Center PMDT STC',
      'west rembo health center pmdt stc': 'West Rembo Health Center PMDT STC',
      'west rembo stc': 'West Rembo Health Center PMDT STC',
      'western pangasinan district hospital':
        'Western Pangasinan District Hospital PMDT STC',
      'western pangasinan district hospital pmdt stc':
        'Western Pangasinan District Hospital PMDT STC',
      'western visayas medical center tc': 'Western Visayas Medical Center TC',
      'wvmc pmdt': 'Western Visayas Medical Center TC',
      'wvmc -pmdt': 'Western Visayas Medical Center TC',
      'xavier university community health care center pmdt tc':
        'Xavier University Community Health Care Center PMDT TC',
      'zamboanga city medical center pmdt tc':
        'Zamboanga City Medical Center PMDT TC',
      'City of Malolos Health OfficeV': 'City of Malolos Health OfficeV',
      'Premiere Medical Center': 'Premiere Medical Center',
      'La Paz Rural Health Unit (RHU) II': 'La Paz Rural Health Unit (RHU) II',
      'Mabalacat RHU III': 'Mabalacat RHU III',
      'Santa Maria RHU III': 'Santa Maria RHU III',
      'Lian RHU': 'Lian RHU',
      'Antipolo Health Units': 'Antipolo Health Units',
      'San Mateo IV': 'San Mateo IV',
      'Magdalena RHU': 'Magdalena RHU',
      'Rodriguez RHU IV': 'IVA - RODRIGUEZ RHU',
      'Siniloan RHU': 'Siniloan RHU',
      'Dasmarinas CHO II': 'Dasmarinas CHO II',
    }
  }

  static async canProcessRequest(request) {
    const { payload } = request
    const payloadKeys = Object.keys(payload)
    return (
      [
        'database',
        'table',
        'TimeStamp',
        'Serial Number',
        'Last Name',
        'First Name',
        'Middle Initial',
        'Address',
        'Referring Health Facility',
        'Culture Center',
        'Cat IV Screening Code',
        'MRF Date Requested',
        'Age',
        'Sex',
        'DST Center',
        'Requesting Physician',
        'Treatment Schedule',
        'Month of tx',
        'Enrolled',
        'Registration Group',
        'Treatment Category',
        'Type of Specimen',
        '(If Others) Specify',
        'Site',
        'Test Requested Smear',
        'Test Requested Culture',
        'Test Requested DST',
        'Test Requested LPA',
        'Test Requested Gx',
        'Date transfered to DST',
        'Presumptive DS or DR',
        'Lab No 1',
        'Date Collected 1',
        'Date Collected 2',
        'Date Collected 3',
        'Type of Collection 1',
        'Type of Collection 2',
        'Type of Collection 3',
        'Volume 1',
        'Volume 2',
        'Volume 3',
        'Consistency 1',
        'Consistency 2',
        'Consistence 3',
        'Prepared by',
        'Date Received',
        'Encoded By',
        'Date Encoded',
        'Smear Method',
        'Smear Method 2',
        'Smear Result 1',
        'Smear Result 2',
        'Smear Final Result',
        'Smear Date Released',
        'Smear Only Test Requested',
        'Smear Only Test Requested 2',
        'Smear TAT',
        'Smear Lab Tech',
        'Smear Encoded by',
        'Culture Date Inoculated',
        'Culture Med Tech',
        'Culture Result Status',
        'Culture DST Status',
        'Culture Method',
        'Culture Method 2',
        'Culture Result 1',
        'Culture Grade 1',
        'Culture Result 2',
        'Culture Grade 2',
        'Culture Final Result',
        'Culture Date Released',
        'Culture Encoded by',
        'Culture Lab Tech',
        'Culture TAT',
        'Culture Lab Manager',
        'Culture Remarks 1',
        'Culture Remarks 2',
        'TAT Culture Remarks',
        'DSSM&Culture Releasing Form Med Tech',
        'DSSM&Culture Releasing Form Date Released',
        'DSSM&Culture Releasing Form Laboratory Manager',
        'DST ID Result',
        'DST Date Inoculated',
        'DST MT Inoculated',
        'Streptomycin',
        'Isoniazid',
        'Rifampicin',
        'Ethambutol',
        'Kanamycin',
        'Levofloxacin',
        'Amikacin',
        'Capreomycin',
        'Pyrazinamide',
        'Ofloxacin',
        'Ciprofloxacin',
        'DST Date Read',
        'DST MT Read',
        'DST Date Released',
        'DST Lab Tech',
        'DST TAT',
        'DST Test Requested',
        'DST Laboratory Releasing Form Remarks',
        'DST Releasing Form MedTech',
        'DST Releasing Form Released Date',
        'DST Releasing Form Lab Manager',
        'DST Method Used',
        'DST Method Used Others',
        'DST Workbook Remarks',
        'DST Remarks',
        'DST Encoded by',
        'Gx Processing Date',
        'Gx MTB',
        'Gx Rifampicin',
        'Gx Date Released',
        'Gx Examiner',
        'Gx TAT',
        'Gx Laboratory Manager',
        'Gx Center',
        'Gx Laboratory Releasing Form Remarks',
        'LPA Male',
        'Gx Remarks',
        'TB Case Number',
        'LPA Kit Used',
        'LPA Kit Others',
        'LPA Date Processed',
        'LPA MTB Complex',
        'LPA Isoniazid Result',
        'LPA Rifampicin',
        'LPA Isoniazid',
        'LPA Rifampicin Result',
        'LPA Date Released',
        'LPA Ethambutol',
        'LPA Examiner',
        'LPA Fluoroquinolones',
        'LPA Aminoglycosides/ SLI',
        'LPA Mycobacterium Tb',
        'LPA Lab Manager',
        'LPA Remarks:',
        'LPA Center',
        'LPA Performed By',
        'LPA Reviewed By',
        'LPA Date of Release',
        'LPA Remarks',
        'LPA TAT',
        'Laboratory Releasing Form Remarks',
        'Laboratory Releasing Form Gx Remarks',
        'Laboratory Releasing Form Smear Remarks',
        'Laboratory Registry Remarks',
      ].every(expectedKey => payloadKeys.includes(expectedKey)) &&
      (payload.database.indexOf('PMDT') === 0 ||
        payload.table.indexOf('RECORDS_WITH_SIGN_OFFS_PMDT') === 0)
    )
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }
    return transact(async knex => {
      try {
        const { deviceId, partnerId, geographyId } =
          (await knex('DeviceApiKey')
            .where('token', auth.credentials.token)
            .first('deviceId', 'partnerId', 'geographyId')) || {}
        if (!deviceId) {
          throw Boom.badRequest(
            'Invalid device API key: Cannot determine which device this came from'
          )
        }
        this.response.deviceId = deviceId
        const dateKeys = [
          'MRF Date Requested',
          'Date transfered to DST',
          'Date Collected 1',
          'Date Collected 2',
          'Date Collected 3',
          'Date Received',
          'Date Encoded',
          'Smear Date Released',
          'Smear TAT',
          'Culture Date Inoculated',
          'Culture Date Released',
          'Culture TAT',
          'DSSM&Culture Releasing Form Date Released',
          'DST Date Inoculated',
          'DST Date Read',
          'DST Date Released',
          'DST Releasing Form Released Date',
          'Gx Processing Date',
          'Gx Date Released',
          'Gx TAT',
          'LPA Date Processed',
          'LPA Date Released',
          'LPA Date of Release',
          'LPA TAT',
          'Date Dispatch',
        ]
        dateKeys.forEach(dateKey => {
          payload[dateKey] = getDateOrDefault(payload, dateKey)
        })
        const rawMessage = JSON.stringify(request.plugins.rawPayload)
        const utcNow = new Date()
        await knex('Device')
          .where({ id: deviceId })
          .update({ lastSeenOn: utcNow, updatedOn: utcNow })
        const site = await knex('Device as d')
          .join('Site as s', 'd.siteId', 's.id')
          .where('d.id', deviceId)
          .first(
            's.*',
            'd.name as deviceName',
            'd.defaultReportableSiteId as deviceDefaultReportableSiteId'
          )

        this.messageContext.dispatch(deviceSeen(deviceId))

        const sampleTypeMapping = {
          Sputum: 'Sputum',
          Isolates: 'Isolate',
          Others: 'Other',
        }
        const sampleTypeId = await sampleTypeToId(
          sampleTypeMapping[payload['Type of Specimen']] || 'Other'
        )
        const referringHealthFacilityExternalId = payload[
          'Referring Health Facility'
        ]
          ? this.facilityMappings[
              payload['Referring Health Facility'].trim().toLowerCase()
            ] || payload['Referring Health Facility'].trim()
          : null
        let originSite
        if (referringHealthFacilityExternalId) {
          originSite = await knex('Site')
            .where('externalId', referringHealthFacilityExternalId)
            .first()
          if (!originSite) {
            const shortName =
              referringHealthFacilityExternalId.length > 45
                ? referringHealthFacilityExternalId.substring(0, 45)
                : referringHealthFacilityExternalId
            const countryDetails =
              (await knex('Geography as siteGeography')
                .join(
                  'Country as country',
                  'siteGeography.countryId',
                  'country.id'
                )
                .join(
                  'Geography as countryGeography',
                  'siteGeography.countryId',
                  'countryGeography.countryId'
                )
                .where('siteGeography.id', geographyId)
                .whereNull('countryGeography.stateId')
                .whereNull('countryGeography.lgaId')
                .first(
                  'countryGeography.id as countryGeographyId',
                  'country.timezone'
                )) || {}
            const [originSiteId] = await knex('Site').insert({
              name: referringHealthFacilityExternalId,
              shortName,
              externalId: referringHealthFacilityExternalId,
              partnerId,
              geographyId: countryDetails.countryGeographyId,
              timezoneId: countryDetails.timezone,
              createdOn: utcNow,
              updatedOn: utcNow,
            })
            originSite = await knex('Site').where('id', originSiteId).first()
          }
        }
        const labRequestIdPrefix =
          payload.database === 'PMDT' ||
          payload.table === 'RECORDS_WITH_SIGN_OFFS_PMDT'
            ? 'PN-19-'
            : payload.database.indexOf('PMDT') === 0
            ? `PN-${payload.database.substr(payload.database.length - 2)}-`
            : `PN-${payload.table.substr(payload.table.length - 2)}-`
        const ntrlLabRequestId = `${labRequestIdPrefix}${payload['Serial Number']}`
        const sampleOriginSiteId = originSite ? originSite.id : null
        const reportableSiteId =
          sampleOriginSiteId || site.deviceDefaultReportableSiteId || site.id

        const numberOfSamples =
          !!payload['Date Collected 3'] ||
          !!payload['Type of Collection 3'] ||
          !!payload['Volume 3'] ||
          !!payload['Consistence 3']
            ? 3
            : !!payload['Date Collected 2'] ||
              !!payload['Type of Collection 2'] ||
              !!payload['Volume 2'] ||
              !!payload['Consistency 2'] ||
              !!payload['Smear Method 2'] ||
              !!payload['Smear Result 2'] ||
              !!payload['Culture Method 2'] ||
              !!payload['Culture Result 2'] ||
              !!payload['Culture Grade 2'] ||
              !!payload['Culture Remarks 2']
            ? 2
            : 1
        const samples = _.range(1, numberOfSamples + 1).map(sampleNumber => {
          const sample = {
            externalId:
              numberOfSamples > 1
                ? `${ntrlLabRequestId}-${sampleNumber}`
                : `${ntrlLabRequestId}`,
            collectedOn: payload[`Date Collected ${sampleNumber}`],
            sampleTypeId,
            originSiteId: sampleOriginSiteId,
          }
          return sample
        })
        await Promise.each(samples, async (sample, index) => {
          let existingSample = await knex('Sample')
            .where('externalId', sample.externalId)
            .first()
          if (!existingSample && index === 0) {
            existingSample = await knex('Sample')
              .where('externalId', ntrlLabRequestId)
              .first()
          }
          if (existingSample) {
            sample.id = existingSample.id
            if (
              existingSample.externalId !== sample.externalId ||
              existingSample.sampleTypeId !== sample.sampleTypeId ||
              !dateEqual(existingSample.collectedOn, sample.collectedOn) ||
              existingSample.originSiteId !== sample.originSiteId
            ) {
              await knex('Sample').where('id', existingSample.id).update(sample)
            }
          } else {
            const [sampleId] = await knex('Sample').insert(sample)
            sample.id = sampleId
          }
        })
        const sampleIds = samples.map(sample => sample.id)
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
        const patientData = {
          id:
            payload['TB Case Number'] ||
            patientNameId ||
            payload['Lab No 1'] ||
            ntrlLabRequestId,
          serialNumber: payload['Serial Number'],
          mrfDateRequested: payload['MRF Date Requested'],
          referringHealthFacility: payload['Referring Health Facility'],
          requestingPhysician: payload['Requesting Physician'],
          facilityContactNumber: payload['Facility Contact Number'],
          lastName: payload['Last Name'],
          firstName: payload['First Name'],
          middleInitialOrName: payload['Middle Initial'],
          age: payload.Age,
          sex: payload.Sex,
          address: payload.Address,
          province: payload.Province,
          city: payload.City,
          phone: payload['Patient Contact Number'],
          paragioniamiasisResult1: payload['Paragioniamiasis Result 1'],
          paragioniamiasisResult2: payload['Paragioniamiasis Result 2'],
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
          testRequestedParagonimiasis: payload['Test Requested Paragonimiasis'],
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
          dateDispatched: payload['Date Dispatch'],
          volume1: payload['Volume 1'],
          volume2: payload['Volume 2'],
          volume3: payload['Volume 3'],
          consistency1: payload['Consistency 1'],
          consistency2: payload['Consistency 3'],
          consistency3: payload['Consistency 4'],
          specimenAccepted: payload['Specimen Accepted'],
          specimenRejectedReason: payload['Specimen Rejected Reason'],
          encodedBy: payload['Encoded By'],
          dateEncoded: payload['Date Encoded'],
          healthCareSystem: 'PMDT',
        }
        const resultSourceId = await resultSourceToId('LIMS')
        const resultTypeId = await resultTypeToId('Patient')
        const resultCategories = await allResultCategoryToId()
        const resultWorkflowStatuses = await allResultWorkflowStatusToId()
        const baseNewResult = {
          partnerId: site.partnerId,
          geographyId: site.geographyId,
          siteId: site.id,
          deviceId,
          longitude: site.longitude,
          latitude: site.latitude,
          resultSourceId,
          resultTypeId,
          resultCategory1: resultCategories.Missing,
          resultCategory2: resultCategories.Missing,
          patientData: JSON.stringify(patientData),
          rawData: rawMessage,
          createdOn: utcNow,
          createdBy: null,
          updatedOn: utcNow,
          updatedBy: null,
        }

        const objectHasValues = o =>
          Object.values(o).some(
            value => !_.isNil(value) && `${value}`.trim() !== ''
          )

        const dstResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(dstResultData, [
              'streptomycin',
              'isoniazid',
              'rifampicin',
              'ethambutol',
              'pyrazinamide',
              'kanamycin',
              'levofloxacin',
              'amikacin',
              'capreomycin',
              'dstTat',
              'dateReleased',
            ])
          ) ||
          payload['DST ID Result']
        ) {
          // TODO: Update MGIT Data processor to lookup results for assayGenericDst as well
          const assayBdMgitAstId = await assayToId('assayBdMgitAst')
          const assayGenericDstId = await assayToId('assayGenericDst')
          const externalId = `${site.externalId}_${samples[0].externalId}_DST`
          const resultSignOff = this.getResultSignOff('DST', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .whereIn('assayId', [assayBdMgitAstId, assayGenericDstId])
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId:
              (dstResultData.methodUsed || '').indexOf('MGIT') > -1
                ? assayBdMgitAstId
                : assayGenericDstId,
            sampleId: samples[0].id,
            startedOn:
              dstResultData.dateTransferredToDst ||
              dstResultData.dateRead ||
              dstResultData.dateReleased,
            endedOn:
              dstResultData.dstTat ||
              dstResultData.dateRead ||
              dstResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: dstResultData,
              resultSignOff,
            }),
            senderOperator: dstResultData.labTech,
            reportableSiteId,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartDateTime) {
            result.startedOn = parseDateOrDefault(resultData.testStartDateTime)
          }
          if (resultData.testEndedDateTime) {
            result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
          }
          const resultCategory1Id =
            {
              'M. tuberculosis': resultCategories.PositiveMTB,
              'No growth after 6 weeks': resultCategories.NotDetected,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'Non tuberculous mycobacteria': resultCategories.PositiveMOTT,
              Contaminated: resultCategories.Contaminated,
              'Not Done': resultCategories.Missing,
              'NON-VIABLE': resultCategories.Invalid,
            }[dstResultData.idResult] || resultCategories.Missing
          const resultCategory2IdMappings = {
            RESISTANT: resultCategories.Resistant,
            SUSCEPTIBLE: resultCategories.Susceptible,
            'NOT DONE': resultCategories.Missing,
            'NON VIABLE': resultCategories.Invalid,
            CONTAMINATED: resultCategories.Contaminated,
          }
          const resultsForDrugsTested = [
            dstResultData.streptomycin,
            dstResultData.isoniazid,
            dstResultData.rifampicin,
            dstResultData.ethambutol,
            dstResultData.pyrazinamide,
            dstResultData.kanamycin,
            dstResultData.levofloxacin,
            dstResultData.amikacin,
            dstResultData.capreomycin,
          ]
          let resultCategory2Id = resultCategories.Missing
          if (
            resultsForDrugsTested.some(
              resultForDrugsTested =>
                resultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested =>
                resultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Contaminated
            )
          ) {
            resultCategory2Id = resultCategories.Contaminated
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested =>
                resultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Susceptible
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested =>
                resultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Invalid
            )
          ) {
            resultCategory2Id = resultCategories.Invalid
          }
          const resultOverwritePriority = [
            resultCategories.PositiveMTB,
            resultCategories.PositiveMOTT,
            resultCategories.Detected,
            resultCategories.Resistant,
            resultCategories.Susceptible,
            resultCategories.Contaminated,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            dstResultData,
            resultSignOff,
            dstResultData.dateRead,
            dstResultData.dateRead,
            dstResultData.readBy,
            dstResultData.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        const cultureResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(cultureResultData, [
              'result1',
              'grade1',
              'result2',
              'grade2',
              'finalResult',
              'dateReleased',
            ])
          )
        ) {
          // TODO: Update MGIT Data processor to lookup results for assayGenericCulture as well
          const assayBdMgitGndId = await assayToId('assayBdMgitGnd')
          const assayGenericCultureId = await assayToId('assayGenericCulture')
          const cultureSamples = []
          if (cultureResultData.result1) {
            cultureSamples.push(samples[0])
          }
          if (cultureResultData.result2 && samples.length > 1) {
            cultureSamples.push(samples[1])
          }
          const resultSignOff = this.getResultSignOff('Culture', payload)
          await Promise.each(cultureSamples, async (cultureSample, index) => {
            const externalId = `${site.externalId}_${cultureSample.externalId}_CULTURE`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .whereIn('assayId', [assayBdMgitGndId, assayGenericCultureId])
                  .andWhere('sampleId', cultureSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId:
                (cultureResultData.methodUsed1 || '').indexOf('MGIT') > -1
                  ? assayBdMgitGndId
                  : assayGenericCultureId,
              sampleId: cultureSample.id,
              reportableSiteId,
              startedOn: cultureResultData.dateReleased,
              endedOn: cultureResultData.dateReleased,
              resultData: JSON.stringify({
                encodedResult: cultureResultData,
                resultSignOff,
              }),
              senderOperator:
                cultureResultData.medTech ||
                cultureResultData.labTech ||
                cultureResultData.encodedBy,
            }
            const resultData = JSON.parse(result.resultData)
            if (resultData.testStartDateTime) {
              result.startedOn = parseDateOrDefault(
                resultData.testStartDateTime
              )
            }
            if (resultData.testEndedDateTime) {
              result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
            }
            const resultCategoryMappings = {
              'M. tuberculosis': resultCategories.PositiveMTB,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'No growth after 6 weeks': resultCategories.NotDetected,
              Contaminated: resultCategories.Contaminated,
              Spillage: resultCategories.Invalid,
              'On-going': resultCategories.Missing,
              'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
              'No Specimen': resultCategories.NoResult,
              QNS: resultCategories.Invalid,
              'NON-VIABLE': resultCategories.Invalid,
              'Not Done': resultCategories.NoResult,
            }
            const resultCategory1Id =
              resultCategoryMappings[cultureResultData[`result${index + 1}`]] ||
              resultCategories.Missing
            const resultCategory2Id =
              resultCategoryMappings[cultureResultData.finalResult] ||
              resultCategories.Missing
            const resultOverwritePriority = [
              resultCategories.PositiveMTB,
              resultCategories.Detected,
              resultCategories.PositiveMOTT,
              resultCategories.Resistant,
              resultCategories.Susceptible,
              resultCategories.Contaminated,
              resultCategories.Invalid,
              resultCategories.NotDetected,
              resultCategories.NoResult,
              resultCategories.Missing,
            ]
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              cultureResultData,
              resultSignOff,
              cultureResultData.dateReleased,
              cultureResultData.dateReleased,
              cultureResultData.labTech,
              cultureResultData.remarks,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              resultOverwritePriority
            )
          })
        }

        const lpaResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(lpaResultData, [
              'mtbComplex',
              'rifampicin',
              'isoniazid',
              'ethambutol',
              'fluoroquinolones',
              'aminoglycoside',
              'dateReleased',
            ])
          )
        ) {
          const assayLpaId = await assayToId('assayLPA')
          const externalId = `${site.externalId}_${samples[0].externalId}_LPA`
          const resultSignOff = this.getResultSignOff('LPA', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .andWhere('assayId', assayLpaId)
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayLpaId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: lpaResultData.dateReleased,
            endedOn: lpaResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: lpaResultData,
              resultSignOff,
            }),
            senderOperator: lpaResultData.performedBy,
          }
          const resultCategory1Id = {
            'M. tb Detected': resultCategories.Detected,
            'M. tb Not Detected': resultCategories.NotDetected,
            Invalid: resultCategories.Invalid,
          }[lpaResultData.mtbComplex]
          const resultCategory2IdMappings = {
            'High-level resistance detected': resultCategories.Resistant,
            'Low-level resistance detected': resultCategories.Resistant,
            'Resistance not detected': resultCategories.Susceptible,
            'Resistance Detected': resultCategories.Resistant,
            'Resistance Not Detected': resultCategories.Susceptible,
          }
          const resultsForFirstLineDrugsTested = [
            lpaResultData.rifampicin,
            lpaResultData.isoniazid,
            lpaResultData.ethambutol,
          ]
          const resultsForSecondLineDrugsTested = [
            lpaResultData.fluoroquinolones,
            lpaResultData.aminoglycoside,
          ]
          const resultsForDrugsTested = [
            ...resultsForFirstLineDrugsTested,
            ...resultsForSecondLineDrugsTested,
          ]
          let resultCategory2Id = resultCategories.Missing
          if (
            resultsForDrugsTested.some(
              resultForDrugsTested =>
                resultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            resultsForFirstLineDrugsTested.every(resultForDrugsTested =>
              [resultCategories.Susceptible].includes(
                resultCategory2IdMappings[resultForDrugsTested]
              )
            ) ||
            resultsForSecondLineDrugsTested.every(resultForDrugsTested =>
              [resultCategories.Susceptible].includes(
                resultCategory2IdMappings[resultForDrugsTested]
              )
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          }
          const resultOverwritePriority = [
            resultCategories.PositiveMTB,
            resultCategories.PositiveMOTT,
            resultCategories.Detected,
            resultCategories.Resistant,
            resultCategories.Susceptible,
            resultCategories.Contaminated,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            lpaResultData,
            resultSignOff,
            lpaResultData.dateReleased,
            lpaResultData.dateReleased,
            lpaResultData.performedBy,
            lpaResultData.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        const smearResultData = {
          smearMethod: payload['Smear Method'],
          smearResult1: payload['Smear Result 1'],
          smearResult2: payload['Smear Result 2'],
          finalResult: payload['Smear Final Result'],
          dateReleased: payload['Smear Date Released'],
          encodedBy: payload['Smear Encoded by'],
          laboratoryTechnician: payload['Smear Lab Tech'],
          notedBy: payload['Smear Noted By'],
          verifiedBy: payload['Smear Verified By'],
        }
        if (
          objectHasValues(
            _.pick(smearResultData, [
              'smearResult1',
              'smearResult2',
              'finalResult',
              'dateReleased',
            ])
          )
        ) {
          const assaySmearId = await assayToId('assaySmear')
          const smearSamples = []
          if (smearResultData.smearResult1) {
            smearSamples.push(samples[0])
          }
          if (smearResultData.smearResult2 && samples.length > 1) {
            smearSamples.push(samples[1])
          }
          const resultCategoryMappings = {
            '0': resultCategories.NotDetected,
            '+1': resultCategories.Detected,
            '+2': resultCategories.Detected,
            '+3': resultCategories.Detected,
            '+4': resultCategories.Detected,
            '+5': resultCategories.Detected,
            '+6': resultCategories.Detected,
            '+7': resultCategories.Detected,
            '+8': resultCategories.Detected,
            '+9': resultCategories.Detected,
            '+10': resultCategories.Detected,
            '+11': resultCategories.Detected,
            '+12': resultCategories.Detected,
            '+13': resultCategories.Detected,
            '+14': resultCategories.Detected,
            '+15': resultCategories.Detected,
            '+16': resultCategories.Detected,
            '+17': resultCategories.Detected,
            '+18': resultCategories.Detected,
            '+19': resultCategories.Detected,
            '+20': resultCategories.Detected,
            '+21': resultCategories.Detected,
            '+22': resultCategories.Detected,
            '+23': resultCategories.Detected,
            '+24': resultCategories.Detected,
            '+25': resultCategories.Detected,
            '+26': resultCategories.Detected,
            '+27': resultCategories.Detected,
            '+28': resultCategories.Detected,
            '+29': resultCategories.Detected,
            '1+': resultCategories.Positive1,
            '2+': resultCategories.Positive2,
            '3+': resultCategories.Positive3,
            QNS: resultCategories.Invalid,
            'NON-VIABLE': resultCategories.Invalid,
            'NOT DONE': resultCategories.NoResult,
            'POSITIVE FOR Acid Fast Bacilli': resultCategories.Detected,
            'NEGATIVE FOR Acid Fast Bacilli': resultCategories.NotDetected,
          }
          const resultSignOff = this.getResultSignOff('Smear', payload)
          await Promise.each(smearSamples, async (smearSample, index) => {
            const externalId = `${site.externalId}_${smearSample.externalId}_SMEAR`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .where('assayId', assaySmearId)
                  .andWhere('sampleId', smearSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId: assaySmearId,
              sampleId: smearSample.id,
              reportableSiteId,
              startedOn: smearResultData.dateReleased,
              endedOn: smearResultData.dateReleased,
              resultData: JSON.stringify({
                encodedResult: smearResultData,
                resultSignOff,
              }),
              senderOperator: smearResultData.laboratoryTechnician,
            }
            const resultCategory1Id =
              resultCategoryMappings[
                index === 0
                  ? smearResultData.smearResult1
                  : smearResultData.smearResult2
              ]
            const resultCategory2Id =
              resultCategoryMappings[smearResultData.finalResult]
            const resultOverwritePriority = [
              resultCategories.Positive3,
              resultCategories.Positive2,
              resultCategories.Positive1,
              resultCategories.Detected,
              resultCategories.Invalid,
              resultCategories.NotDetected,
              resultCategories.NoResult,
              resultCategories.Missing,
            ]
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              smearResultData,
              resultSignOff,
              smearResultData.dateReleased,
              smearResultData.dateReleased,
              smearResultData.laboratoryTechnician,
              null,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              resultOverwritePriority
            )
          })
        }

        const geneXpertResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(geneXpertResultData, [
              'processingDate',
              'mtb',
              'rifampicin',
              'dateReleased',
            ])
          )
        ) {
          const assayGeneXpertMtbRifId = await assayToId('GxMtbRif')
          const assayGeneXpertMtbRifUltraId = await assayToId('GxMtbRifUltra')

          const externalId = `${site.externalId}_${samples[0].externalId}_GX`
          const resultSignOff = this.getResultSignOff('GeneXpert', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .whereIn('assayId', [
                  assayGeneXpertMtbRifId,
                  assayGeneXpertMtbRifUltraId,
                ])
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayGeneXpertMtbRifId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: geneXpertResultData.processingDate,
            endedOn: geneXpertResultData.processingDate,
            resultData: JSON.stringify({
              encodedResult: geneXpertResultData,
              resultSignOff,
            }),
            senderOperator: geneXpertResultData.examiner,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartedOn) {
            result.startedOn = parseDateOrDefault(resultData.testStartedOn)
          }
          if (resultData.testEndedOn) {
            result.endedOn = parseDateOrDefault(resultData.testEndedOn)
          }
          const resultCategory1Id = {
            POSITIVE: resultCategories.Detected,
            NEGATIVE: resultCategories.NotDetected,
          }[geneXpertResultData.mtb]
          const resultCategory2Id = {
            SUSCEPTIBLE: resultCategories.NotDetected,
            RESISTANT: resultCategories.Detected,
            INDETERMINATE: resultCategories.Indeterminate,
          }[geneXpertResultData.rifampicin]
          const resultOverwritePriority = [
            resultCategories.Detected,
            resultCategories.NotDetected,
            resultCategories.Error,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            geneXpertResultData,
            resultSignOff,
            geneXpertResultData.processingDate,
            geneXpertResultData.processingDate,
            geneXpertResultData.examiner,
            geneXpertResultData.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        const tbLampResultData = {
          tbLampResult: payload['TB LAMP Result'],
          verifiedBy: payload['TB LAMP Verified By'],
          notedBy: payload['TB LAMP Noted By'],
        }
        if (objectHasValues(_.pick(tbLampResultData, ['tbLampResult']))) {
          const assayTbLampId = await assayToId('assayTbLamp')
          const resultCategoryMappings = {
            POSITIVE: resultCategories.Positive,
            NEGATIVE: resultCategories.Negative,
            INDETERMINATE: resultCategories.Inconclusive,
          }
          const resultSignOff = this.getResultSignOff('TBLAMP', payload)
          const externalId = `${site.externalId}_${samples[0].externalId}_TB_LAMP`
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .andWhere('assayId', assayTbLampId)
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayTbLampId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn:
              smearResultData.dateReleased ||
              geneXpertResultData.processingDate,
            endedOn:
              smearResultData.dateReleased ||
              geneXpertResultData.processingDate,
            resultData: JSON.stringify({
              encodedResult: tbLampResultData,
              resultSignOff,
            }),
            senderOperator:
              smearResultData.laboratoryTechnician ||
              geneXpertResultData.examiner,
          }
          const resultCategory1Id =
            resultCategoryMappings[tbLampResultData.tbLampResult]
          const resultOverwritePriority = [
            resultCategories.Positive,
            resultCategories.Negative,
            resultCategories.Inconclusive,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            null,
            tbLampResultData,
            resultSignOff,
            smearResultData.dateReleased || geneXpertResultData.processingDate,
            smearResultData.dateReleased || geneXpertResultData.processingDate,
            tbLampResultData.notedBy,
            null,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(payload)
        throw e
      }
    })
  }
}

class PhilippinesNtrlRitm extends PhilippinesNtrlDatabase {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
  }

  static async canProcessRequest(request) {
    const { payload } = request
    const payloadKeys = Object.keys(payload)
    return (
      [
        'database',
        'table',
        'TimeStamp',
        'Serial Code RN-14-',
        'Last Name',
        'First Name',
        'Middle Name',
        'Age / Sex',
        'Date of Birth',
        'RITM Hospital No',
        'Date of Admission',
        'Requisitioner',
        'Address',
        'Reason for Examination',
        'History of Treatment',
        'Registration Group',
        'Presumptive DS or DR',
        'Specimen Type',
        'Accession No',
        'Laboratory No',
        'Culture Method',
        'Date and Time of Specimen Collection',
        'Date and Time of Specimen Receipt',
        'Encoded by',
        'Date and Time of Release of AFB Result',
        'Laboratory Test Performed Acid Fast Bacili Microscopy',
        'Smear Result 1',
        'Smear Result 2',
        'Smear Result 3',
        'FINAL RESULT',
        'Comments',
        'Smear Encoded by',
        'Performed by',
        'Validated by',
        'Noted by',
        'OPD',
        'Referral',
        'INPATIENT',
        'INPATIENT REMARKS',
        'MRF Encoded by',
        'MRF Date Encoded',
        'Smear',
        'Culture',
        'DST',
        'GeneXpert',
        'Date transfered to DST',
        'TBC Laboratory Test Performed',
        'TBC Test Result 1st Sample',
        'TBC Test Result 2nd Sample',
        'TBC Test Result 3rd Sample',
        'TBC FINAL RESULT',
        'Date and Time of Release of TBC Result',
        'TBC Comments',
        'TBC Encoded by',
        'TBC Performed by',
        'TBC Validated by',
        'TBC Noted by',
        'DST Laboratory Test Performed',
        'Streptomycin',
        'Isoniazid',
        'Rifampicin',
        'Ethambutol',
        'Pyrazinamide',
        'Kanamycin',
        'Capreomycin',
        'Amikacin',
        'Ofloxacin',
        'Levofloxacin',
        'DST Test Result 3rd Sample',
        'DST Final Result',
        'Date and Time of Release of DST Result',
        'DST Comments',
        'DST Encoded by',
        'DST Performed by',
        'DST Validated by',
        'DST Noted by',
        'GX Laboratory Test Performed',
        'MTB',
        'Rifampicin:',
        'GX Test Result 3rd Sample',
        'Date and Time of Release of Gx Result',
        'GX Comments',
        'GX Encoded by',
        'GX Performed by',
        'GX Validated by',
        'Referring Facility',
        'GX Noted by',
        'Smear Result 1 Date Collected',
        'Smear Result 2 Date Collected',
        'Smear Result 3 Date Collected',
      ].every(expectedKey => payloadKeys.includes(expectedKey)) &&
      (payload.database.indexOf('RITM') === 0 ||
        payload.table.indexOf('RECORDS_WITH_SIGN_OFFS_RITM') === 0)
    )
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }
    return transact(async knex => {
      try {
        const { deviceId, partnerId, geographyId } =
          (await knex('DeviceApiKey')
            .where('token', auth.credentials.token)
            .first('deviceId', 'partnerId', 'geographyId')) || {}
        if (!deviceId) {
          throw Boom.badRequest(
            'Invalid device API key: Cannot determine which device this came from'
          )
        }
        this.response.deviceId = deviceId
        const dateKeys = [
          'Date of Birth',
          'Date of Admission',
          'Date and Time of Specimen Collection',
          'Date and Time of Specimen Receipt',
          'Date and Time of Release of AFB Result',
          'MRF Date Encoded',
          'Date transfered to DST',
          'Date and Time of Release of TBC Result',
          'Date and Time of Release of DST Result',
          'Date and Time of Release of Gx Result',
          'Smear Result 1 Date Collected',
          'Smear Result 2 Date Collected',
          'Smear Result 3 Date Collected',
        ]
        dateKeys.forEach(dateKey => {
          payload[dateKey] = getDateOrDefault(payload, dateKey)
        })
        const rawMessage = JSON.stringify(request.plugins.rawPayload)
        const now = new Date()
        await knex('Device')
          .where({ id: deviceId })
          .update({ lastSeenOn: now, updatedOn: now })
        const site = await knex('Device as d')
          .join('Site as s', 'd.siteId', 's.id')
          .where('d.id', deviceId)
          .first(
            's.*',
            'd.name as deviceName',
            'd.defaultReportableSiteId as deviceDefaultReportableSiteId'
          )

        this.messageContext.dispatch(deviceSeen(deviceId))

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
        const sampleTypeId = await sampleTypeToId(
          sampleTypeMapping[payload['Specimen Type']] || 'Other'
        )
        const sanitizeReferringFacility = rawValue => {
          let facilityName = (rawValue || '').replace(/c\/o|,|\(|\)/gi, ' ')
          while (facilityName.indexOf('  ') > -1) {
            facilityName = facilityName.replace(/\s\s/g, ' ').trim()
          }
          if (
            ['DOTS', 'NO DATA', 'CD', 'D', 'C'].includes(
              facilityName.toUpperCase()
            )
          ) {
            facilityName = null
          }
          return facilityName
        }
        let referringFacility = sanitizeReferringFacility(payload.Address)
        if (!referringFacility) {
          referringFacility = sanitizeReferringFacility(
            payload['Referring Facility']
          )
        }
        let originSite
        if (referringFacility) {
          originSite = await knex('Site')
            .where('partnerId', partnerId)
            .andWhere(queryBuilder => {
              queryBuilder
                .where('externalId', referringFacility)
                .orWhere('name', referringFacility)
                .orWhere('shortName', referringFacility)
            })
            .first()
          if (!originSite) {
            const shortName =
              referringFacility.length > 45
                ? referringFacility.substring(0, 45)
                : referringFacility
            const countryDetails =
              (await knex('Geography as siteGeography')
                .join(
                  'Country as country',
                  'siteGeography.countryId',
                  'country.id'
                )
                .join(
                  'Geography as countryGeography',
                  'siteGeography.countryId',
                  'countryGeography.countryId'
                )
                .where('siteGeography.id', geographyId)
                .whereNull('countryGeography.stateId')
                .whereNull('countryGeography.lgaId')
                .first(
                  'countryGeography.id as countryGeographyId',
                  'country.timezone'
                )) || {}
            const [originSiteId] = await knex('Site').insert({
              name: referringFacility,
              shortName,
              externalId: referringFacility,
              partnerId,
              geographyId: countryDetails.countryGeographyId,
              timezoneId: countryDetails.timezone,
              createdOn: now,
              updatedOn: now,
            })
            originSite = await knex('Site').where('id', originSiteId).first()
          }
        }
        const labRequestIdPrefix =
          payload.database === 'RITM' ||
          payload.table === 'RECORDS_WITH_SIGN_OFFS_RITM'
            ? 'RN-19-'
            : payload.database.indexOf('RITM') === 0
            ? `RN-${payload.database.substr(payload.database.length - 2)}-`
            : `RN-${payload.table.substr(payload.table.length - 2)}-`
        const ntrlLabRequestId = `${labRequestIdPrefix}${payload['Serial Code RN-14-']}`
        const sampleOriginSiteId = originSite ? originSite.id : null
        const reportableSiteId =
          sampleOriginSiteId || site.deviceDefaultReportableSiteId || site.id

        const numberOfSamples =
          !!payload['Smear Result 3'] ||
          !!payload['TBC Test Result 3rd Sample'] ||
          !!payload['DST Test Result 3rd Sample'] ||
          !!payload['GX Test Result 3rd Sample'] ||
          !!payload['Smear Result 3 Date Collected']
            ? 3
            : !!payload['Smear Result 2'] ||
              !!payload['TBC Test Result 2nd Sample'] ||
              !!payload['Smear Result 2 Date Collected']
            ? 2
            : 1
        const samples = _.range(1, numberOfSamples + 1).map(sampleNumber => {
          const sample = {
            externalId:
              numberOfSamples > 1
                ? `${ntrlLabRequestId}-${sampleNumber}`
                : `${ntrlLabRequestId}`,
            collectedOn:
              payload[`Smear Result ${sampleNumber} Date Collected`] ||
              payload['Date and Time of Specimen Collection'],
            sampleTypeId,
            originSiteId: sampleOriginSiteId,
          }
          return sample
        })
        await Promise.each(samples, async (sample, index) => {
          let existingSample = await knex('Sample')
            .where('externalId', sample.externalId)
            .first()
          if (!existingSample && index === 0) {
            existingSample = await knex('Sample')
              .where('externalId', ntrlLabRequestId)
              .first()
          }
          if (existingSample) {
            sample.id = existingSample.id
            if (
              existingSample.externalId !== sample.externalId ||
              existingSample.sampleTypeId !== sample.sampleTypeId ||
              !dateEqual(existingSample.collectedOn, sample.collectedOn) ||
              existingSample.originSiteId !== sample.originSiteId
            ) {
              await knex('Sample').where('id', existingSample.id).update(sample)
            }
          } else if (!existingSample) {
            const [sampleId] = await knex('Sample').insert(sample)
            sample.id = sampleId
          }
        })
        const sampleIds = samples.map(sample => sample.id)
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
          const ageSexRegex = new RegExp(
            '(\\d*)(\\s?[|m|o|s]*)(\\/|\\?)(m|f)',
            'gi'
          )
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

        const patientData = {
          id:
            payload['RITM Hospital No'] ||
            patientNameId ||
            payload['Laboratory No'] ||
            ntrlLabRequestId,
          serialNumber: payload['Serial Code RN-14-'],
          referringHealthFacility:
            payload.Address || payload['Referring Facility'],
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
        const resultSourceId = await resultSourceToId('LIMS')
        const resultTypeId = await resultTypeToId('Patient')
        const resultCategories = await allResultCategoryToId()
        const resultWorkflowStatuses = await allResultWorkflowStatusToId()
        const baseNewResult = {
          partnerId: site.partnerId,
          geographyId: site.geographyId,
          siteId: site.id,
          deviceId,
          longitude: site.longitude,
          latitude: site.latitude,
          resultSourceId,
          resultTypeId,
          resultCategory1: resultCategories.Missing,
          resultCategory2: resultCategories.Missing,
          patientData: JSON.stringify(patientData),
          rawData: rawMessage,
          createdOn: now,
          createdBy: null,
          updatedOn: now,
          updatedBy: null,
        }

        const objectHasValues = o =>
          Object.values(o).some(
            value => !_.isNil(value) && `${value}`.trim() !== ''
          )

        const dstResultData = {
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
          readBy: payload['DST MT Read'],
          labTech: payload['DST Performed by'],
          encodedBy: payload['DST Encoded by'],
          reviewedBy: payload['DST Validated by'],
          notedBy: payload['DST Noted by'],
        }
        const dstResultOverwritePriority = [
          resultCategories.PositiveMTB,
          resultCategories.PositiveMOTT,
          resultCategories.Detected,
          resultCategories.Resistant,
          resultCategories.Susceptible,
          resultCategories.Contaminated,
          resultCategories.Invalid,
          resultCategories.NotDetected,
          resultCategories.Missing,
        ]
        if (
          objectHasValues(
            _.pick(dstResultData, [
              'streptomycin',
              'isoniazid',
              'rifampicin',
              'ethambutol',
              'pyrazinamide',
              'kanamycin',
              'levofloxacin',
              'amikacin',
              'capreomycin',
              'ofloxacin',
              'dateReleased',
            ])
          ) ||
          payload['DST Final Result']
        ) {
          // TODO: Update MGIT Data processor to lookup results for assayGenericDst as well
          const assayBdMgitAstId = await assayToId('assayBdMgitAst')
          const assayGenericDstId = await assayToId('assayGenericDst')
          const externalId = `${site.externalId}_${samples[0].externalId}_DST`
          const resultSignOff = this.getResultSignOff('DST', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .whereIn('assayId', [assayBdMgitAstId, assayGenericDstId])
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId:
              (dstResultData.methodUsed || '').indexOf('MGIT') > -1
                ? assayBdMgitAstId
                : assayGenericDstId,
            sampleId: samples[0].id,
            startedOn: dstResultData.dateReleased,
            endedOn: dstResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: dstResultData,
              resultSignOff,
            }),
            senderOperator: dstResultData.labTech,
            reportableSiteId,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartDateTime) {
            result.startedOn = parseDateOrDefault(resultData.testStartDateTime)
          }
          if (resultData.testEndedDateTime) {
            result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
          }
          const dstResultCategory1Id =
            {
              'Mycobacterium tuberculosis': resultCategories.PositiveMTB,
              ' No growth after 8 weeks': resultCategories.NotDetected,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
              Contaminated: resultCategories.Contaminated,
              'Incomplete: Did Not Sumbit 2 Samples': resultCategories.Missing,
              'Incomplete: Did Not Submit 2 Samples w/in 3 days':
                resultCategories.Missing,
              'Incomplete: Not submitted 2 samples w/in 3 days':
                resultCategories.Missing,
            }[dstResultData.idResult] || resultCategories.Missing
          const dstResultCategory2IdMappings = {
            RESISTANT: resultCategories.Resistant,
            SUSCEPTIBLE: resultCategories.Susceptible,
            'NOT TESTED': resultCategories.Missing,
          }
          const dstResultsForDrugsTested = [
            dstResultData.streptomycin,
            dstResultData.isoniazid,
            dstResultData.rifampicin,
            dstResultData.ethambutol,
            dstResultData.pyrazinamide,
            dstResultData.kanamycin,
            dstResultData.levofloxacin,
            dstResultData.amikacin,
            dstResultData.capreomycin,
            dstResultData.ofloxacin,
          ]
          let resultCategory2Id = resultCategories.Missing
          if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Contaminated
            )
          ) {
            resultCategory2Id = resultCategories.Contaminated
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Susceptible
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] ===
                resultCategories.Invalid
            )
          ) {
            resultCategory2Id = resultCategories.Invalid
          }
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            dstResultCategory1Id,
            resultCategory2Id,
            dstResultData,
            resultSignOff,
            dstResultData.dateRead,
            dstResultData.dateRead,
            dstResultData.readBy,
            dstResultData.remarks,
            patientData,
            now,
            resultCategories,
            resultWorkflowStatuses,
            dstResultOverwritePriority
          )
        }

        const cultureResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(cultureResultData, [
              'result1',
              'result2',
              'result3',
              'finalResult',
              'dateReleased',
            ])
          )
        ) {
          // TODO: Update MGIT Data processor to lookup results for assayGenericCulture as well
          const assayBdMgitGndId = await assayToId('assayBdMgitGnd')
          const assayGenericCultureId = await assayToId('assayGenericCulture')
          const cultureSamples = []
          if (cultureResultData.result1) {
            cultureSamples.push(samples[0])
          }
          if (cultureResultData.result2 && samples.length > 1) {
            cultureSamples.push(samples[1])
          }
          if (cultureResultData.result3 && samples.length > 2) {
            cultureSamples.push(samples[2])
          }
          const resultCategoryMappings = {
            'Mycobacterium tuberculosis': resultCategories.PositiveMTB,
            'No growth after 6 weeks': resultCategories.NotDetected,
            'No growth after 8 weeks': resultCategories.NotDetected,
            Contaminated: resultCategories.Contaminated,
            Spillage: resultCategories.Invalid,
            'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
            QNS: resultCategories.Invalid,
          }
          const cultureResultOverwritePriority = [
            resultCategories.PositiveMTB,
            resultCategories.Detected,
            resultCategories.PositiveMOTT,
            resultCategories.Resistant,
            resultCategories.Susceptible,
            resultCategories.Contaminated,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          const resultSignOff = this.getResultSignOff('Culture', payload)
          await Promise.each(cultureSamples, async (cultureSample, index) => {
            const externalId = `${site.externalId}_${cultureSample.externalId}_CULTURE`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .whereIn('assayId', [assayBdMgitGndId, assayGenericCultureId])
                  .andWhere('sampleId', cultureSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId:
                (cultureResultData.methodUsed1 || '').indexOf('MGIT') > -1
                  ? assayBdMgitGndId
                  : assayGenericCultureId,
              sampleId: cultureSample.id,
              reportableSiteId,
              startedOn: cultureResultData.dateReleased,
              endedOn: cultureResultData.dateReleased,
              resultData: JSON.stringify({
                encodedResult: cultureResultData,
                resultSignOff,
              }),
              senderOperator: cultureResultData.medTech,
            }
            const resultData = JSON.parse(result.resultData)
            if (resultData.testStartDateTime) {
              result.startedOn = parseDateOrDefault(
                resultData.testStartDateTime
              )
            }
            if (resultData.testEndedDateTime) {
              result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
            }
            const resultCategory1Id =
              resultCategoryMappings[cultureResultData[`result${index + 1}`]] ||
              resultCategories.Missing
            const resultCategory2Id =
              resultCategoryMappings[cultureResultData.finalResult] ||
              resultCategories.Missing
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              cultureResultData,
              resultSignOff,
              cultureResultData.dateReleased,
              cultureResultData.dateReleased,
              cultureResultData.labTech,
              cultureResultData.remarks,
              patientData,
              now,
              resultCategories,
              resultWorkflowStatuses,
              cultureResultOverwritePriority
            )
          })
        }

        const smearResultData = {
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
        }
        if (
          objectHasValues(
            _.pick(smearResultData, [
              'smearResult1',
              'smearResult2',
              'smearResult3',
              'finalResult',
              'dateReleased',
            ])
          )
        ) {
          const assaySmearId = await assayToId('assaySmear')
          const smearSamples = []
          if (smearResultData.smearResult1) {
            smearSamples.push(samples[0])
          }
          if (smearResultData.smearResult2 && samples.length > 1) {
            smearSamples.push(samples[1])
          }
          if (smearResultData.smearResult3 && samples.length > 2) {
            smearSamples.push(samples[2])
          }
          const resultCategoryMappings = {
            '0': resultCategories.NotDetected,
            '+1': resultCategories.Detected,
            '+2': resultCategories.Detected,
            '+3': resultCategories.Detected,
            '+4': resultCategories.Detected,
            '+5': resultCategories.Detected,
            '+6': resultCategories.Detected,
            '+7': resultCategories.Detected,
            '+8': resultCategories.Detected,
            '+9': resultCategories.Detected,
            '+10': resultCategories.Detected,
            '+11': resultCategories.Detected,
            '+12': resultCategories.Detected,
            '+13': resultCategories.Detected,
            '+14': resultCategories.Detected,
            '+15': resultCategories.Detected,
            '+16': resultCategories.Detected,
            '+17': resultCategories.Detected,
            '+18': resultCategories.Detected,
            '+19': resultCategories.Detected,
            '+20': resultCategories.Detected,
            '+21': resultCategories.Detected,
            '+22': resultCategories.Detected,
            '+23': resultCategories.Detected,
            '+24': resultCategories.Detected,
            '+25': resultCategories.Detected,
            '+26': resultCategories.Detected,
            '+27': resultCategories.Detected,
            '+28': resultCategories.Detected,
            '+29': resultCategories.Detected,
            '1+': resultCategories.Positive1,
            '2+': resultCategories.Positive2,
            '3+': resultCategories.Positive3,
            QNS: resultCategories.Invalid,
            'NON-VIABLE': resultCategories.Invalid,
            'NOT DONE': resultCategories.NoResult,
            'POSITIVE for Acid Fast Bacilli': resultCategories.Detected,
            'NEGATIVE for Acid Fast Bacilli': resultCategories.NotDetected,
          }
          const smearResultOverwritePriority = [
            resultCategories.Positive3,
            resultCategories.Positive2,
            resultCategories.Positive1,
            resultCategories.Detected,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          const resultSignOff = this.getResultSignOff('Smear', payload)
          await Promise.each(smearSamples, async (smearSample, index) => {
            const externalId = `${site.externalId}_${smearSample.externalId}_SMEAR`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .where('assayId', assaySmearId)
                  .andWhere('sampleId', smearSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId: assaySmearId,
              sampleId: smearSample.id,
              reportableSiteId,
              startedOn: smearResultData.dateReleased,
              endedOn: smearResultData.dateReleased,
              resultData: JSON.stringify({
                encodedResult: smearResultData,
                resultSignOff,
              }),
              senderOperator: smearResultData.laboratoryTechnician,
            }
            const resultCategory1Id =
              resultCategoryMappings[smearResultData[`smearResult${index + 1}`]]
            const resultCategory2Id =
              resultCategoryMappings[smearResultData.finalResult]
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              smearResultData,
              resultSignOff,
              smearResultData.dateReleased,
              smearResultData.dateReleased,
              smearResultData.laboratoryTechnician,
              null,
              patientData,
              now,
              resultCategories,
              resultWorkflowStatuses,
              smearResultOverwritePriority
            )
          })
        }

        const geneXpertResultData = {
          center: payload['GX Laboratory Test Performed'],
          mtb: payload.MTB,
          rifampicin: payload['Rifampicin:'],
          remarks: payload['GX Comments'],
          dateReleased: payload['Date and Time of Release of Gx Result'],
          encodedBy: payload['GX Encoded by'],
          examiner: payload['GX Performed by'],
          labManager: payload['GX Validated by'],
          notedBy: payload['GX Noted by'],
        }
        if (
          objectHasValues(
            _.pick(geneXpertResultData, ['mtb', 'rifampicin', 'dateReleased'])
          )
        ) {
          const assayGeneXpertMtbRifId = await assayToId('GxMtbRif')
          const assayGeneXpertMtbRifUltraId = await assayToId('GxMtbRifUltra')

          const externalId = `${site.externalId}_${samples[0].externalId}_GX`
          const resultSignOff = this.getResultSignOff('GeneXpert', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .where('sampleId', samples[0].id)
                .whereIn('assayId', [
                  assayGeneXpertMtbRifId,
                  assayGeneXpertMtbRifUltraId,
                ])
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayGeneXpertMtbRifId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: geneXpertResultData.dateReleased,
            endedOn: geneXpertResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: geneXpertResultData,
              resultSignOff,
            }),
            senderOperator: geneXpertResultData.examiner,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartedOn) {
            result.startedOn = parseDateOrDefault(resultData.testStartedOn)
          }
          if (resultData.testEndedOn) {
            result.endedOn = parseDateOrDefault(resultData.testEndedOn)
          }
          const resultCategory1Id = {
            DETECTED: resultCategories.Detected,
            'NOT DETECTED': resultCategories.NotDetected,
            'NOT DETECTED/ NOT DETECTED': resultCategories.NotDetected,
          }[geneXpertResultData.mtb]
          const resultCategory2Id =
            resultCategory1Id === resultCategories.NotDetected
              ? resultCategories.NotDetected
              : {
                  DETECTED: resultCategories.Detected,
                  'NOT DETECTED': resultCategories.NotDetected,
                  'NOT DETECTED/ NOT DETECTED': resultCategories.NotDetected,
                  'N/A': resultCategories.Missing,
                  INDETERMINATE: resultCategories.Indeterminate,
                  'N/A / N/A': resultCategories.Missing,
                }[geneXpertResultData.rifampicin]
          const resultOverwritePriority = [
            resultCategories.Detected,
            resultCategories.NotDetected,
            resultCategories.Error,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            geneXpertResultData,
            resultSignOff,
            geneXpertResultData.dateReleased,
            geneXpertResultData.dateReleased,
            geneXpertResultData.examiner,
            geneXpertResultData.remarks,
            patientData,
            now,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        const tbLampResultData = {
          tbLampResult: payload['TB LAMP Result'],
        }
        if (objectHasValues(_.pick(tbLampResultData, ['tbLampResult']))) {
          const assayTbLampId = await assayToId('assayTbLamp')
          const resultCategoryMappings = {
            POSITIVE: resultCategories.Positive,
            NEGATIVE: resultCategories.Negative,
            INDETERMINATE: resultCategories.Inconclusive,
          }
          const resultSignOff = this.getResultSignOff('TBLAMP', payload)
          const externalId = `${site.externalId}_${samples[0].externalId}_TB_LAMP`
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .andWhere('assayId', assayTbLampId)
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayTbLampId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: geneXpertResultData.processingDate,
            endedOn: geneXpertResultData.processingDate,
            resultData: JSON.stringify({
              encodedResult: tbLampResultData,
              resultSignOff,
            }),
            senderOperator: geneXpertResultData.examiner,
          }
          const resultCategory1Id =
            resultCategoryMappings[tbLampResultData.tbLampResult]
          const resultOverwritePriority = [
            resultCategories.Positive,
            resultCategories.Negative,
            resultCategories.Inconclusive,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            null,
            tbLampResultData,
            resultSignOff,
            smearResultData.dateReleased || geneXpertResultData.processingDate,
            smearResultData.dateReleased || geneXpertResultData.processingDate,
            tbLampResultData.notedBy,
            null,
            patientData,
            now,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(payload)
        throw e
      }
    })
  }
}

module.exports = { PhilippinesNtrlPmdt, PhilippinesNtrlRitm }
