import { memo, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { expressionLatex } from '../mathEngine'

export const MathExpression = memo(function MathExpression({ expression }: { expression: string }) {
  const html = useMemo(() => katex.renderToString(expressionLatex(expression), {
    throwOnError: false, trust: false, strict: 'warn',
  }), [expression])
  return <span className="math-expression" data-expression={expression} dangerouslySetInnerHTML={{ __html: html }} />
})
