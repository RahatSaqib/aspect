const _ = require('lodash')
const Boom = require('@hapi/boom')
const { query, knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')

const MODE_INSERT = 'MODE_INSERT'
const MODE_DELETE = 'MODE_DELETE'

async function getJobFunctionsForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const partnersAndJobFunctions = await query('Get partners and job functions for select lists')
    .from('JobFunction as jf')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .orderBy(['p.name', 'jf.name'], 'asc')
    .select(
      'p.id as partnerId',
      'p.name as partnerName',
      'jf.id as jobFunctionId',
      'jf.name as jobFunctionName',
      'jf.externalId as jobFunctionExternalId'
    )

  const partners = _.map(_.uniqBy(partnersAndJobFunctions, 'partnerId'), partnerRecord => ({
    id: partnerRecord.partnerId,
    name: partnerRecord.partnerName,
    jobFunctions: _.orderBy(
      _.map(
        _.filter(partnersAndJobFunctions, {
          partnerId: partnerRecord.partnerId,
        }),
        jobFunctionRecord => ({
          id: jobFunctionRecord.jobFunctionId,
          name: jobFunctionRecord.jobFunctionName,
          externalId: jobFunctionRecord.jobFunctionExternalId,
        })
      ),
      'name'
    ),
  }))

  return {
    ok: true,
    data: partners,
  }
}

// ----------------------------------------------------------------------------------------
// permissions for specified 'person' for this 'partner'
async function getPermissions(request) {
  const {
    params: { personId, partnerId },
  } = request
  const { auth } = request
  const user = await getUser(auth.credentials.name)
  if (user.partnerId !== +partnerId) {
    return Boom.expectationFailed('partnerId does not match user.partnerId')
  }
  //
  const data = await query('Get permissions for person and partner')
    .from('Permission as p')
    .innerJoin('JobFunctionPermission as jfp', 'p.id', 'jfp.permissionId')
    .innerJoin('JobFunction as jf', 'jfp.jobFunctionId', 'jf.id')
    .innerJoin('JobContext as jc', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'jc.personId', 'ps.id')
    .where('jf.partnerId', partnerId)
    .where('ps.id', personId)
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity')
    .then(items => items.map(p => `${p.module}:${p.activity}`))
  //
  return { ok: true, data }
}

// ----------------------------------------------------------------------------------------
async function getJobFunction(jobFunctionId, partnerId, err) {
  const jobFunction = await knex('JobFunction').where({ id: jobFunctionId }).first()

  if (!jobFunction) {
    return Boom.notFound('Requested JobFunction is missing')
  }
  // should be same 'partnerId' in requested jobFunction and current user
  if (jobFunction.partnerId !== partnerId) {
    return Boom.conflict(err)
  }
  return jobFunction
}

// ----------------------------------------------------------------------------------------
const assignJobContext = async request => manageJobContext(request, MODE_INSERT)
const unassignJobContext = async request => manageJobContext(request, MODE_DELETE)
const validateAndNormalizeJobContextData = async request => {
  const { payload } = request
  const { personId, jobFunctionId, geographyId, siteId } = payload

  // personId and jobFunctionId are needed
  const hasPersonAndJobFunction = !!personId && !!jobFunctionId
  if (!hasPersonAndJobFunction) {
    return Boom.expectationFailed('personId and jobFunctionId is needed to manage JobContext')
  }
  // either geographyId or siteId is needed
  const bothMissing = !geographyId && !siteId
  const bothPresent = !!geographyId && !!siteId
  if (bothMissing || bothPresent) {
    return Boom.conflict('Either geographyId or siteId (not both) is needed to manage JobContext')
  }
  // existing siteId
  if (siteId) {
    const item = await knex('Site').where({ id: siteId }).first()
    if (!item) {
      return Boom.badData(`Missing site with specified siteId=${siteId}`)
    }
  }
  // existing geographyId
  if (geographyId) {
    const item = await knex('Geography').where({ id: geographyId }).first()
    if (!item) {
      return Boom.badData(`Missing geography with specified geographyId=${geographyId}`)
    }
  }

  return {}
}
async function manageJobContext(request, mode) {
  const { payload } = request
  const { personId, jobFunctionId, geographyId, siteId } = payload
  const normalizedData = await validateAndNormalizeJobContextData(request)
  if (normalizedData.isBoom) {
    return normalizedData
  }

  const q = knex('JobContext')
    .where({ personId, jobFunctionId })
    .where(function () {
      if (geographyId) {
        this.where({ geographyId })
      } else if (siteId) {
        this.where({ siteId })
      }
    })
  if (mode === MODE_DELETE) {
    // remove JobContext
    await q.clone().del()
  } else if (mode === MODE_INSERT) {
    // create JobContext entry if missing
    const jobContext = await q.clone().first()
    if (!jobContext) {
      await knex('JobContext').insert({ personId, jobFunctionId, geographyId, siteId })
    }
  }
  // return all jobContexts for requested person
  const jobContexts = await knex('JobContext as jc')
    .where({ personId, jobFunctionId })
    .select('jc.geographyId', 'jc.siteId', 'jc.personId', 'jc.jobFunctionId')
  return { ok: true, data: jobContexts }
}

