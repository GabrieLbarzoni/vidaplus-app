module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020, // Permite a análise de recursos modernos do ECMAScript
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "require-jsdoc": "off",
    "max-len": "off", // Desativa a regra de comprimento máximo da linha
    "eol-last": "off", // Desativa a regra de nova linha no final do arquivo
    "new-cap": ["error", {"capIsNewExceptions": ["Router"]}], // Permite express.Router()
  },
};
