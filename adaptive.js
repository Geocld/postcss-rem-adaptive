const PX_REG = /\b(\d+(\.\d+)?)px\b/
const PX_GLOBAL_REG = new RegExp(PX_REG.source, 'g')

module.exports = class Adaptive {
  constructor (options) {
    const defaultConfig = {
      baseDpr: 2,                 // base device pixel ratio (default: 2)
      remUnit: 75,                // rem unit value (default: 75)
      remPrecision: 6,            // rem value precision (default: 6)
      hairlineClass: 'hairlines', // class name of 1px border (default: 'hairlines')
      autoRem: false              // whether to transform to rem unit (default: false)
    }
    this.config = Object.assign({}, defaultConfig, options)
  }

  parse (code) {
    const astObj = code
    this._processNodes(astObj.nodes)
    return astObj
  }

  _processNodes (nodes, noDealHairline = false) { // FIXME: keyframes do not support `hairline`
    const { hairlineClass, autoRem } = this.config

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const nodeType = node.type

      if (nodeType === 'media' || nodeType === 'supports') {
        this._processNodes(node.nodes) // recursive invocation while dealing with media queries
        continue
      }
      else if (nodeType === 'keyframes') {
        this._processNodes(node.keyframes, true) // recursive invocation while dealing with keyframes
        continue
      }
      else if (nodeType !== 'rule' && nodeType !== 'keyframe') {
        continue
      }

      // generate a new rule which has `hairline` class
      let newNode = {}
      if (!noDealHairline) {
        newNode = {
          type: nodeType,
          selector:`.${hairlineClass} ${node.selector}`,
          nodes: []
        }
      }

      const declarations = node.nodes
      for (let j = 0; j < declarations.length; j++) {
        const declaration = declarations[j]

        // need transform: declaration && has 'px'
        if (declaration.type === 'decl' && PX_REG.test(declaration.value)) {
          const nextDeclaration = declarations[j + 1]
          const originDeclarationValue = declaration.value
          let mode

          if (nextDeclaration && nextDeclaration.type === 'comment') {
            mode = nextDeclaration.text.trim()
            if (['rem', 'px', 'no'].indexOf(mode) !== -1) {
              if (mode !== 'no') {
                declaration.value = this._getCalcValue(mode, declaration.value)
                declarations.splice(j + 1, 1) // delete corresponding comment
              }
              else {
                declarations.splice(j + 1, 1) // delete corresponding comment
                continue // do not generate `hairline` when there exist `no`
              }
            }
            else {
              mode = autoRem ? 'rem' : 'px'
              declaration.value = this._getCalcValue(mode, declaration.value)
            }
          }
          else {
            mode = autoRem ? 'rem' : 'px'
            declaration.value = this._getCalcValue(mode, declaration.value)
          }

          // generate a new rule of `hairline`
          if (!noDealHairline && this._needHairline(originDeclarationValue)) {
            const newDeclaration = Object.assign({}, declaration)
            newDeclaration.value = this._getCalcValue('px', originDeclarationValue, true)
            newNode.nodes.push(newDeclaration)
          }
        }
      }

      // add the new rule of `hairline` to stylesheet
      if (!noDealHairline && newNode.nodes.length) {
        nodes.splice(i + 1, 0, newNode)
        i++ // skip the newly added rule
      }
    }
  }

  _getCalcValue (type, value, isHairline = false) {
    const { baseDpr, remUnit, remPrecision } = this.config

    function getValue (val, curType = type) {
      val = parseFloat(val.toFixed(remPrecision)) // control decimal precision of the calculated value
      return val === 0 ? val : val + curType
    }

    return value.replace(PX_GLOBAL_REG, ($0, $1) => {
      $1 = Number($1)
      return $1 === 0 ? 0 :
        type === 'rem' && $1 / baseDpr > 0.5 ? getValue($1 / remUnit) :
        !isHairline && $1 / baseDpr < 1 ? getValue($1, 'px') :
        getValue($1 / baseDpr > 0.5 ? $1 / baseDpr : 0.5, 'px')
    })
  }

  _needHairline (value) {
    const { baseDpr } = this.config
    const match = value.match(PX_GLOBAL_REG)

    /* istanbul ignore else */
    if (match) {
      return match.some((pxVal) => {
        const num = pxVal.match(PX_REG)[1] / baseDpr
        return num > 0 && num < 1
      })
    }

    /* istanbul ignore next */
    return false
  }
}