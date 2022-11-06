module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'rules': {
    'object-curly-spacing': ['error', 'always'],
    'require-jsdoc': ['error', {
      'require': {
          'FunctionDeclaration': false,
          'MethodDefinition': false,
          'ClassDeclaration': false,
          'ArrowFunctionExpression': false,
          'FunctionExpression': false,
      },
    }],
    'max-len': ['error', { 'code': 120 }],
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': false,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'single', 'multiple']
    }]
  },
};
