const _ = require('lodash')
const { knex } = require('../db')
const { getUser, getUserByUserId, getUserByPersonId } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

async function getConstraints(credentials) {
  const user = credentials.name
    ? await getUser(credentials.name)
    : credentials.userId
    ? await getUserByUserId(credentials.userId)
    : credentials.personId
    ? await getUserByPersonId(credentials.personId)
    : null
  if (!user) {
    return Promise.resolve()
  }
  const constraints = {
    partner: {
      id: user.partnerId,
    },
    country: {
      id: user.countryId,
    },
    person: {
      id: user.personId,
    },
  }

  const jobContexts = await knex('JobContext as jc')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({
      'ps.userId': user.id,
      'jf.partnerId': user.partnerId,
    })
    .distinct(
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'jc.siteId',
      'jc.diseaseId',
      'jc.assayTypeId',
      'jc.assayId',
      'jc.deviceTypeId',
      'j.jobFunctionId',
      knex.raw('0 AS isAdmin')
    )

  const filterConstraints = jobContexts.map(getJobContextConstraint)
  if (filterConstraints.length) {
    constraints.$or = filterConstraints
    if (
      !setConstraints(constraints, filterConstraints, 'assay.id', [
        'assay.id',
        'result.assayId',
      ])
    ) {
      if (
        !setConstraints(constraints, filterConstraints, 'assayType.id', [
          'assayType.id',
          'assay.assayTypeId',
        ])
      ) {
        setConstraints(constraints, filterConstraints, 'disease.id', [
          'disease.id',
          'assayType.diseaseId',
        ])
      }
    }
    setConstraints(constraints, filterConstraints, 'deviceType.id', [
      'deviceType.id',
      'device.deviceTypeId',
    ])
  }

  return constraints
}

function setConstraints(constraints, filterConstraints, getPath, setPaths) {
  let constraintSet = false
  if (!_.isEmpty(setPaths)) {
    const constraintValues = getFilterConstraintValues(
      filterConstraints,
      getPath
    )
    if (constraintValues) {
      setPaths.forEach(setPath => {
        if (!_.get(constraints, setPath)) {
          _.set(constraints, setPath, constraintValues)
          constraintSet = true
        }
      })
    }
  }
  return constraintSet
}

function getFilterConstraintValues(filterConstraints, path) {
  const firstUnsetPropertyConstraint = filterConstraints.find(
    fc => !_.get(fc, path)
  )
  if (firstUnsetPropertyConstraint) {
    return
  }
  return _.uniq(
    filterConstraints.filter(fc => !!_.get(fc, path)).map(fc => _.get(fc, path))
  )
}

async function getJobConstraints(personId, jobFunctionId) {
  const jobContexts = await knex('JobContext as jc')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('Disease as d', 'jc.diseaseId', 'd.id')
    .leftJoin('AssayType as at', 'jc.assayTypeId', 'at.id')
    .leftJoin('Assay as a', 'jc.assayId', 'a.id')
    .leftJoin('DeviceType as dt', 'jc.deviceTypeId', 'dt.id')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where({
      'j.personId': personId,
      'jf.id': jobFunctionId,
    })
    .distinct(
      'jf.partnerId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      's.id as siteId',
      'd.id as diseaseId',
      'at.id as assayTypeId',
      'a.id as assayId',
      'dt.id as deviceTypeId',
      'j.jobFunctionId',
      knex.raw('0 AS isAdmin')
    )

  if (jobContexts.length === 0) {
    return null
  }

  const constraints = {
    partner: {
      id: jobContexts[0].partnerId,
    },
  }

  const filterConstraints = jobContexts.map(getJobContextConstraint)
  constraints.$or = filterConstraints
  return constraints
}

