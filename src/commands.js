const Kefir = require('kefir')
const obj = (k, p) => {let o = {}; o[k] = p; return o}

// returns a fn (String input) -> Kefir Stream
// resulting gstream will contain a single value - a place in the world
// if input is not recongized, resulting stream will have single value `undefined`
function commandS (sp, locName) {

  let streamFromNodeCb = (fn, ...args) =>
      Kefir.fromNodeCallback(cb => fn.apply(this, args.concat(cb)))

  let findPlace = (pl) => streamFromNodeCb(sp.find, pl)

  let genericCommands = [
    { 'look' :  () =>
      findPlace(locName)
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

  let edgeToCommandFn = (e) => obj(e.command, () => findPlace(e.goesTo))
  let placeToCommandFns = (pl) => pl.edges ? pl.edges.map(edgeToCommandFn) : []
  let locationSpecificCommandS = findPlace(locName).map(placeToCommandFns)
  let commandsHereS = locationSpecificCommandS.map(lcs => lcs.concat(genericCommands))

  // return a stream
  return commandsHereS
    .map(require('text-commander'))
    .map(commander => {
      // return a fn (input) => that handles falsey values
      return i => {
        let r = commander(i)
        return r ? r : Kefir.constantError(`I didn\'t understand, "${i}."`)
      }
  })
}

module.exports = commandS
