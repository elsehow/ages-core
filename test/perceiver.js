const test = require('tape')
const Kefir = require('kefir')
const perceiver = require('../src/perceiver')
const spatial = require('../src/spatial')

test('Single percept outputs the correct objects for given commands', t => {
  let kv = require('../src/load-kv')()
  let space = spatial(kv)
  let inputs = [
    'look',
    'describe: a book sits on a pedestal',
    'look',
    "you can 'fall through the book' to a warm island dock",
    'fall through eth book', // this should error, but recover
    'fall through the book',
    'look',
    "you can 'jump into the water' to some water", // define edges before description
    'describe: the water is warm', // define description after edges
    "jump into the water",
    "you can 'swim far out into the nothing' to the nothing",
  ]
  let expected = [
    { name: 'a quiet library' },
    { name: 'a quiet library',
      description: 'a book sits on a pedestal',
      edges: [] },
    { name: 'a quiet library',
      description: 'a book sits on a pedestal',
      edges: [] },
    { name: 'a quiet library',
      description: 'a book sits on a pedestal',
      edges:
      [ { command: 'fall through the book',
          goesTo: 'a warm island dock' } ] },
    'I didn\'t understand, "fall through eth book."',
    { name: 'a warm island dock' },
    { name: 'a warm island dock' },
    { name: 'a warm island dock',
      edges: [ { command: 'jump into the water', goesTo: 'some water' } ] },
    { name: 'a warm island dock',
      description: 'the water is warm',
      edges: [ { command: 'jump into the water', goesTo: 'some water' } ] },
  ]
  t.plan(inputs.length)
  var i = 0
  let check = (v) => {
    t.deepEqual(v, expected[i], JSON.stringify(v))
    i++
  }
  let inputS = Kefir.sequentially(2, inputs)
  let perceptionS = perceiver(inputS, space, 'a quiet library')
  perceptionS.log()
  //perceptionS.onValue(check)
  //perceptionS.onError(check)
})
