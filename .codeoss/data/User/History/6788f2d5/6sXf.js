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
    "max-len": "off", // Desativa a regra de comprimento máximo da linha.// Dentro de initializeApp, no seu app.js
    welcomeContainer.innerHTML = `
        <span class="text-gray-700">Olá,&nbsp;</span>
        <a href="/profile.html" ...>${firstName}</a>
        <span class="text-gray-700">!</span>
    `;
    
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

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "require-jsdoc": 0,
  },
};

