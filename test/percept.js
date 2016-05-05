const test = require('tape')
const Kefir = require('kefir')
const spatial = require('../src/spatial')

// returns streams
// if command is not known, stream will return `undefined`
// TODO should find all commands at a location
function commands (sp, locName) {

  let streamFromNodeCb = (fn, ...args) =>
      Kefir.fromNodeCallback(cb => fn.apply(this, args.concat(cb)))

  let cmds = [
    { 'look' :  () =>
      streamFromNodeCb(sp.find, locName)
    },
    { 'describe: {description}': o =>
      streamFromNodeCb(sp.describe, locName, o.description)
    },
    {
      "you can '{command}' to {placeName}": o =>
        streamFromNodeCb(sp.link, locName, o.placeName, o.command)
    },
    {
      "you cannot '{command}'": o =>
        streamFromNodeCb(sp.unlink, locName, o.command)
    },
  ]

  let commander = require('text-commander')(cmds)

  // return a fn (input) => that handles null values
   return (i) => {
     let r = commander(i)
     return r ? r : Kefir.constant(undefined)
  }
}

function Percept (inS, sp, loc) {
  let cmdr = commands(sp, loc)
  return inS.flatMap(cmdr)
}

let inputS = Kefir.sequentially(25, [
  'look',
  'describe: a book sits on a pedestal',
  'look',
  'you can fall through the book to a warm island dock',
  'fall through the book',
  'look',
  'describe: the water is warm',
  'look',
  "you can 'jump into the water' to some water",
  "jump into the water",
])

let kv = require('../src/load-kv')()
let space = spatial(kv)
let perceptionS = Percept(inputS, space, 'the library')
perceptionS.log('perceived')