function getJobContextConstraint(context) {
  const constraint = {}

  // constrain to most specific site/geography
  // works because all geographies include higher levels
  if (context.siteId != null) {
    constraint.site = { id: context.siteId }
    constraint.result = { reportableSiteId: context.siteId }
  } else if (context.lgaId != null) {
    constraint.geography = { lgaId: context.lgaId }
  } else if (context.stateId != null) {
    constraint.geography = { stateId: context.stateId }
  } else if (context.countryId != null) {
    constraint.geography = { countryId: context.countryId }
  }

  // constrain to assay type/assay
  if (context.assayId != null) {
    constraint.assay = { id: context.assayId }
    constraint.result = {
      ...(constraint.result || {}),
      assayId: context.assayId,
    }
  } else if (context.assayTypeId != null) {
    constraint.assayType = { id: context.assayTypeId }
    constraint.assay = {
      ...(constraint.assay || {}),
      assayTypeId: context.assayTypeId,
    }
  } else if (context.diseaseId != null) {
    constraint.disease = { id: context.diseaseId }
    constraint.assayType = {
      ...(constraint.assayType || {}),
      diseaseId: context.diseaseId,
    }
  }

  // constrain to device type
  if (context.deviceTypeId != null) {
    constraint.deviceType = { id: context.deviceTypeId }
    constraint.device = { deviceTypeId: context.deviceTypeId }
  }

  if (context.jobFunctionId) {
    constraint.jobFunction = {
      id: context.jobFunctionId,
      isAdmin: context.isAdmin,
    }
  }

  return constraint
}

function addPartnerConstraints(
  queryBuilder,
  constraints,
  { result: resultAlias, partner }
) {
  const aliases = []
  if (partner) aliases.push(`${partner}.id`)
  if (resultAlias) aliases.push(`${resultAlias}.partnerId`)
  if (_.get(constraints, 'partner.id')) {
    _.each(aliases, alias =>
      queryBuilder.where(qb =>
        qb.whereNull(`${alias}`).orWhere(`${alias}`, constraints.partner.id)
      )
    )
  }
}

function addAssaysAndDiseaseConstraints(
  queryBuilder,
  constraints,
  { result: resultAlias, assay, assayType }
) {
  if (_.get(constraints, 'assay.id') && !_.isEmpty(resultAlias)) {
    queryBuilder.where(qb =>
      isNullInOrEqual(qb, `${resultAlias}.assayId`, constraints.assay.id)
    )
  }
  if (constraints.disease || constraints.assayType) {
    if (resultAlias && !assay) {
      assay = alias('Assay')
      queryBuilder.leftOuterJoin(
        `Assay as ${assay}`,
        `${resultAlias}.assayId`,
        `${assay}.id`
      )
    }

    if (!assayType) {
      assayType = alias('AssayType')
      queryBuilder.leftOuterJoin(
        `AssayType as ${assayType}`,
        `${assay}.assayTypeId`,
        `${assayType}.id`
      )
    }
  }

  if (_.get(constraints, 'disease.id')) {
    queryBuilder.where(qb =>
      isNullInOrEqual(qb, `${assayType}.diseaseId`, constraints.disease.id)
    )
  }
  if (assay && _.get(constraints, 'assayType.id')) {
    queryBuilder.where(qb =>
      isNullInOrEqual(qb, `${assay}.assayTypeId`, constraints.assayType.id)
    )
  }
}

function addGeographyConstraints(
  queryBuilder,
  constraints,
  { site, partner, geography, country, result: resultAlias }
) {
  if (site) {
    if (!partner) {
      partner = alias('Partner')
      queryBuilder.leftOuterJoin(
        `Partner as ${partner}`,
        `${site}.partnerId`,
        `${partner}.id`
      )
    }
  }
  if (!geography) {
    if (resultAlias) {
      geography = alias('Geography')
      queryBuilder.leftOuterJoin(
        `Geography as ${geography}`,
        `${resultAlias}.geographyId`,
        `${geography}.id`
      )
    } else if (!country && site) {
      geography = alias('Geography')
      queryBuilder.leftOuterJoin(
        `Geography as ${geography}`,
        `${site}.geographyId`,
        `${geography}.id`
      )
    }
  }

  if (_.get(constraints, 'country.id')) {
    if (country) {
      queryBuilder.where(`${country}.id`, constraints.country.id)
    } else if (geography) {
      queryBuilder.where({
        [`${geography}.countryId`]: constraints.country.id,
      })
    }
  }
}

