const every = require('lodash.every')
const isString = require('lodash.isstring')
const sanitizer = require('sanitizer')
/*
  ages-schema
  elsehow

  verifies data structures that
  get written to *and from* the hyperlog
  and sanitizes all strings (removing script tags etc)

  the schema for spaces is

  {
    name 'string'
    description 'string'
    edges [{
      command: 'string',
      goesTo: 'string'
    },
    ...
    ]
  }

*/

function validate (v) {
  function edges (es) {
    return ((es &&
      (es.length==0 || es.length>0) &&
      every(es.map(e => {
        return isString(e.command) && isString(e.goesTo)
      }))) || !es)
  }
  // value can have a string name, string description, and edges
  return (isString(v.name) && isString(v.description) && edges(v.edges)) ||
  //  value can have string name, no description, and some edges
    (isString(v.name) && !v.description && v.edges && v.edges.length && edges(v.edges))
}

/*
  sanitize

  no script tags in any object string
  this only gets called if object schema has been validated
,*/

function sanitize (v) {
  v.name = sanitizer.sanitize(v.name)
  v.description = sanitizer.sanitize(v.description)
  if (v.edges) {
    v.edges = v.edges.map(e => {
      e.command = sanitizer.sanitize(e.command)
      e.goesTo = sanitizer.sanitize(e.goesTo)
      return e
    })
  }
  return v
}

/*
  verify

  (1) it returns a value if value passed in is apparently legitimate application state
  otherwise, it returns undefined

  (2) the value it returns is sanitized
  (no funny business with the string values)
  ,*/

function verify (v, cb) {
  if (validate(v))
    return sanitize(v)
  return
}


/*
  space

  produce a space object
  takes a place name (string) and description (string)
  and a list of edges of the form [{ command: 'string', goesTo: 'placeName' }]
  */

function space (n, d, edgesL) {
  if (!edgesL)
    edgesL = []
  var pl = {
    name: n,
    description: d,
    edges: edgesL,
  }
  var valid = verify(pl)
  if (valid)
    return valid
  return
}


module.exports = {
  verify: verify,
  space: space,
}
