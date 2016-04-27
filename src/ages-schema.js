const every = require('lodash.every')
const isString = require('lodash.isstring')
const sanitizer = require('sanitizer')
/*
  ages-schema
  elsehow

  verifies and sanitizes data structures that
  get written to the hyperlog
  AND data structures that get read off the hyperlog.
  (we never know what some cooky peer might be doing)

  exports a function verify
  which takes a value from a hyperkv

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
  validate
  here's the schema what we want to see:

    name 'string'
    description 'string'
    edges [
      {
        command: 'string',
        goesTo: 'string'
      },
     ...
    ]
,*/

function validate (v) {
  return isString(v.name) &&
    isString(v.description) &&
    ((v.edges &&
       v.edges.length &&
       every(v.edges.map(e => {
         return isString(e.command) && isString(e.goesTo)
       }))) || !v.edges)
}

/*
  TODO sanitize

  no script tags in strings
  no weird escapes with javascript thrown in
  in fact, maybe a limited charset overall, if that makes it easy
    (or hard....)
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


module.exports = verify
