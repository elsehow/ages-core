'use strict';
const verify = require('../src/spatial-schema').verify
const space = require('../src/spatial-schema').space
const test = require('tape')

function goodPlaceObj () {
  return {
    name: 'a quiet library',
    description: 'there is a book on a pedestal',
    edges: [
      {
        command: 'fall through the book',
        goesTo: 'a warm island dock'
      }
    ]
  }
}


test('should catch everything that can go wrong with object schema (not counting bad edgs)', t => {
  // a list of some bad place objects
  // this should include everything that can go wrong,
  // NOT including bad stuff in the edges object itself
  [
    {
      name: 52,
      description: 'a quiet island dock',
      edges: [],
    },
    {
      name:  'a quiet island dock',
      description: 53,
      edges: [],
    },
    {
      name: 'a quiet island dock'
    },
    {
      description: 'a quiet island dock'
    },
    {
      edges: [],
    },
    {},
    [],
    'some string',
    52,
  ].forEach(p => {
    t.notOk(verify(p))
  })
  t.end()
})

test('should accept good place objects', t => {
  let good = goodPlaceObj()
  t.ok(verify(good), 'accepts good place object')
  let lazy = {}
  lazy.name = good.name
  lazy.description = good.description
  t.ok(verify(lazy), 'doesnt mind if edges list is missing')
  let lazy2 = {}
  lazy2.name = good.name
  lazy2.edges = good.edges
  t.ok(verify(lazy2), 'doesnt mind if description is missing (just name+edges)')
  t.end()
})

test('should sanitize bad strings', t=> {
  function scriptify (str) {
    return str + '<script>alert("lol!")</script>'
  }
  // test name
  function unsanitize (getter) {
    let bad =  goodPlaceObj()
    let prop = getter(bad)
    prop = scriptify(getter(bad))
    let san = verify(bad)
    t.deepEqual(getter(san), getter(goodPlaceObj()))
  }
  unsanitize(o => o.name)
  unsanitize(o => o.description)
  unsanitize(o => o.edges[0].command)
  unsanitize(o => o.edges[0].goesTo)
  t.end()
})


test('can use space() fn to make a new, valid space object', t => {
  t.notOk(space(), 'not enough args')
  t.notOk(space('not enough args'), 'not enough args')
  t.notOk(space(52, 33), 'args are wrong type')
  let n = 'a quiet island dock'
  let d = 'a book sits on a pedestal'
  let sp = space(n, d)
  t.ok(sp)
  t.deepEqual(sp.name, n)
  t.deepEqual(sp.description, d)
  t.end()
})
