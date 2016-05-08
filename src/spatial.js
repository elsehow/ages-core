/*

  spatial.js
  elsehow

  a function that takes a hyperkv-like object.
  enforces schema defined in spatial-schema.js.
  executing the function on a hyperkv-like object
  returns an object with methods:

    find(placeName, cb)

      calls back (err, res) on place with name.
      if no such place found, calls back null, undefined

    describe(placeName, placeDescription, cb)

      calls back (err, res) when place is described

    link(placeName1, placeName2, command, cb)

      calls back (err, res) where res is modified placeName1.
      (remember that links are directed - this command modifies
      place1, not place2.) calls back err if trying to link from
      a place that doesn't exist. (linking to a place that doesn't
      exist is fine).

    unlink(placeName1, command, cb)

      removes the link from place1 described by command. calls back
      (err, res) res is the modified place1 - will call back error if
      command doesn't exist in place1, or if place1 doesn't exist.

    createReadStream(opts)

      wraps underlying hyperkv/hyperlog createReadStream(). however,
      it will filter all nodes coming thorugh the log that don't match
      space schema.

*/

'use strict';
const schema = require('./spatial-schema')
const schemaError = new Error('Schema error: space requires name (string) and description (string). See API.')
const through = require('through2')

function firstValid (obj) {
  let m = Object.keys(obj).find(k => {
    let p = obj[k]
    let v = schema.verify(p)
    return v
  })
  return obj[m]
}

// recursively find the first val *that matches the schema*
function wrapGet (cb, pl) {
  return (err, res) => {
    if (err)
      return cb(err, res)
    let v = firstValid(res)
    if (v)
      return cb(err, v)
    return cb(err, { name: pl })
  }
}

function wrapPut (cb) {
  return (err, res) => {
    if (err)
      return cb(err, res)
    return cb(err, res.value.v)
  }
}

// takes a hyperkv-like object `hkv`
function spatial (hkv) {

  function find (pl, cb) {
    hkv.get(pl, wrapGet(cb, pl))
  }

  function describe (pl, desc, cb) {
    find(pl, (err, p) => {
      p.description = desc
      let v = schema.verify(p)
      if (v)
        return hkv.put(pl, p, wrapPut(cb))
      cb(schemaError, null)
    })
  }

  function link (pl1, pl2, cmd, cb) {
    let lnk = {
      command: cmd,
      goesTo: pl2,
    }
    find(pl1, (err, p) => {
      if (err)
        return cb(err, p)
      if (!p.description && !p.edges)
        return cb(new Error(`No such place ${pl1}`))
      if (p.edges)
        p.edges.push(lnk)
      else
        p.edges = [lnk]
      let verified = schema.verify(p)
      if (!verified)
        return cb(schemaError, null)
      return hkv.put(pl1, p, wrapPut(cb))
    })
  }

  function unlink (pl, cmd, cb) {
    let noCmdErr = new Error(`No such command "${cmd}" found at place "${pl}"`)
    find(pl, (err, p) => {
      if (err)
        return cb(err, p)
      if (!p.edges)
        return cb(noCmdErr)
      let filtered = p.edges.filter(e => {
        return e.command !== cmd
      })
      if (filtered.length == p.edges.length)
        return cb(noCmdErr, p)
      p.edges = filtered
      return hkv.put(pl, p, wrapPut(cb))
    })
  }

  function createReadStream (opts) {
    return hkv.createReadStream(opts).pipe(through.obj((chunk, _, next) => {
      let vs = chunk.values
      let v = firstValid(vs)
      if (v)
        return next(null, v)
      next()
    }))
  }

  return {
    find: find,
    describe: describe,
    link: link,
    unlink: unlink,
    createReadStream: createReadStream,
  }
}

module.exports = spatial
