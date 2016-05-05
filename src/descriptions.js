'use strict'
function space (sp) {

  function commands (s) {
    if (s.edges && s.edges.length) {
      let commands = s.edges.map((e, i) => {
        let cmd = e.command
        if (i == s.edges.length-1)
          return `*${cmd}*.`
        return `*${cmd}*, \nor `
      })
      return '\n\nFrom here, you can ' +
        commands
    }
    return ''
  }

  function existingSpace (s) {
    return s.name + '\n' + s.description + commands(s)
  }

  if (sp)
    return existingSpace(sp)
  return 'There is nothing here. You can describe it, if you like.'

}

module.exports = {
  space: space,
}