function addDevicesAndSitesConstraints(
  queryBuilder,
  constraints,
  {
    device,
    site,
    assay,
    showUnapprovedDevices = false,
    showDecommissionedDevices = false,
  }
) {
  if (!site) {
    site = alias('Site')
    if (device) {
      queryBuilder.leftOuterJoin(
        `Site as ${site}`,
        `${device}.siteId`,
        `${site}.id`
      )
    }
  }
  if (_.get(constraints, 'deviceType.id')) {
    if (device) {
      queryBuilder.where(qb =>
        isNullInOrEqual(qb, `${device}.deviceTypeId`, constraints.deviceType.id)
      )
    }
    if (assay) {
      queryBuilder.where(qb =>
        isNullInOrEqual(qb, `${assay}.deviceTypeId`, constraints.deviceType.id)
      )
    }
  }
  if (device && !showUnapprovedDevices) {
    queryBuilder.leftOuterJoin(
      `DeviceApproval as deviceApproval`,
      `${device}.deviceApprovalId`,
      `deviceApproval.id`
    )
    queryBuilder.where(qb =>
      qb
        .where({ [`deviceApproval.token`]: 'approved' })
        .orWhere(knex.raw('isnull(`deviceApproval`.`token`)'))
    )
  }
  if (device && !showDecommissionedDevices) {
    // latest maintenance status for device is NOT 'inactiveDecommissioned'
    queryBuilder
      .leftOuterJoin(
        `DeviceMaintenanceStatusLog as deviceMaintenanceStatusLog`,
        `${device}.deviceMaintenanceStatusLogId`,
        `deviceMaintenanceStatusLog.id`
      )
      .leftOuterJoin(
        'DeviceMaintenanceStatus AS deviceMaintenanceStatus',
        'deviceMaintenanceStatusLog.deviceMaintenanceStatusId',
        'deviceMaintenanceStatus.id'
      )
    queryBuilder.where(qb =>
      qb
        .whereNull('deviceMaintenanceStatus.externalId')
        .orWhereNot(
          'deviceMaintenanceStatus.externalId',
          'inactiveDecommissioned'
        )
    )
  }
}

function addPersonConstraints(
  queryBuilder,
  constraints,
  { allowAdminThrough = false, person }
) {
  if (person && constraints.person && !allowAdminThrough) {
    queryBuilder.where({ [`${person}.id`]: constraints.person.id })
  }
}

function addOrConstraints(
  queryBuilder,
  constraints,
  {
    assay,
    disease,
    assayType,
    jobFunction,
    person,
    allowAdminThrough,
    geography,
    site,
    device,
    resultAlias,
    sample,
    deviceType,
  }
) {
  // data filter constraints are ORed
  if (!_.isEmpty(_.get(constraints, '$or'))) {
    for (const constraint of constraints.$or) {
      if (constraint.disease && assay && !disease && !assayType) {
        const assayType = alias('AssayType')
        queryBuilder.leftOuterJoin(
          `AssayType as ${assayType}`,
          `${assay}.assayTypeId`,
          `${assayType}.id`
        )
      }
    }
    const getBaseProps = (queryBuilder, constraint) => ({
      queryBuilder,
      jobFunctionAlias: jobFunction,
      jobFunctionConstraint: constraint.jobFunction,
      personAlias: person,
      personConstraint: constraint.person,
      allowAdminThrough,
    })
    queryBuilder.andWhere(qb => {
      for (const constraint of constraints.$or) {
        qb.orWhere(qb => {
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: geography,
            constraint: constraint.geography,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: site,
            constraint: constraint.site,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: device,
            constraint: constraint.device,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: resultAlias,
            constraint: constraint.result,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: sample,
            constraint: constraint.sample,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: person,
            constraint: constraint.person,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: assayType,
            constraint: constraint.assayType,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: assay,
            constraint: constraint.assay,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: deviceType,
            constraint: constraint.deviceType,
          })
          addConstraintWithJobFunction({
            ...getBaseProps(qb, constraint),
            alias: disease,
            constraint: constraint.disease,
          })
        })
      }
    })
  }
}

