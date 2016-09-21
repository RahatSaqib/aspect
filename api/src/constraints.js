let _ = require('lodash')
let {query} = require('./db')

function getConstraints(credentials){
  return query('Get constraints for user credentials')
    .from('data_filter as f')
    .innerJoin('role as r', 'f.id', 'r.data_filter_id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .where({'ur.user_id': credentials.id})
    .select('f.constraint')
    .map(f => JSON.parse(f.constraint))
    .then(filterConstraints => ({
      // TODO define constraints schema
      country: {
        id: credentials.countryId
      },
      partner: {
        id: credentials.partnerId
      },
      $or: filterConstraints
    }))
}

function addConstraints(queryBuilder, constraints, aliases){
  let {
    country='country',
    state='state',
    lga='lga'
  } = aliases

  // TODO generalize constraint building

  // FIXME add partner constraint
  queryBuilder.where({[`${country}.id`]: constraints.country.id})

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
