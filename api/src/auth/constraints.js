const _ = require('lodash')
const { knex } = require('../db')
const { getUser } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

async function getConstraints(credentials) {
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
    .where({
      'ps.userId': user.id,
      'jf.partnerId': user.partnerId,
    })
    .select(
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'jc.siteId',
      'j.jobFunctionId',
      'jf.isAdmin'
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
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where({
      'j.personId': personId,
      'jf.id': jobFunctionId,
    })
    .select(
      'jf.partnerId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      's.id as siteId',
      'j.jobFunctionId',
      'jf.isAdmin'
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
  } else if (context.lgaId != null) {
    constraint.geography = { lgaId: context.lgaId }
  } else if (context.stateId != null) {
    constraint.geography = { stateId: context.stateId }
  } else if (context.countryId != null) {
    constraint.geography = { countryId: context.countryId }
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
  let { partner, geography, site } = aliases
  const {
    device,
    sample,
    person,
    jobFunction,
    allowAdminThrough = false,
  } = aliases

  if (_.isEmpty(constraints)) {
    queryBuilder.whereRaw('0 = 1')
    return
  }

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
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

    if (!geography) {
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
  if (geography && constraints.country) {
    queryBuilder.where({ [`${geography}.countryId`]: constraints.country.id })
  }
  if (person && constraints.person) {
    queryBuilder.where({ [`${person}.personId`]: constraints.person.id })
  }

  // data filter constraints are ORed
  if (constraints.$or && constraints.$or.length) {
    queryBuilder.where(function() {
      for (const constraint of constraints.$or) {
        addConstraintWithJobFunction(
          this,
          geography,
          constraint.geography,
          jobFunction,
          constraint.jobFunction,
          allowAdminThrough
        )
        addConstraintWithJobFunction(
          this,
          site,
          constraint.site,
          jobFunction,
          constraint.jobFunction,
          allowAdminThrough
        )
        addConstraintWithJobFunction(
          this,
          device,
          constraint.device,
          jobFunction,
          constraint.jobFunction,
          allowAdminThrough
        )
        addConstraintWithJobFunction(
          this,
          sample,
          constraint.sample,
          jobFunction,
          constraint.jobFunction,
          allowAdminThrough
        )
        addConstraintWithJobFunction(
          this,
          person,
          constraint.person,
          jobFunction,
          constraint.jobFunction,
          allowAdminThrough
        )
      }
    })
  }
}

function addConstraintWithJobFunction(
  queryBuilder,
  alias,
  subConstraint,
  jobFunctionAlias,
  jobFunctionSubConstraint,
  allowAdminThrough
) {
  if (alias && subConstraint) {
    if (
      jobFunctionAlias &&
      jobFunctionSubConstraint &&
      (!jobFunctionSubConstraint.isAdmin || !allowAdminThrough)
    ) {
      queryBuilder.orWhere(function() {
        this.where(
          _.mapKeys(subConstraint, (v, k) => `${alias}.${k}`)
        ).andWhere(
          _.mapKeys(
            _.omit(jobFunctionSubConstraint, 'isAdmin'),
            (v, k) => `${jobFunctionAlias}.${k}`
          )
        )
      })
    } else {
      queryBuilder.orWhere(_.mapKeys(subConstraint, (v, k) => `${alias}.${k}`))
    }
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
}
