const _ = require('lodash')
const { knex } = require('../db')
const { getUser, getUserByUserId, getPersonByPersonId } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

async function getConstraintsByDeviceAPIKey(apiKey) {
  if (apiKey) {
    const {
      partnerId = null,
      countryId = null,
      siteId = null,
      deviceId = null,
    } = await knex('DeviceApiKey as dak')
      .leftOuterJoin('Geography as g', 'dak.geographyId', 'g.id')
      .where({ token: apiKey })
      .first()

    const constraints = _.pickBy(
      {
        partner: {
          id: partnerId,
        },
        country: {
          id: countryId,
        },
        device: {
          id: deviceId,
        },
        site: {
          id: siteId,
        },
      },
      k => k.id // only keep the ones with values
    )
    return constraints
  }
  return Promise.resolve()
}

async function getConstraints(credentials) {
  const user = await getUserFromCredentials(credentials)
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
    result: {
      modify: null,
    },
  }

  const jobContexts = await getContext(user)

  const filterConstraints = jobContexts.map(getJobContextConstraint)
  if (filterConstraints.length) {
    constraints.$or = filterConstraints
    if (!setConstraints(constraints, filterConstraints, 'assay.id', ['assay.id', 'result.assayId'])) {
      if (!setConstraints(constraints, filterConstraints, 'assayType.id', ['assayType.id', 'assay.assayTypeId'])) {
        setConstraints(constraints, filterConstraints, 'disease.id', ['disease.id', 'assayType.diseaseId'])
      }
    }
    setConstraints(constraints, filterConstraints, 'deviceType.id', ['deviceType.id', 'device.deviceTypeId'])
  }

  return constraints
}

async function getUserFromCredentials(credentials) {
  return credentials.name
    ? getUser(credentials.name)
    : credentials.userId
    ? getUserByUserId(credentials.userId)
    : credentials.personId
    ? getPersonByPersonId(credentials.personId)
    : null
}

async function getContext({ userId, partnerId, jobFunctionId }) {
  const filter = {
    'ps.userId': userId,
    'jf.partnerId': partnerId,
    'jf.jobFunctionId': jobFunctionId,
  }

  return knex('JobContext as jc')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'jc.personId', 'ps.id')
    .where(_.omitBy(filter, _.isNil))
    .distinct(
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'jc.siteId',
      'jc.diseaseId',
      'jc.assayTypeId',
      'jc.assayId',
      'jc.deviceTypeId',
      'jc.jobFunctionId',
      knex.raw('0 AS isAdmin')
    )
}

