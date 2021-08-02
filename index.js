const postcss = require('postcss')
const Adaptive = require('./adaptive')

module.exports = (options) => {
  return {
    postcssPlugin: 'postcss-adaptive',
    Once(css, { result }) {
      const adaptiveIns = new Adaptive(options)
      const output = adaptiveIns.parse(css.toJSON())
      result.root = postcss.fromJSON(output)
    }
  }
}
module.exports.postcss = true