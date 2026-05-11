'use strict'

const path = require('path')

/**
 * ESLint rule: no-module-importing-from-app
 *
 * Prevents modules/<slug>/ from importing anything from app/.
 * The direction is always app → modules, never modules → app.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow modules/ from importing from app/',
    },
    schema: [],
    messages: {
      moduleImportsApp:
        'Module code (modules/{{slug}}/) must not import from app/. Move shared code to lib/ or the module itself.',
    },
  },

  create(context) {
    const filePath = context.getFilename().split(path.sep).join('/')
    const match = filePath.match(/\/modules\/([^/]+)\//)
    if (!match) return {}

    const slug = match[1]

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string') return

        if (source.startsWith('@/app/') || source.startsWith('@/app\\')) {
          context.report({
            node,
            messageId: 'moduleImportsApp',
            data: { slug },
          })
        }
      },
    }
  },
}
