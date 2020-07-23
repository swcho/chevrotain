"use strict"

const path = require("path")
const fs = require("fs")
const assert = require("assert")
const { lexer, parser } = require("./go_template")

describe("The CSV Grammar", () => {
  const sampleGoTemplate = "prefix{{ params.TEST }}trail"
  // const sampleGoTemplate = '{{ }}{{}}';
  // const sampleGoTemplate = '{{ branch }}-{{ date }}-{{ commitID7 "test" }}'
  // const sampleGoTemplate = '{{ }}';

  it("simple", () => {
    // 1. Tokenize the input.
    const lex = lexer.tokenize(sampleGoTemplate)
    for (const token of lex.tokens) {
      console.log(`${token.tokenType.name}: ${token.image}`)
    }
    const p = new parser([])
    p.input = lex.tokens
    const ast = p.goTemplate()
    console.log(ast)
    if (p.errors.length) {
      console.log(p.errors[0].message)
    }
  })
})