function setConstraints(constraints, filterConstraints, getPath, setPaths) {
  let constraintSet = false
  if (!_.isEmpty(setPaths)) {
    const constraintValues = getFilterConstraintValues(filterConstraints, getPath)
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
  const firstUnsetPropertyConstraint = filterConstraints.find(fc => !_.get(fc, path))
  if (firstUnsetPropertyConstraint) {
    return
  }
  return _.uniq(filterConstraints.filter(fc => !!_.get(fc, path)).map(fc => _.get(fc, path)))
}

async function getJobConstraints(personId, jobFunctionId) {
  const jobContexts = await knex('JobContext as jc')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('Disease as d', 'jc.diseaseId', 'd.id')
    .leftJoin('AssayType as at', 'jc.assayTypeId', 'at.id')
    .leftJoin('Assay as a', 'jc.assayId', 'a.id')
    .leftJoin('DeviceType as dt', 'jc.deviceTypeId', 'dt.id')
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .where({
      'jc.personId': personId,
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
      'jc.jobFunctionId',
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

  // constraint to device type
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

function addPartnerConstraints(queryBuilder, constraints, { result, partner }) {
  const aliases = []
  if (_.get(constraints, 'partner.id')) {
    if (partner) aliases.push(`${partner}.id`)
    if (result) aliases.push(`${result}.partnerId`)

    _.each(aliases, alias =>
      queryBuilder.where(qb => qb.whereNull(`${alias}`).orWhere(`${alias}`, constraints.partner.id))
    )
  }
}

function addAssaysAndDiseaseConstraints(queryBuilder, constraints, aliases) {
  const { result: resultAlias, result_read: resultReadAlias } = aliases
  if (resultAlias) {
    if (_.get(constraints, 'assay.id')) {
      queryBuilder.where(qb => isNullInOrEqual(qb, `${resultAlias}.assayId`, constraints.assay.id))
    }
    if (!aliases.geography) {
      if (!aliases.site) {
        aliases.site = alias('Site')
        queryBuilder.leftOuterJoin(`Site as ${aliases.site}`, `${resultAlias}.siteId`, `${aliases.site}.id`)
      }

      aliases.geography = alias('Geography')
      queryBuilder.leftOuterJoin(
        `Geography as ${aliases.geography}`,
        `${aliases.site}.geographyId`,
        `${aliases.geography}.id`
      )
    }

    if (!resultReadAlias) {
      if ((constraints.disease || constraints.assayType) && !aliases.assay) {
        aliases.assay = alias('Assay')
        queryBuilder.leftOuterJoin(`Assay as ${aliases.assay}`, `${resultAlias}.assayId`, `${aliases.assay}.id`)
      }
      if (constraints.disease && !aliases.assayType) {
        aliases.assayType = alias('AssayType')
        queryBuilder.leftOuterJoin(
          `AssayType as ${aliases.assayType}`,
          `${aliases.assay}.assayTypeId`,
          `${aliases.assayType}.id`
        )
      }
      if (_.get(constraints, 'disease.id')) {
        queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.assayType}.diseaseId`, constraints.disease.id))
      }
      if (_.get(constraints, 'assayType.id')) {
        queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.assay}.assayTypeId`, constraints.assayType.id))
      }
    } else {
      // read model has built-in disease and assay type fields
      if (constraints.disease?.id) {
        queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.resultReadAlias}.disease_id`, constraints.disease.id))
      }
      if (constraints.assayType?.id) {
        queryBuilder.where(qb =>
          isNullInOrEqual(qb, `${aliases.resultReadAlias}.assayType_id`, constraints.assayType.id)
        )
      }
    }
  } else {
    // Queries not involving Result table
    if (aliases.assay && _.get(constraints, 'assayType.id')) {
      queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.assay}.assayTypeId`, constraints.assayType.id))
    }
    if (_.get(constraints, 'disease.id')) {
      if (aliases.assayType) {
        queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.assayType}.diseaseId`, constraints.disease.id))
      } else if (aliases.assay) {
        aliases.assayType = alias('AssayType')
        queryBuilder.leftOuterJoin(
          `AssayType as ${aliases.assayType}`,
          `${aliases.assay}.assayTypeId`,
          `${aliases.assayType}.id`
        )
        queryBuilder.where(qb => isNullInOrEqual(qb, `${aliases.assayType}.diseaseId`, constraints.disease.id))
      }
    }
  }
}

function addGeographyConstraints(queryBuilder, constraints, aliases) {
  const { site, country, result } = aliases
  if (result) {
    if (!aliases.geography) {
      aliases.geography = alias('Geography')
      if (!site) {
        aliases.site = alias('Site')
        queryBuilder.leftOuterJoin(`Site as ${aliases.site}`, `${result}.siteId`, `${aliases.site}.id`)
      }
      queryBuilder.leftOuterJoin(
        `Geography as ${aliases.geography}`,
        `${aliases.site}.geographyId`,
        `${aliases.geography}.id`
      )
    }
  } else {
    if (site && !aliases.geography && !country) {
      aliases.geography = alias('Geography')
      queryBuilder.leftOuterJoin(`Geography as ${aliases.geography}`, `${site}.geographyId`, `${aliases.geography}.id`)
    }

    if (_.get(constraints, 'country.id')) {
      if (country) {
        applyConstraintObjectOnAlias(queryBuilder, country, { id: constraints.country.id })
      } else if (aliases.geography) {
        applyConstraintObjectOnAlias(queryBuilder, aliases.geography, { countryId: constraints.country.id })
      }
    }
  }
}

function addDevicesAndSitesConstraints(queryBuilder, constraints, aliases, options) {
  let filterAlias = null
  const { device, assay, result } = aliases
  const { showUnapprovedDevices = false, showDecommissionedDevices = false } = options
  if (!result) {
    if (!aliases.site && device && !aliases.resultTransferFlag) {
      aliases.site = alias('Site')
      queryBuilder.leftOuterJoin(`Site as ${aliases.site}`, `${device}.siteId`, `${aliases.site}.id`)
    }
    if (aliases.site) {
      if (!aliases.partner) {
        aliases.partner = alias('Partner')
        queryBuilder.leftOuterJoin(
          `Partner as ${aliases.partner}`,
          `${aliases.site}.partnerId`,
          `${aliases.partner}.id`
        )
      }
    }
    if (_.get(constraints, 'deviceType.id')) {
      _.each(_.compact([device, assay]), item =>
        queryBuilder.where(qb => isNullInOrEqual(qb, `${item}.deviceTypeId`, constraints.deviceType.id))
      )
    }
  } else if (!aliases.site) {
    filterAlias = '__Site_filterDisabled'
    queryBuilder.leftOuterJoin(`Site as ${filterAlias}`, `${result}.siteId`, `${filterAlias}.id`)
  }
  if (aliases.site || filterAlias) {
    excludeDisabledSites(queryBuilder, aliases.site || filterAlias)
  }
  if (device) {
    const hideUnapprovedDevices = !showUnapprovedDevices
    const hideDecommissionedDevices = !showDecommissionedDevices
    if (hideUnapprovedDevices || hideDecommissionedDevices) {
      queryBuilder.leftOuterJoin(`DeviceApproval as deviceApproval`, `${device}.deviceApprovalId`, `deviceApproval.id`)

      if (hideDecommissionedDevices /* showUnapprovedDevices may be true or false */) {
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

        queryBuilder.whereRaw(`
            (deviceMaintenanceStatus.externalId is null or deviceMaintenanceStatus.externalId != 'inactiveDecommissioned')
        `)
        /**
         * any deviceApproval except 'decommissioned'
         */
        queryBuilder.whereRaw(`
          (deviceApproval.token is null or deviceApproval.token <> 'decommissioned')
        `)
        if (hideUnapprovedDevices) {
          /**
           * deviceApproval is null or 'approved' only
           */
          queryBuilder.whereRaw(`(deviceApproval.token is null or deviceApproval.token = 'approved')`)
        }
      } else if (hideUnapprovedDevices /* showDecommissionedDevices = true */) {
        /**
         * deviceApproval is null or 'approved' or 'decommissioned' only
         */
        queryBuilder.whereRaw(`(deviceApproval.token is null or deviceApproval.token in ('approved', 'decommissioned')`)
      }
    }
  }
}

function excludeDisabledSites(queryBuilder, alias) {
  queryBuilder.where(disabledSitesQueryBuilder => {
    disabledSitesQueryBuilder.whereNull(`${alias}.id`).orWhere(`${alias}.disabled`, knex.raw('?', 0))
  })
}

function addPersonConstraints(queryBuilder, constraints, { allowAdminThrough = false, person }) {
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
    result: resultAlias,
    sample,
    deviceType,
    issue,
  }
) {
  // data filter constraints are ORed
  if (!_.isEmpty(_.get(constraints, '$or'))) {
    for (const constraint of constraints.$or) {
      if (constraint.disease && assay && !disease && !assayType) {
        assayType = alias('AssayType')
        queryBuilder.leftOuterJoin(`AssayType as ${assayType}`, `${assay}.assayTypeId`, `${assayType}.id`)
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
            alias: issue,
            constraint: constraint.issue,
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

function addResultConstraints(queryBuilder, constraints, aliases, options = {}) {
  if (constraints.result?.modify) {
    constraints.result.modify(queryBuilder, constraints, aliases)
  }

  filterExcludedResults(queryBuilder, aliases, options)
}

function filterExcludedResults(queryBuilder, aliases, options) {
  if (aliases.result && options.displayResult !== 'all') {
    if (!aliases.resultType && !aliases.result_read) {
      aliases.resultType = alias('ResultType')
      queryBuilder.innerJoin(
        `ResultType as ${aliases.resultType}`,
        `${aliases.result}.resultTypeId`,
        `${aliases.resultType}.id`
      )
    }
    const onlyExcluded = options.displayResult === 'excluded'
    if (aliases.result_read) {
      queryBuilder.where({ [`${aliases.result_read}.resultType_excluded`]: onlyExcluded })
    } else {
      queryBuilder.where({ [`${aliases.resultType}.excluded`]: onlyExcluded })
    }
  }
}

/** Add constraints to query a knex query.
 * @param {*} queryBuilder - Knex query builder
 * @param {*} constraints - Constraints to apply, @see getConstraints
 * @param {*} receivedAliases - Aliases used for each table in the query (e.g. { assay: 'a', result: 'r' })
 * @param {Object} options - Options to apply.
 * @param {('actual'|'excluded'|'all')=} options.displayResult - Excluded result filter mode.
 * 'actual': default. only returns non excluded results.
 * 'excluded' only returns excluded results.
 * 'all' return all results.
 */

function addConstraints(
  queryBuilder,
  constraints,
  receivedAliases,
  options = { displayResult: 'actual', showUnapprovedDevices: false, showDecommissionedDevices: false }
) {
  if (_.isEmpty(constraints)) {
    queryBuilder.whereRaw('0 = 1')
    return
  }
  const aliases = _.cloneDeep(receivedAliases)

  // Hook Read models
  if (aliases.result_read) {
    aliases.result = aliases.result_read
  }

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  addPartnerConstraints(queryBuilder, constraints, aliases)

  addAssaysAndDiseaseConstraints(queryBuilder, constraints, aliases)
  addDevicesAndSitesConstraints(queryBuilder, constraints, aliases, options)

  addPersonConstraints(queryBuilder, constraints, aliases)
  addGeographyConstraints(queryBuilder, constraints, aliases)

  addOrConstraints(queryBuilder, constraints, aliases)

  addResultConstraints(queryBuilder, constraints, aliases, options)
  addTransferLogConstraints(queryBuilder, constraints, aliases)
}

function isNullInOrEqual(queryBuilder, columnName, value) {
  return queryBuilder.andWhere(qb => {
    qb.whereNull(columnName)
    if (!_.isNil(value) && !_.isEmpty(value)) {
      qb.orWhere(qb => {
        if (_.isArray(value) && value.length > 1) {
          qb.whereIn(columnName, value)
        } else if (_.isArray(value) && value.length === 1 && !_.isNil(value[0])) {
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
    queryBuilder.andWhere(qb => {
      if (jobFunctionAlias && jobFunctionConstraint && (!jobFunctionConstraint.isAdmin || !allowAdminThrough)) {
        if (!_.isEmpty(constraint)) {
          applyConstraintObjectOnAlias(qb, alias, constraint)
        }
        if (!_.isEmpty(jobFunctionConstraint)) {
          applyConstraintObjectOnAlias(qb, jobFunctionAlias, _.omit(jobFunctionConstraint, 'isAdmin'))
        }
      } else if (!_.isEmpty(constraint)) {
        applyConstraintObjectOnAlias(qb, alias, constraint)
      }
      if (personAlias && personConstraint) {
        if (_.isEmpty(personConstraint)) {
          applyConstraintObjectOnAlias(qb, personAlias, personConstraint)
        }
        if (allowAdminThrough) {
          qb.orWhere(`${jobFunctionAlias}.isAdmin`, true)
        }
      }
    })
  }
}

function applyConstraintObjectOnAlias(queryBuilder, alias, constraint) {
  if (alias && constraint) {
    queryBuilder.where(nullOrEqualQb => {
      _.keys(constraint)
        .filter(k => !!constraint[k])
        .forEach(k => {
          nullOrEqualQb.where(knex.raw(`${alias}.${k} = ?`, [constraint[k]]))
        })
    })
  }
}

// check for user permissions, pass in auth
function canView(auth, flag) {
  return _.some(auth.credentials.permissions, _.unary(_.partialRight(_.includes, flag)))
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
  return _.intersection(auth.credentials.permissions, requirePermissions).length > 0
}

function canEditInventories(auth) {
  return canEdit(auth, 'inventory:')
}

const addPartnerQueryConstraints = (queryBuilder, { partner, country, geography, site, caseAlias }) => {
  if (caseAlias && partner) queryBuilder.where(`${caseAlias}.partnerId`, partner.id)
  if (partner && !caseAlias) queryBuilder.where('r.partnerId', partner.id)
  if (site) queryBuilder.where(`r.partnerId`, partner.id)
  else if (geography) {
    if (geography.lgaId) queryBuilder.where('g.lgaId', geography.lgaId)
    else if (geography.stateId) queryBuilder.where('g.stateId', geography.lgaId)
  } else if (country) queryBuilder.where('c.id', country.id)
}

function addTransferLogConstraints(queryBuilder, constraints, aliases) {
  if (aliases.transferLog) {
    const clinicianSiteIds = constraints.$or.map(constraint => constraint.site?.id).filter(item => !!item)
    if (!_.isEmpty(clinicianSiteIds)) {
      return queryBuilder.where(builder => {
        builder
          .whereIn(`${aliases.transferLog}.previousReportableSiteId`, clinicianSiteIds)
          .orWhereIn(`${aliases.transferLog}.sampleOriginSiteId`, clinicianSiteIds)
      })
    }
  }
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
  getContext,
  getConstraintsByDeviceAPIKey,
  getUserFromCredentials,
}
