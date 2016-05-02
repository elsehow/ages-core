'use strict'
const spatial = require('./spatial')
const loadKv = require('./load-kv')
const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter
function streamAndEmitF (em, ev) {
  return [
    (x) => em.emit(ev, x),
    Kefir.fromEvents(em, ev)
  ]
}

function printRoomF (outF) {

  function printCommands (edges) {
    if (edges.length){
      return edges.reduce((acc,cur, i) => {
        if (i === edges.length-1)
          return `${acc} *${cur.command}*.`
        return `${acc} *${cur.command}* or`
      }, '\n\nFrom here, you can')
    }
    return ''
  }

  return function (err, res) {
    if (res) {
      let desc = `${res.name}\n\n${res.description}`
      let commands = printCommands(res.edges)
      return outF(desc+commands)
    }
    outF(`There is nothing here. You can "describe ${myCurrentPlace}", if you would like.` )
  }
}

// storage/datastructures
// TODO should get db on disk - pass in opts.path or something
const spaces = spatial(loadKv())
// HACK set current room
const myCurrentPlace = 'a quiet library'

function coreCommands (outF) {
  return [
    {"say {something}": ({something}) => {
      outF(`Elsehow says \"${something}.\"`)
    }},
    {"look": () => {
      spaces.find(myCurrentPlace, printRoomF(outF))
    }},
    {"describe {place}: {description}": ({place, description}) => {
      spaces.describe(place, description, printRoomF(outF))
    }},
    {'you can "{command}" to {place}': ({place, command}) => {
      spaces.link(myCurrentPlace, place, command, printRoomF(outF))
    }},
    {'you cannot "{command}"': ({ command }) => {
      spaces.unlink(myCurrentPlace, command, printRoomF(outF))
    }},
    {":{does}": ({does}) => {
      outF(`Elsehow ${does}`)
    }},
  ]
}

function ages () {

  // inputs/outputs
  let emitter = new EventEmitter()
  let [inputF, inputS] = streamAndEmitF(emitter, 'input')
  let [outputF, outputS] = streamAndEmitF(emitter, 'output')
  let cmdr = require('text-commander')(coreCommands(outputF))

  // TODO we need some way to update the ocmmands when we move to different rooms
  // TODO something that emits on a movement would do the tric
  // TODO or a stream of movements
  // TODO but primarily we need a stream of current movement verbs/commands
  // TODO and this all starts with being ins ome place to begin with; getting that initial fetch that lets us know where we are

  // map
  inputS
    .map(cmdr) // HACK cdmr function is side-effecy
    .filter(x => x==false)
    .map(x => "I didn't understand that, sorry.")
    .onValue(outputF)

  return {
    inputF: inputF,
    outputS: outputS,
  }
}

module.exports = ages
// probably will add a relay server to this framework as well