function addConstraints(queryBuilder, constraints, aliases) {
  if (_.isEmpty(constraints)) {
    queryBuilder.whereRaw('0 = 1')
    return
  }

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  addPartnerConstraints(queryBuilder, constraints, aliases)
  addAssaysAndDiseaseConstraints(queryBuilder, constraints, aliases)
  addDevicesAndSitesConstraints(queryBuilder, constraints, aliases)
  addPersonConstraints(queryBuilder, constraints, aliases)
  addGeographyConstraints(queryBuilder, constraints, aliases)

  addOrConstraints(queryBuilder, constraints, aliases)
}

function isNullInOrEqual(queryBuilder, columnName, value) {
  return queryBuilder.andWhere(qb => {
    qb.whereNull(columnName)
    if (!_.isNil(value) && !_.isEmpty(value)) {
      qb.orWhere(qb => {
        if (_.isArray(value) && value.length > 1) {
          qb.whereIn(columnName, value)
        } else if (
          _.isArray(value) &&
          value.length === 1 &&
          !_.isNil(value[0])
        ) {
          qb.where(columnName, value[0])
        } else {
          qb.where(columnName, value)
        }
      })
    }
  })
}

function addConstraintWithJobFunction({
  queryBuilder,
  alias,
  constraint,
  jobFunctionAlias,
  jobFunctionConstraint,
  personAlias,
  personConstraint,
  allowAdminThrough = false,
}) {
  if (alias && constraint) {
    queryBuilder.where(qb => {
      Object.keys(constraint).forEach(k => {
        qb.orWhere(qb => qb.whereNull(`${alias}.${k}`))
      })
      qb.orWhere(qb => {
        qb.orWhere(_.mapKeys(constraint, (v, k) => `${alias}.${k}`))
        if (
          jobFunctionAlias &&
          jobFunctionConstraint &&
          (!jobFunctionConstraint.isAdmin || !allowAdminThrough)
        ) {
          qb.andWhere(
            _.mapKeys(
              _.omit(jobFunctionConstraint, 'isAdmin'),
              (v, k) => `${jobFunctionAlias}.${k}`
            )
          )
        }
      })
    })
    queryBuilder.andWhere(qb => {
      if (personAlias && personConstraint) {
        qb.andWhere(
          _.mapKeys(personConstraint, (v, k) => `${personAlias}.${k}`)
        )
        if (allowAdminThrough) {
          qb.orWhere(`${jobFunctionAlias}.isAdmin`, true)
        }
      }
    })
  }
}

// check for user permissions, pass in auth
function canView(auth, flag) {
  return _.some(
    auth.credentials.permissions,
    _.unary(_.partialRight(_.includes, flag))
  )
}

function canViewSites(auth) {
  return canView(auth, 'site:')
}

function canViewDevices(auth) {
  return canView(auth, 'device:')
}

function canViewResults(auth) {
  return canView(auth, 'result:')
}

function canViewInventories(auth) {
  return canView(auth, 'inventory:')
}

function canEdit(auth, flag) {
  const requirePermissions = [`${flag}admin`, `${flag}edit`]
  return (
    _.intersection(auth.credentials.permissions, requirePermissions).length > 0
  )
}

function canEditInventories(auth) {
  return canEdit(auth, 'inventory:')
}

const addPartnerQueryConstraints = (
  queryBuilder,
  { partner, country, geography, site, caseAlias }
) => {
  if (caseAlias && partner)
    queryBuilder.where(`${caseAlias}.partnerId`, partner.id)
  if (partner && !caseAlias) queryBuilder.where('r.partnerId', partner.id)
  if (site) queryBuilder.where('r.siteId', partner.id)
  else if (geography) {
    if (geography.lgaId) queryBuilder.where('g.lgaId', geography.lgaId)
    else if (geography.stateId) queryBuilder.where('g.stateId', geography.lgaId)
  } else if (country) queryBuilder.where('c.id', country.id)
}

module.exports = {
  getConstraints,
  getJobConstraints,
  canView,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
  canEdit,
  canEditInventories,
  addPartnerQueryConstraints,
}
