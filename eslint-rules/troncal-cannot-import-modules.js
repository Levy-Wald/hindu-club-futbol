'use strict'

const path = require('path')

/**
 * ESLint rule: troncal-cannot-import-modules
 *
 * Prevents lib/troncal/ from importing anything from modules/.
 * The troncal layer must not depend on optional modules.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow lib/troncal/ from importing from modules/',
    },
    schema: [],
    messages: {
      troncalImportsModule:
        'Troncal code (lib/troncal/) must not import from modules/. The troncal layer cannot depend on optional modules.',
    },
  },

  create(context) {
    const filePath = context.getFilename().split(path.sep).join('/')
    if (!filePath.includes('/lib/troncal/')) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string') return

        if (source.startsWith('@/modules/')) {
          context.report({
            node,
            messageId: 'troncalImportsModule',
          })
        }
      },
    }
  },
}
