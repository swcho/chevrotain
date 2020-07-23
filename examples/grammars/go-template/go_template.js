"use strict"
/**
 * An Example of implementing a Go Template with Chevrotain.
 */
// const chevrotain = require("chevrotain")

// ts-check
;(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("chevrotain"), require("xregexp"))
  } else {
    // Browser globals (root is window)
    root["grammar"] = factory(root.chevrotain, root.XRegExp)
  }
})(
  this,
  /**
   * @param {typeof import('chevrotain')} [chevrotain] - Somebody's name.
   */
  function goTemplateExample(chevrotain, XRegExp) {
    const { createToken, Lexer, CstParser, EMPTY_ALT } = chevrotain

    // check if inside statement
    function isInStatement(matchedTokens) {
      const matchedTokenTemp = matchedTokens.slice(0)
      for (const token of matchedTokenTemp.reverse()) {
        if (token.tokenType.name === "StatementEnd") {
          return false
        }
        if (token.tokenType.name === "StatementStart") {
          return true
        }
      }
    }

    function matchText(text, startOffset, matchedTokens, groups) {
      // check if inside statement
      if (isInStatement(matchedTokens)) {
        return null
      }

      let endOffset = startOffset
      let char = text[endOffset]
      let charNext = text[endOffset + 1]
      const len = text.length
      // (char === '{' || char === '}') && char === charNext
      while (
        ((char !== "{" && char !== "}") || char !== charNext) &&
        endOffset < len
      ) {
        endOffset++
        char = text[endOffset]
        charNext = text[endOffset + 1]
      }

      // No match, must return null to conform with the RegExp.prototype.exec signature
      if (endOffset === startOffset) {
        return null
      } else {
        let matchedString = text.substring(startOffset, endOffset)
        // according to the RegExp.prototype.exec API the first item in the returned array must be the whole matched string.
        return [matchedString]
      }
    }

    // ----------------- lexer -----------------
    const StatementStart = createToken({
      name: "StatementStart",
      pattern: "{{"
    })
    const Argument = createToken({ name: "Argument", pattern: /"[^\s]*"/ })
    const Identifier = createToken({
      name: "Identifier",
      pattern: /[^\s"\{\}]+/
    })
    // const ParamsDot = createToken({ name: "ParamsDot", pattern: /params\./ })
    const StatementEnd = createToken({ name: "StatementEnd", pattern: "}}" })
    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED
    })
    const Text = createToken({ name: "Text", pattern: matchText })

    const allTokens = [
      Text,
      StatementStart,
      Argument,
      Identifier,
      StatementEnd,
      WhiteSpace
    ]
    const GoTemplateLexer = new Lexer(allTokens)

    StatementStart.LABEL = "'{{'"
    StatementEnd.LABEL = "'}}'"
    // ParamsDot.LABEL = "'params.'";

    // Parser
    class GoTemplateParser extends CstParser {
      constructor() {
        super(allTokens)

        // not mandatory, using $ (or any other sign) to reduce verbosity
        const $ = this

        $.RULE("goTemplate", () => {
          $.MANY(() => {
            $.OR([
              { ALT: () => $.SUBRULE($.Statement) },
              { ALT: () => $.CONSUME(Text) }
            ])
          })
        })

        // $.RULE('Statements', () => {
        //   $.MANY(() => {
        //     $.SUBRULE($.Statement)
        //   })
        // })
        $.RULE("Statement", () => {
          $.CONSUME(StatementStart)
          $.MANY(() => {
            $.SUBRULE($.FunctionCall)
          })
          $.CONSUME(StatementEnd)
        })

        $.RULE("FunctionCall", () => {
          $.CONSUME(Identifier)
          $.MANY(() => {
            $.CONSUME(Argument)
          })
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        this.performSelfAnalysis()
      }
    }

    return {
      lexer: GoTemplateLexer,
      parser: GoTemplateParser
    }
  }
)

// module.exports = goTemplateExample();