// ----------------------------------------------------------------------------------------
// helper function for JobFunctionDashboardWidget, JobFunctionPermission
// ----------------------------------------------------------------------------------------
async function manageJobFunctionBaseItems(request, tableName, mode, err) {
  const { auth, payload } = request
  const { jobFunctionId } = payload
  const { partnerId } = await getUser(auth.credentials.name)

  // should be same 'partnerId' in requested jobFunction and current user
  const jf = await getJobFunction(jobFunctionId, partnerId, err)
  if (jf.isBoom) {
    return jf
  }

  let fieldName
  let itemsPropName
  switch (tableName) {
    case 'JobFunctionDashboardWidget':
      fieldName = 'widgetId' // foreign key to table DashboardWidget
      itemsPropName = 'widgets' // in request payload
      break
    case 'JobFunctionPermission':
      fieldName = 'permissionId'
      itemsPropName = 'permissions' // in request payload
      break
    default:
      return Boom.badData(`Incorrect tableName "${tableName}"`)
  }

  const items = payload[itemsPropName]

  if (mode === MODE_DELETE) {
    const { all } = payload
    // proceed if requested removing ALL items or array 'items' is defined
    if (all || !_.isEmpty(items)) {
      await knex(tableName)
        .where({ jobFunctionId })
        .where(function () {
          if (!all) {
            this.whereIn(fieldName, items)
          }
        })
        .del()
    }
  } else if (mode === MODE_INSERT) {
    const existingIds = await knex(tableName).where({ jobFunctionId }).select(fieldName)
    //
    const toInsertIds = items.filter(x => !existingIds.includes(x))
    const toDeleteIds = existingIds.filter(x => !items.includes(x))
    //
    if (toDeleteIds.length > 0) {
      await knex(tableName).where({ jobFunctionId }).whereIn(fieldName, toDeleteIds).del()
    }
    if (toInsertIds.length > 0) {
      await knex(tableName).insert(
        toInsertIds.map(fieldValue => ({
          jobFunctionId,
          [fieldName]: fieldValue,
        }))
      )
    }
  }

  // return all items for specified jobFunctionId
  const data = await knex(tableName).where({ jobFunctionId }).select('jobFunctionId', fieldName)
  return { ok: true, data }
}

// ----------------------------------------------------------------------------------------
async function assignJobFunctionDashboardWidgets(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionDashboardWidget',
    MODE_INSERT,
    'Only Admin with same partnerId as JobFunction may assign user to widget'
  )
}

async function unassignJobFunctionDashboardWidgets(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionDashboardWidget',
    MODE_DELETE,
    'Only Admin with same partnerId as JobFunction may unassign user from widget'
  )
}

// ----------------------------------------------------------------------------------------
async function assignJobFunctionPermissions(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionPermission',
    MODE_INSERT,
    'Only Admin with same partnerId as JobFunction may assign permissions to JobFunction'
  )
}

async function unassignJobFunctionPermissions(request) {
  return manageJobFunctionBaseItems(
    request,
    'JobFunctionPermission',
    MODE_DELETE,
    'Only Admin with same partnerId as JobFunction may unassign permissions from JobFunction'
  )
}

