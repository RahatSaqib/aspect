let _ = require('lodash')
let {query, knex} = require('../db')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table){
  return `${ALIAS_PREFIX}_${table}`
}

function getConstraints(credentials){
  // FIXME only include roles that assign permissions of interest
  let dataFilters = query('Get constraints for user credentials')
    .from('DataFilter as f')
    .innerJoin('Role as r', 'f.id', 'r.dataFilterId')
    .innerJoin('UserRole as ur', 'r.id', 'ur.roleId')
    .where({
      'ur.userId': credentials.id,
      'r.partnerId': credentials.partnerId
    })
    .select('f.constraint')
    .map(f => JSON.parse(f.constraint))

  let topOrgUnit = query('Get top org unit for user credentials')
    .from('OrgUnit as o')
    .innerJoin('Role as r', 'o.id', 'r.orgUnitId')
    .innerJoin('UserRole as ur', 'r.id', 'ur.roleId')
    .where({
      'ur.userId': credentials.id,
      'r.partnerId': credentials.partnerId
    })
    .orderBy('o.depth')
    .first('o.id')

  return Promise.all([dataFilters, topOrgUnit])
    .then(([filterConstraints, orgUnit]) => {
      // TODO define constraints schema
      let constraints =  {
        partner: {
          id: credentials.partnerId
        },
        country: {
          id: credentials.countryId
        }
      }

      if(orgUnit){
        constraints.orgUnit = {
          id: orgUnit.id
        }
      }

      if(filterConstraints.length){
        constraints.$or = filterConstraints
      }

      return constraints
    })
}

function addConstraints(queryBuilder, constraints, aliases){
  let {device, site, partner, orgUnit, country, state, lga} = aliases

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  if(!site){
    if(!device){
      throw new Error('Must provide either site or device alias or modify this to accept provided aliases')
    }
    site = alias('site')
    queryBuilder.leftOuterJoin(`Site as ${site}`, `${device}.siteId`, `${site}.id`)
  }

  if(!partner){
    partner = alias('Partner')
    queryBuilder.leftOuterJoin(`Partner as ${partner}`, `${site}.partnerId`, `${partner}.id`)
  }

  if(!orgUnit){
    orgUnit = alias('OrgUnit')
    queryBuilder.leftOuterJoin(`OrgUnit as ${orgUnit}`, `${site}.orgUnitId`, `${orgUnit}.id`)
  }

  if(!country){
    country = alias('Country')
    queryBuilder.leftOuterJoin(`Country as ${country}`, `${site}.countryId`, `${country}.id`)
  }

  if(!state){
    state = alias('State')
    queryBuilder.leftOuterJoin(`State as ${state}`, `${site}.stateId`, `${state}.id`)
  }

  if(!lga){
    lga = alias('Lga')
    queryBuilder.leftOuterJoin(`Lga as ${lga}`, `${site}.lgaId`, `${lga}.id`)
  }

  // Partner, country, and org unit constraints are ANDed
  queryBuilder.where({[`${partner}.id`]: constraints.partner.id})
  queryBuilder.where({[`${country}.id`]: constraints.country.id})

  if(constraints.orgUnit){
    // find all org units below topmost granted org unit
    // TODO likely makes sense to move nested set hierarchy queries to it's own helper function
    let orgUnitSubOne = alias('OrgUnitSub1')
    let orgUnitSubTwo = alias('OrgUnitSub2')
    let orgUnitSubquery = query('Select OrgUnit hierachy for constraints')
      .from(`OrgUnit as ${orgUnitSubOne}`)
      .innerJoin(`OrgUnit as ${orgUnitSubTwo}`,
        knex.raw(`${orgUnitSubTwo}.leftBound BETWEEN ${orgUnitSubOne}.leftBound AND ${orgUnitSubOne}.rightBound`))
      .where({
        [`${orgUnitSubOne}.id`]: constraints.orgUnit.id,
        [`${orgUnitSubTwo}.partnerId`]: constraints.partner.id
      }).select(`${orgUnitSubTwo}.id`)
    queryBuilder.whereIn(`${orgUnit}.id`, orgUnitSubquery)
  }

  // data filter constraints are ORed
  if(constraints.$or && constraints.$or.length){
    queryBuilder.where(function(){
      for(let constraint of constraints.$or){
        if(constraint.state){
          this.orWhere(_.mapKeys(constraint.state, (v, k) => `${state}.${k}`))
        }

        if(constraint.lga){
          this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${lga}.${k}`))
        }
      }
    })
  }
}

module.exports = {
  getConstraints,
  addConstraints
}
