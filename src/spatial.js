'use strict';

const schema = require('./ages-schema')
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
function wrapGet (cb) {
  return (err, res) => {
    if (err)
      return cb(err, res)
    return cb(err, firstValid(res))
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
    hkv.get(pl, wrapGet(cb))
  }

  function describe (pl, desc, cb) {
    let p = schema.space(pl, desc)
    if (p) {
      hkv.put(pl, p, wrapPut(cb))
      return
    }
    cb(schemaError, null)
  }

  function link (pl1, pl2, cmd, cb) {
    let lnk = {
      command: cmd,
      goesTo: pl2,
    }
    find(pl1, (err, p) => {
      if (err)
        return cb(err, p)
      if (!p)
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
    find(pl, (err, p) => {
      if (err)
        return cb(err, p)
      if (!p)
        return cb(new Error(`No such place ${pl}`))
      let filtered = p.edges.filter(e => {
        return e.command !== cmd
      })
      if (filtered.length == p.edges.length)
        return cb(`No such command "${cmd}" found at place "${pl}"`, p)
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
