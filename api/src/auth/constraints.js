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
  }

  return constraints
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
    constraint.assay = {
      ...(constraint.assay || {}),
      deviceTypeId: context.deviceTypeId,
    }
  }

  if (context.jobFunctionId) {
    constraint.jobFunction = {
      id: context.jobFunctionId,
      isAdmin: context.isAdmin,
    }
  }

  return constraint
}

function addConstraints(queryBuilder, constraints, aliases) {
  let { assay, assayType, geography, partner, site } = aliases
  const {
    allowAdminThrough = false,
    disease,
    country,
    device,
    deviceType,
    jobFunction,
    person,
    sample,
    showUnapprovedDevices = false,
    showDecommissionedDevices = false,
    result: resultAlias,
  } = aliases

  if (_.isEmpty(constraints)) {
    queryBuilder.whereRaw('0 = 1')
    return
  }

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  if (resultAlias) {
    if (constraints.partner) {
      queryBuilder.where(function () {
        this.whereNull(`${resultAlias}.partnerId`).orWhere(
          `${resultAlias}.partnerId`,
          constraints.partner.id
        )
      })
    }

    if (constraints.assay) {
      queryBuilder.where(function () {
        this.whereNull(`${resultAlias}.assayId`).orWhere(
          `${resultAlias}.assayId`,
          constraints.assay.id
        )
      })
    }
    if (!geography) {
      geography = alias('Geography')
      queryBuilder.leftOuterJoin(
        `Geography as ${geography}`,
        `${resultAlias}.geographyId`,
        `${geography}.id`
      )
    }
    if (partner && constraints.partner) {
      queryBuilder.where(function () {
        this.whereNull(`${resultAlias}.partnerId`).orWhere({
          [`${resultAlias}.partnerId`]: constraints.partner.id,
        })
      })
    }
    if (constraints.result) {
      queryBuilder.where(function () {
        this.whereNull(`${resultAlias}.partnerId`).orWhere({
          [`${resultAlias}.partnerId`]: constraints.partner.id,
        })
      })
    }
    if (
      (constraints.disease ||
        constraints.assayType ||
        constraints.deviceType) &&
      !assay
    ) {
      assay = alias('Assay')
      queryBuilder.leftOuterJoin(
        `Assay as ${assay}`,
        `${resultAlias}.assayId`,
        `${assay}.id`
      )
    }
    if (constraints.disease && !assayType) {
      assayType = alias('AssayType')
      queryBuilder.leftOuterJoin(
        `AssayType as ${assayType}`,
        `${assay}.assayTypeId`,
        `${assayType}.id`
      )
    }
    if (constraints.disease) {
      queryBuilder.where(function () {
        this.whereNull(`${assayType}.diseaseId`).orWhere({
          [`${assayType}.diseaseId`]: constraints.disease.id,
        })
      })
    }
    if (constraints.assayType) {
      queryBuilder.where(function () {
        this.whereNull(`${assay}.assayTypeId`).orWhere({
          [`${assay}.assayTypeId`]: constraints.assayType.id,
        })
      })
    }
    if (constraints.deviceType) {
      queryBuilder.where(function () {
        this.whereNull(`${assay}.deviceTypeId`).orWhere({
          [`${assay}.deviceTypeId`]: constraints.deviceType.id,
        })
      })
    }
  } else {
    if (device && !site) {
      site = alias('Site')
      queryBuilder.leftOuterJoin(
        `Site as ${site}`,
        `${device}.siteId`,
        `${site}.id`
      )
    }

    if (site) {
      if (!partner) {
        partner = alias('Partner')
        queryBuilder.leftOuterJoin(
          `Partner as ${partner}`,
          `${site}.partnerId`,
          `${partner}.id`
        )
      }

      if (!geography && !country) {
        geography = alias('Geography')
        queryBuilder.leftOuterJoin(
          `Geography as ${geography}`,
          `${site}.geographyId`,
          `${geography}.id`
        )
      }
    }
    // Partner, country, and constraints are ANDed
    if (partner && constraints.partner) {
      queryBuilder.where(function () {
        this.whereNull(`${partner}.id`).orWhere({
          [`${partner}.id`]: constraints.partner.id,
        })
      })
    }

    if (country && constraints.country) {
      queryBuilder.where(`${country}.id`, constraints.country.id)
    } else if (geography && constraints.country) {
      queryBuilder.where({
        [`${geography}.countryId`]: constraints.country.id,
      })
    }
    if (device && constraints.deviceType) {
      queryBuilder.where(function () {
        this.whereNull(`${device}.deviceTypeId`).orWhere({
          [`${device}.deviceTypeId`]: constraints.deviceType.id,
        })
      })
    }
    if (assay && constraints.assayType) {
      queryBuilder.where(function () {
        this.whereNull(`${assay}.assayTypeId`).orWhere({
          [`${assay}.assayTypeId`]: constraints.assayType.id,
        })
      })
    }
    if (assay && constraints.deviceType) {
      queryBuilder.where(function () {
        this.whereNull(`${assay}.deviceTypeId`).orWhere({
          [`${assay}.deviceTypeId`]: constraints.deviceType.id,
        })
      })
    }
    if (constraints.disease) {
      if (assayType) {
        queryBuilder.where(function () {
          this.whereNull(`${assayType}.diseaseId`).orWhere({
            [`${assayType}.diseaseId`]: constraints.disease.id,
          })
        })
      } else if (assay) {
        assayType = alias('AssayType')
        queryBuilder.leftOuterJoin(
          `AssayType as ${assayType}`,
          `${assay}.assayTypeId`,
          `${assayType}.id`
        )
        queryBuilder.where(function () {
          this.whereNull(`${assayType}.diseaseId`).orWhere({
            [`${assayType}.diseaseId`]: constraints.disease.id,
          })
        })
      }
    }
  }
  if (device) {
    const forceApproved = !showUnapprovedDevices
    const forceNonDecommissioned = !showDecommissionedDevices
    if (forceApproved || forceNonDecommissioned) {
      queryBuilder.leftOuterJoin(
        `DeviceApproval as deviceApproval`,
        `${device}.deviceApprovalId`,
        `deviceApproval.id`
      )
      queryBuilder.where(function () {
        this.whereNull(`deviceApproval.token`)
          .orWhere(function () {
            if (forceApproved) {
              this.where(`deviceApproval.token`, 'approved')
            }
          })
          .orWhere(function () {
            if (forceNonDecommissioned) {
              this.whereNot(`deviceApproval.token`, 'decommissioned')
            }
          })
      })
    }
  }
  if (person && constraints.person && !allowAdminThrough) {
    queryBuilder.where({ [`${person}.id`]: constraints.person.id })
  }

  // data filter constraints are ORed
  if (!_.isEmpty(_.get(constraints, '$or'))) {
    const getBaseProps = (queryBuilder, constraint) => ({
      queryBuilder,
      jobFunctionAlias: jobFunction,
      jobFunctionConstraint: constraint.jobFunction,
      personAlias: person,
      personConstraint: constraint.person,
      allowAdminThrough,
    })
    for (const constraint of constraints.$or) {
      if (constraint.disease && assay && !disease && !assayType) {
        assayType = alias('AssayType')
        this.leftOuterJoin(
          `AssayType as ${assayType}`,
          `${assay}.assayTypeId`,
          `${assayType}.id`
        )
      }
    }
    queryBuilder.where(function () {
      for (const constraint of constraints.$or) {
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: geography,
          constraint: constraint.geography,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: site,
          constraint: constraint.site,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: device,
          constraint: constraint.device,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: resultAlias,
          constraint: constraint.result,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: sample,
          constraint: constraint.sample,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: person,
          constraint: constraint.person,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: assayType,
          constraint: constraint.assayType,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: assay,
          constraint: constraint.assay,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: deviceType,
          constraint: constraint.deviceType,
        })
        addConstraintWithJobFunction({
          ...getBaseProps(this, constraint),
          alias: disease,
          constraint: constraint.disease,
        })
      }
    })
  }
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
    queryBuilder.orWhere(function () {
      if (
        jobFunctionAlias &&
        jobFunctionConstraint &&
        (!jobFunctionConstraint.isAdmin || !allowAdminThrough)
      ) {
        this.where(_.mapKeys(constraint, (v, k) => `${alias}.${k}`)).andWhere(
          _.mapKeys(
            _.omit(jobFunctionConstraint, 'isAdmin'),
            (v, k) => `${jobFunctionAlias}.${k}`
          )
        )
      } else {
        this.where(_.mapKeys(constraint, (v, k) => `${alias}.${k}`))
      }
      if (personAlias && personConstraint) {
        this.andWhere(
          _.mapKeys(personConstraint, (v, k) => `${personAlias}.${k}`)
        )
        if (allowAdminThrough) {
          this.orWhere(`${jobFunctionAlias}.isAdmin`, true)
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
