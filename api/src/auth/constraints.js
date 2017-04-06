const _ = require('lodash')
const { getUser } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

function getConstraints(credentials) {
  return getUser(credentials.name).then((user) => {
    // TODO define constraints schema
    const constraints = {
      partner: {
        id: user.partnerId
      },
      country: {
        id: user.countryId
      }
    }

    // FIXME filter by JobContext
    const filterConstraints = []
    if (filterConstraints.length) {
      constraints.$or = filterConstraints
    }

    return constraints
  })
}

function addConstraints(queryBuilder, constraints, aliases) {
  let { site, partner, geography, country, state, lga } = aliases
  const { device, sample } = aliases

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  // ====== device aliases begin ======
  if (device) {
    if (!site) {
      site = alias('Site')
      queryBuilder.leftOuterJoin(`Site as ${site}`, `${device}.siteId`, `${site}.id`)
    }
  }
  // ====== device aliases end ======

  // ====== site aliases begin ======
  if (site) {
    if (!partner) {
      partner = alias('Partner')
      queryBuilder.leftOuterJoin(`Partner as ${partner}`, `${site}.partnerId`, `${partner}.id`)
    }

    if (!geography) {
      geography = alias('Geography')
      queryBuilder.leftOuterJoin(`Geography as ${geography}`, `${site}.geographyId`, `${geography}.id`)
    }
  }
  // ====== site aliases end ======

  // ====== geography aliases begin ======
  if (geography) {
    if (!country) {
      country = alias('Country')
      queryBuilder.leftOuterJoin(`Country as ${country}`, `${geography}.countryId`, `${country}.id`)
    }

    if (!state) {
      state = alias('State')
      queryBuilder.leftOuterJoin(`State as ${state}`, `${geography}.stateId`, `${state}.id`)
    }

    if (!lga) {
      lga = alias('Lga')
      queryBuilder.leftOuterJoin(`Lga as ${lga}`, `${geography}.lgaId`, `${lga}.id`)
    }
  }
  // ====== geography aliases end ======

  // Partner, country, and constraints are ANDed
  if (partner && constraints.partner) {
    queryBuilder.where(function () {
      this.whereNull(`${partner}.id`).orWhere({ [`${partner}.id`]: constraints.partner.id })
    })
  }
  if (country && constraints.country) {
    queryBuilder.where({ [`${country}.id`]: constraints.country.id })
  }

  // data filter constraints are ORed
  if (constraints.$or && constraints.$or.length) {
    queryBuilder.where(function () {
      for (const constraint of constraints.$or) {
        if (state && constraint.state) {
          this.orWhere(_.mapKeys(constraint.state, (v, k) => `${state}.${k}`))
        }

        if (lga && constraint.lga) {
          this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${lga}.${k}`))
        }

        if (site && constraint.site) {
          this.orWhere(_.mapKeys(constraint.site, (v, k) => `${site}.${k}`))
        }

        if (device && constraint.device) {
          this.orWhere(_.mapKeys(constraint.device, (v, k) => `${device}.${k}`))
        }

        if (sample && constraint.sample) {
          this.orWhere(_.mapKeys(constraint.sample, (v, k) => `${sample}.${k}`))
        }
      }
    })
  }
}

module.exports = {
  getConstraints,
  addConstraints
}
