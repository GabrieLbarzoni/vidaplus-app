const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Inicializa o app do Firebase para que as funções possam acessar outros serviços
admin.initializeApp();

const app = express();
// Usa o middleware do CORS para permitir requisições do nosso front-end
app.use(cors({origin: true}));
app.use(express.json());

// Pega a referência do nosso banco de dados Firestore
const db = admin.firestore();

// Importa o criador do middleware de autenticação
const createAuthMiddleware = require("./middleware/authenticate");
// Cria a instância do middleware, passando a dependência 'db'
const authenticate = createAuthMiddleware(db);

// Importa as funções que criam os roteadores
const createUserRoutes = require("./routes/users");
const createPatientRoutes = require("./routes/patients");
const createProfessionalRoutes = require("./routes/professionals");
const createAppointmentRoutes = require("./routes/appointments");

// Monta as rotas, passando as dependências 'db' e 'authenticate'
app.use("/", createUserRoutes(db, authenticate));
app.use("/patients", createPatientRoutes(db, authenticate));
app.use("/professionals", createProfessionalRoutes(db, authenticate));
app.use("/appointments", createAppointmentRoutes(db, authenticate));
 
 
// Expõe o app Express como uma única Cloud Function chamada 'api'
// Atualizado para 2ª Geração, especificando a região para maior clareza.
exports.api = onRequest({region: "us-central1"}, app);