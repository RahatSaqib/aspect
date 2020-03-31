const _ = require('lodash')
const { knex } = require('../db')
const { getUser } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

async function getConstraints(credentials, forModule = null) {
  const user = await getUser(credentials.name)
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
    .modify(queryBuilder => {
      if (forModule) {
        queryBuilder
          .leftJoin(
            'JobFunctionPermission as jfp',
            'j.jobFunctionId',
            'jfp.jobFunctionId'
          )
          .leftJoin('Permission as pModuleAdmin', function() {
            this.on('jfp.permissionId', 'pModuleAdmin.id')
              .andOn('pModuleAdmin.activity', knex.raw("'admin'"))
              .andOn('pModuleAdmin.module', knex.raw(`'${forModule}'`))
          })
      }
      queryBuilder.where({
        'ps.userId': user.id,
        'jf.partnerId': user.partnerId,
      })
    })
    .distinct(
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'jc.siteId',
      'jc.assayTypeId',
      'jc.assayId',
      'jc.deviceTypeId',
      'j.jobFunctionId',
      forModule
        ? knex.raw(
            'CASE WHEN pModuleAdmin.id IS NULL THEN 0 ELSE 1 END AS isAdmin'
          )
        : knex.raw('0 AS isAdmin')
    )

  const filterConstraints = jobContexts.map(getJobContextConstraint)
  if (filterConstraints.length) {
    constraints.$or = filterConstraints
  }

  return constraints
}

async function getJobConstraints(personId, jobFunctionId, forModule = null) {
  const jobContexts = await knex('JobContext as jc')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('AssayType as at', 'jc.assayTypeId', 'at.id')
    .leftJoin('Assay as a', 'jc.assayId', 'a.id')
    .leftJoin('DeviceType as dt', 'jc.deviceTypeId', 'dt.id')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .modify(queryBuilder => {
      if (forModule) {
        queryBuilder
          .leftJoin(
            'JobFunctionPermission as jfp',
            'j.jobFunctionId',
            'jfp.jobFunctionId'
          )
          .leftJoin('Permission as pModuleAdmin', function() {
            this.on('jfp.permissionId', 'pModuleAdmin.id')
              .andOn('pModuleAdmin.activity', knex.raw("'admin'"))
              .andOn('pModuleAdmin.module', knex.raw(`'${forModule}'`))
          })
      }
      queryBuilder.where({
        'j.personId': personId,
        'jf.id': jobFunctionId,
      })
    })
    .distinct(
      'jf.partnerId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      's.id as siteId',
      'at.id as assayTypeId',
      'a.id as assayId',
      'dt.id as deviceTypeId',
      'j.jobFunctionId',
      forModule
        ? knex.raw(
            'CASE WHEN pModuleAdmin.id IS NULL THEN 0 ELSE 1 END AS isAdmin'
          )
        : knex.raw('0 AS isAdmin')
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
  let { assay, geography, partner, site } = aliases
  const {
    allowAdminThrough = false,
    assayType,
    country,
    device,
    deviceType,
    jobFunction,
    person,
    sample,
    showUnapprovedDevices = false,
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
      queryBuilder.where(function() {
        this.whereNull(`${resultAlias}.partnerId`).orWhere(
          `${resultAlias}.partnerId`,
          constraints.partner.id
        )
      })
    }
    if (constraints.assay) {
      queryBuilder.where(function() {
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
      queryBuilder.where(function() {
        this.whereNull(`${resultAlias}.partnerId`).orWhere({
          [`${resultAlias}.partnerId`]: constraints.partner.id,
        })
      })
    }
    if (constraints.result) {
      queryBuilder.where(function() {
        this.whereNull(`${resultAlias}.partnerId`).orWhere({
          [`${resultAlias}.partnerId`]: constraints.partner.id,
        })
      })
    }
    if ((constraints.assayType || constraints.deviceType) && !assay) {
      assay = alias('Assay')
      queryBuilder.leftOuterJoin(
        `Assay as ${assay}`,
        `${resultAlias}.assayId`,
        `${geography}.id`
      )
    }
    if (constraints.assayType) {
      queryBuilder.where(function() {
        this.whereNull(`${assay}.assayTypeId`).orWhere({
          [`${assay}.assayTypeId`]: constraints.assayType.id,
        })
      })
    }
    if (constraints.deviceType) {
      queryBuilder.where(function() {
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
      queryBuilder.where(function() {
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
      queryBuilder.where(function() {
        this.whereNull(`${device}.deviceTypeId`).orWhere({
          [`${device}.deviceTypeId`]: constraints.deviceType.id,
        })
      })
    }
    if (assay && constraints.assayType) {
      queryBuilder.where(function() {
        this.whereNull(`${assay}.assayTypeId`).orWhere({
          [`${assay}.assayTypeId`]: constraints.assayType.id,
        })
      })
    }
    if (assay && constraints.deviceType) {
      queryBuilder.where(function() {
        this.whereNull(`${assay}.deviceTypeId`).orWhere({
          [`${assay}.deviceTypeId`]: constraints.deviceType.id,
        })
      })
    }
  }
  if (device && !showUnapprovedDevices) {
    queryBuilder.leftOuterJoin(
      `DeviceStatus as deviceStatus`,
      `${device}.deviceStatusId`,
      `deviceStatus.id`
    )
    queryBuilder.where({ [`deviceStatus.token`]: 'approved' })
  }
  if (person && constraints.person && !allowAdminThrough) {
    queryBuilder.where({ [`${person}.personId`]: constraints.person.id })
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
    queryBuilder.where(function() {
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
    queryBuilder.orWhere(function() {
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

module.exports = {
  getConstraints,
  getJobConstraints,
  addConstraints,
  canView,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
  canEdit,
  canEditInventories,
}
