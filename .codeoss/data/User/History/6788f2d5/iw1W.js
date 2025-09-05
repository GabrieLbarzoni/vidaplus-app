module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "new-cap": ["error", {"capIsNewExceptions": ["Router"]}],
    "indent": "off", // Desativa a regra de indentação.
    "max-len": "off", // Desativa a regra de comprimento máximo da linha.
    "eol-last": "off", // Desativa a regra que exige linha em branco no final.
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
