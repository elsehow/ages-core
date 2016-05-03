'use strict'
const spatial        = require('./spatial')
const loadKv         = require('./load-kv')
const streamAndEmitF = require('./stream-and-emitF')
const Kefir          = require('kefir')
const tc             = require('text-commander')

// retruns a stream
function commands (spaces, input) {

  return Kefir.fromNodeCallback(cb => {

    let m = tc([
      {'look': () => {
        spaces.find(currentLoc, cb)
      }},
      {'describe {place}: {name}': ({place, name}) => {
        spaces.describe(place, name, cb)
      }},
      {'you can \'{command}\' to {place}': ({command, place}) => {
        spaces.link(currentLoc, place, command, cb)
      }},
      {'you cannot {command}': ({command}) => {
        spaces.unlink(currentLoc, command, cb)
      }},
    ])(input)
    if (!m)
      cb(null, "Sorry, I don't understand that.")
  })
}

function ages () {
  let [inputS, inputF] = streamAndEmitF()
  let spaces = spatial(loadKv())
  let responseS = (input) => commands(spaces, input)
  let outputS = inputS.flatMap(responseS)
  // HACK set the current location
  let currentLoc = 'a quiet library'
  spaces.describe('a quiet library', 'a book sits on a pedestal', ()=>{})
  return {
    outputS: outputS,
    inputF: inputF,
  }
}

module.exports = ages