// ----------------------------------------------------------------------------------------
async function assignPersonTo(request) {
  const { payload } = request

  const { countryId, personId, jobFunctionId } = payload
  const { auth } = request
  const creator = await validateJobData({ personId, jobFunctionId, auth })
  if (creator.isBoom) {
    return creator
  }
  const geographyIdsInPayload = {
    countryId: countryId ?? null,
    stateId: payload.stateId ?? null,
    lgaId: payload.lgaId ?? null,
    siteId: payload.siteId ?? null,
  }
  if (geographyIdsInPayload.siteId) {
    const siteGeographyIds = await knex('Site as s')
      .leftJoin('Geography as g', 's.geographyId', 'g.id')
      .where('s.id', geographyIdsInPayload.siteId)
      .first('g.countryId', 'g.stateId', 'g.lgaId')
    geographyIdsInPayload.countryId = siteGeographyIds?.countryId ?? payload.countryId
    geographyIdsInPayload.stateId = siteGeographyIds?.stateId ?? payload.stateId
    geographyIdsInPayload.lgaId = siteGeographyIds?.lgaId ?? payload.lgaId
  } else if (geographyIdsInPayload.lgaId) {
    const lgaGeographyIds = await knex('Geography as g')
      .where('g.lgaId', geographyIdsInPayload.lgaId)
      .first('g.countryId', 'g.stateId')
    geographyIdsInPayload.countryId = lgaGeographyIds?.countryId ?? payload.countryId
    geographyIdsInPayload.stateId = lgaGeographyIds?.stateId ?? payload.stateId
  } else if (geographyIdsInPayload.stateId) {
    const stateGeographyIds = await knex('Geography as g')
      .where('g.stateId', geographyIdsInPayload.stateId)
      .first('g.countryId')
    geographyIdsInPayload.countryId = stateGeographyIds?.countryId ?? payload.countryId
  }
  const requiredJobAssignmentBaseQuery = knex('JobContext as jc')
    .join('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .join('JobFunctionPermission as jfp', 'jc.jobFunctionId', 'jfp.jobFunctionId')
    .join('Permission as p', 'jfp.permissionId', 'p.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .where('jc.personId', creator.personId)
    .whereIn('p.module', ['account', 'person'])
    .whereIn('p.activity', ['edit', 'admin'])
  const superAdminJobFunction = await requiredJobAssignmentBaseQuery
    .clone()
    .whereNull('s.id')
    .whereNull('g.lgaId')
    .whereNull('g.stateId')
    .whereNull('g.countryId')
    .first('jf.externalId')
  if (!superAdminJobFunction) {
    if (geographyIdsInPayload.siteId) {
      const siteAdminJobFunction = await requiredJobAssignmentBaseQuery
        .clone()
        .andWhere(qb => {
          qb.where('s.id', geographyIdsInPayload.siteId)
          if (geographyIdsInPayload.lgaId) {
            qb.orWhere(lgaQb => lgaQb.whereNull('s.id').andWhere('g.lgaId', geographyIdsInPayload.lgaId))
          }
          if (geographyIdsInPayload.stateId) {
            qb.orWhere(stateQb =>
              stateQb.whereNull('s.id').whereNull('g.lgaId').andWhere('g.stateId', geographyIdsInPayload.stateId)
            )
          }
          if (geographyIdsInPayload.countryId) {
            qb.orWhere(countryQb =>
              countryQb
                .whereNull('s.id')
                .whereNull('g.lgaId')
                .whereNull('g.stateId')
                .where('g.countryId', geographyIdsInPayload.countryId)
            )
          }
        })
        .first('jf.externalId')
      if (!siteAdminJobFunction) {
        return Boom.forbidden(`Site out of scope for current user's permissions`)
      }
    } else if (geographyIdsInPayload.lgaId) {
      const lgaAdminJobFunction = await requiredJobAssignmentBaseQuery
        .clone()
        .whereNull('s.id')
        .andWhere(qb => {
          qb.where('g.lgaId', geographyIdsInPayload.lgaId)
          if (geographyIdsInPayload.stateId) {
            qb.orWhere(stateQb => stateQb.whereNull('g.lgaId').andWhere('g.stateId', geographyIdsInPayload.stateId))
          }
          if (geographyIdsInPayload.countryId) {
            qb.orWhere(countryQb =>
              countryQb
                .whereNull('g.lgaId')
                .whereNull('g.stateId')
                .andWhere('g.countryId', geographyIdsInPayload.countryId)
            )
          }
        })
        .first('jf.externalId')
      if (!lgaAdminJobFunction) {
        return Boom.forbidden(`LGA out of scope for current user's permissions`)
      }
    } else if (geographyIdsInPayload.stateId) {
      const stateAdminJobFunction = await requiredJobAssignmentBaseQuery
        .clone()
        .whereNull('s.id')
        .whereNull('g.lgaId')
        .andWhere(qb => {
          qb.where('g.stateId', geographyIdsInPayload.stateId)
          if (geographyIdsInPayload.countryId) {
            qb.orWhere(countryQb =>
              countryQb.whereNull('g.stateId').andWhere('g.countryId', geographyIdsInPayload.countryId)
            )
          }
        })
        .first('jf.externalId')
      if (!stateAdminJobFunction) {
        return Boom.forbidden(`State out of scope for current user's permissions`)
      }
    } else if (geographyIdsInPayload.countryId) {
      const countryAdminJobFunction = await requiredJobAssignmentBaseQuery
        .clone()
        .whereNull('s.id')
        .whereNull('g.lgaId')
        .whereNull('g.stateId')
        .andWhere('g.countryId', countryId)
        .first('jf.externalId')
      if (!countryAdminJobFunction) {
        return Boom.forbidden(`Country out of scope for current user's permissions`)
      }
    }
  }
  const {
    stateId = geographyIdsInPayload?.stateId ?? null,
    lgaId = geographyIdsInPayload?.lgaId ?? null,
    siteId = geographyIdsInPayload?.siteId ?? null,
    diseaseId = null,
    assayTypeId = null,
    assayId = null,
    deviceTypeId: deviceTypeExternalId = null,
  } = payload
  let geographyId
  if (!siteId && (countryId || stateId || lgaId)) {
    // ----------------
    // geographyId
    // ----------------
    const geographyProps = { countryId, stateId, lgaId }
    const geography = await knex('Geography').where(geographyProps).first('id')
    if (!geography) {
      ;[geographyId] = await knex('Geography').insert(geographyProps)
    } else {
      geographyId = geography.id
    }
  }

  let deviceTypeId
  if (deviceTypeExternalId) {
    ;({ deviceTypeId } = (await knex('DeviceType')
      .where('externalId', deviceTypeExternalId)
      .first('id as deviceTypeId')) || { deviceTypeId: null })
  }

  // ----------------
  // JobContext
  // ----------------
  // create JobContext entry if missing
  if (siteId || geographyId) {
    const { id: jobContextId } =
      (await knex('JobContext')
        .where({ personId, jobFunctionId })
        .andWhere(function () {
          if (siteId) {
            this.where({ siteId })
          } else if (geographyId) {
            this.where({ geographyId })
          }
        })
        .andWhere(function () {
          if (assayId) {
            this.where({ assayId })
          }
          if (deviceTypeId) {
            this.where({ deviceTypeId })
          }
          if (assayTypeId) {
            this.where({ assayTypeId })
          }
          if (diseaseId) {
            this.where({ diseaseId })
          }
        })
        .first('id')) || {}
    if (!jobContextId) {
      await knex('JobContext').insert({
        personId,
        jobFunctionId,
        geographyId,
        siteId,
        diseaseId,
        deviceTypeId,
        assayTypeId,
        assayId,
      })
    }
  }
  // ----------------
  // return list of person assignments for showing in right side of Person Job Assignment tab
  // ----------------
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------
async function getPersonAssignments(request) {
  const {
    auth,
    params: { personId },
  } = request
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------
async function getAssignments({ auth, personId }) {
  const dataConstraints = await getConstraints(auth.credentials)
  const personAssignments = await knex('JobContext as jc')
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    // constraints to make sure current user can access this data
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    // JobContext with geographyId
    .leftOuterJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    // JobContext with siteId
    .leftOuterJoin('Site as s', 'jc.siteId', 's.id')
    .leftOuterJoin('Geography as g2', 's.geographyId', 'g2.id')
    .leftOuterJoin('Country as c2', 'g2.countryId', 'c2.id')
    .leftOuterJoin('State as st2', 'g2.stateId', 'st2.id')
    .leftOuterJoin('Lga as l2', 'g2.lgaId', 'l2.id')
    // JobContext with diseaseId
    .leftOuterJoin('Disease as d', 'jc.diseaseId', 'd.id')
    // JobContext with assayTypeId
    .leftOuterJoin('AssayType as at', 'jc.assayTypeId', 'at.id')
    .leftOuterJoin('Disease as d2', 'at.diseaseId', 'd2.id')
    // JobContext with deviceTypeId
    .leftOuterJoin('DeviceType as dt', 'jc.deviceTypeId', 'dt.id')
    // JobContext with assayId
    .leftOuterJoin('Assay as a', 'jc.assayId', 'a.id')
    .leftOuterJoin('AssayType as at2', 'a.assayTypeId', 'at2.id')
    .leftOuterJoin('DeviceType as dt2', 'a.deviceTypeId', 'dt2.id')
    .leftOuterJoin('Disease as d3', 'at2.diseaseId', 'd3.id')
    //
    .where('jc.personId', personId)
    .orderBy(['jf.name', 's.name', 'c.name', 'st.name', 'l.name'])
    .select(
      'jc.personId',
      'jf.partnerId',
      'jc.jobFunctionId',
      'jf.name as jobFunctionName',
      'jc.id as jobContextId',
      'jc.siteId',
      'jc.geographyId',
      // JobContext with geographyId
      'c.id as countryId',
      'c.name as countryName',
      'st.id as stateId',
      'st.name as stateName',
      'l.id as lgaId',
      'l.name as lgaName',
      // JobContext with siteId
      's.id as siteId',
      's.name as siteName',
      'c2.id as countryId2',
      'c2.name as countryName2',
      'st2.id as stateId2',
      'st2.name as stateName2',
      'l2.id as lgaId2',
      'l2.name as lgaName2',
      // JobContext with diseaseId
      'd.id as diseaseId',
      'd.i18nKey as diseasei18nKey',
      'd.name as diseaseName',
      // JobContext with assayTypeId
      'at.id as assayTypeId',
      'at.i18nKey as assayTypei18nKey',
      'at.name as assayTypeName',
      'd2.id as diseaseId2',
      'd2.i18nKey as diseasei18nKey2',
      'd2.name as diseaseName2',
      // JobContext with deviceTypeId
      'dt.id as deviceTypeId',
      'dt.name as deviceTypeName',
      // JobContext with assayId
      'a.id as assayId',
      'a.i18nKey as assayi18nKey',
      'a.name as assayName',
      'at2.id as assayTypeId2',
      'at2.i18nKey as assayTypei18nKey2',
      'at2.name as assayTypeName2',
      'dt2.id as deviceTypeId2',
      'dt2.name as deviceTypeName2',
      'd3.id as diseaseId3',
      'd3.i18nKey as diseasei18nKey3',
      'd3.name as diseaseName3'
    )
    .then(items =>
      items.map(item => {
        const { siteId, assayId } = item
        let {
          countryId,
          countryName,
          stateId,
          stateName,
          lgaId,
          lgaName,
          diseaseId,
          diseasei18nKey,
          diseaseName,
          assayTypeId,
          assayTypei18nKey,
          assayTypeName,
          deviceTypeId,
          deviceTypeName,
        } = item

        // if siteId is used by JobContext - then get site's geography props
        if (siteId) {
          ;[
            {
              countryId2: countryId,
              countryName2: countryName,
              stateId2: stateId,
              stateName2: stateName,
              lgaId2: lgaId,
              lgaName2: lgaName,
            },
          ] = [item]
        }
        // if assayTypeId is used by JobContext - then get assay type's disease props
        if (assayTypeId) {
          ;[{ diseaseId2: diseaseId, diseaseName2: diseaseName, diseasei18nKey2: diseasei18nKey }] = [item]
        }
        // if assayId is used by JobContext - then get assay's assay & device type props
        if (assayId) {
          ;[
            {
              assayTypeId2: assayTypeId,
              assayTypei18nKey2: assayTypei18nKey,
              assayTypeName2: assayTypeName,
              deviceTypeId2: deviceTypeId,
              deviceTypeName2: deviceTypeName,
              diseaseId3: diseaseId,
              diseasei18nKey3: diseasei18nKey,
              diseaseName3: diseaseName,
            },
          ] = [item]
        }
        return {
          ..._.pick(item, [
            'personId',
            'partnerId',
            'jobId',
            'jobFunctionId',
            'jobFunctionName',
            'jobContextId',
            'siteId',
            'siteName',
            'geographyId',
            'assayId',
            'assayi18nKey',
            'assayName',
          ]),
          countryId,
          countryName,
          stateId,
          stateName,
          lgaId,
          lgaName,
          diseaseId,
          diseasei18nKey,
          diseaseName,
          assayTypeId,
          assayTypei18nKey,
          assayTypeName,
          deviceTypeId,
          deviceTypeName,
        }
      })
    )
  return personAssignments
}

// ----------------------------------------------------------------------------------------
async function validateJobData({ personId, jobFunctionId, auth }) {
  const creator = await getUser(auth.credentials.name)
  const personAssignments = await getAssignments({ auth, personId: creator.personId })
  const jobFunctionNames = personAssignments.map(item => item.jobFunctionName)
  // should be same 'partnerId' in requested jobFunction and current user
  const err = 'Only Admin with same partnerId as JobFunction can manage Jobs'
  const jf = await getJobFunction(jobFunctionId, creator.partnerId, err)
  if (jf.isBoom) {
    return jf
  }

  const person = await knex('Person as p')
    .leftOuterJoin('Geography as g', 'p.geographyId', 'g.id')
    .where('p.id', personId)
    .first('g.countryId')
  if (!person) {
    return Boom.badData(`Can not find person with id=${personId}`)
  }
  if (!person.countryId) {
    return Boom.badData('Requested person does not have countryId')
  }
  if (person.countryId !== creator.countryId) {
    return Boom.badData(
      `Different countryIds in current Admin user (${creator.countryId}) and requested person ${person.countryId}`
    )
  }
  if (!getRoleLevel(jobFunctionNames, jf.name)) {
    return Boom.badData(`You did not have permission to create this Job.`)
  }

  return creator
}

// ----------------------------------------------------------------------------------------
async function removePersonAssignment(request) {
  const {
    auth,
    params: { personId, jobContextId },
  } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const jobContext = await knex('JobContext as jc')
    // constraints to make sure current user can access this data
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .where('jc.id', jobContextId)
    .first('jc.personId', 'jc.jobFunctionId')
  // validate
  if (!jobContext) {
    return Boom.badData('Incorrect jobContextId specified')
  }
  if (personId !== jobContext.personId) {
    return Boom.badData('Specified personId does not match job personId')
  }
  // check 'person' constraints
  const { jobFunctionId } = jobContext
  const validator = await validateJobData({ personId, jobFunctionId, auth })
  if (validator.isBoom) {
    return validator
  }

  // remove JobContext
  await knex('JobContext').where('id', jobContextId).del()

  // ----------------
  // return list of remaining person assignments
  // ----------------
  const personAssignments = await getAssignments({ auth, personId })
  return { ok: true, data: personAssignments }
}

// ----------------------------------------------------------------------------------------

function getRoleLevel(creatorRoles, personRole) {
  // Object mapping roles to their respective levels
  const roleLevels = {
    'Super Admin': 5,
    SystemOne: 5,
    'Admin - (IT team)': 4,
    'Regional Admin': 4,
    'Regional Officer': 3,
    'Med Tech': 2,
    'Lab User': 2,
    Clinician: 2,
    'Device Maker': 1,
    NTP: 1,
    'NTP - No Results': 1,
    Technician: 1,
    Donor: 1,
    'Result Viewer - No': 1,
    'Result Viewer - Yes': 3,
    'Remote Health Worker': 1,
    'Lab Manager': 2,
    'Lab Head': 3,
    'Lab Supervisor': 3,
    'Lab Technician': 3,
    'Aspect Beta': 1,
    'Inventory Manager': 1,
    'Data Viewer': 1,
  }

  // Initialize highest level to -1 or a value lower than the lowest level
  let highestLevel = -1
  // Iterate through the roles array to find the highest level
  creatorRoles.forEach(role => {
    const level = roleLevels[role] || 0 // Default to 0 if role not found
    if (level > highestLevel) {
      highestLevel = level
    }
  })
  if (highestLevel >= roleLevels[personRole]) {
    return true
  }
  return false
}

module.exports = {
  getJobFunctionsForSelectList,
  getPermissions,
  //
  assignJobContext,
  unassignJobContext,
  assignJobFunctionDashboardWidgets,
  unassignJobFunctionDashboardWidgets,

  assignJobFunctionPermissions,
  unassignJobFunctionPermissions,
  assignPersonTo,
  getPersonAssignments,
  removePersonAssignment,
}
