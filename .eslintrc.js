module.exports = {
  ecmaVersion: 3,
  env: {
    node: true,
    browser: true,
    commonjs: true
  },
  extends: 'eslint:recommended',
  rules: {
    'indent': [2, 2],
    'linebreak-style': [2, 'unix'],
    'quotes': [1, 'single'],
    'semi': [2, 'always']
  }
};
