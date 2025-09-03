    const functions = require("firebase-functions");
    const admin = require("firebase-admin");
    const express = require("express");
    const cors = require("cors");

    // Inicializa o app do Firebase para que as funções possam acessar outros serviços
    admin.initializeApp();

    const app = express();
    // Usa o middleware do CORS para permitir requisições do nosso front-end
    app.use(cors({ origin: true }));
    app.use(express.json());

    // Pega a referência do nosso banco de dados Firestore
    const db = admin.firestore();

    // ======================================================
    // ROTAS DA API COM FIRESTORE
    // ======================================================

    // Rota para buscar todos os pacientes
    app.get("/api/patients", async (req, res) => {
        try {
            const snapshot = await db.collection("patients").get();
            const patients = [];
            snapshot.forEach((doc) => {
                patients.push({ id: doc.id, ...doc.data() });
            });
            res.status(200).json(patients);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // Rota para cadastrar um novo paciente
    app.post("/api/patients", async (req, res) => {
        try {
            const { name, cpf } = req.body;
            // Validação simples de CPF duplicado
            const snapshot = await db.collection("patients").where("cpf", "==", cpf).get();
            if (!snapshot.empty) {
                return res.status(400).json({ message: "CPF já cadastrado." });
            }
            const newPatientRef = await db.collection("patients").add({ name, cpf });
            res.status(201).json({ id: newPatientRef.id, name, cpf });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // Rota para buscar todos os profissionais (dados estáticos por enquanto)
     app.get("/api/professionals", (req, res) => {
        const professionals = [
            { id: 1, name: 'Dr. Carlos Andrade', specialty: 'Cardiologista' },
            { id: 2, name: 'Dra. Ana Beatriz', specialty: 'Dermatologista' },
            { id: 3, name: 'Dr. João Pedro', specialty: 'Ortopedista' },
        ];
        res.status(200).json(professionals);
    });

    // Rota para agendar uma nova consulta
    app.post("/api/appointments", async (req, res) => {
        try {
            const { patientId, professionalId, date } = req.body;
            const newAppointment = {
                patientId,
                professionalId: parseInt(professionalId), // Convertendo para número
                date,
            };
            const newAppointmentRef = await db.collection("appointments").add(newAppointment);
            res.status(201).json({ id: newAppointmentRef.id, ...newAppointment });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });
    
    // Rota para buscar todas as consultas
    app.get("/api/appointments", async (req, res) => {
        try {
            const appointmentsSnapshot = await db.collection("appointments").get();
            const appointments = [];
            appointmentsSnapshot.forEach(doc => {
                appointments.push({ id: doc.id, ...doc.data() });
            });
            // Em um app real, faríamos um "join" aqui para buscar os nomes
            res.status(200).json(appointments);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });


    // Expõe o app Express como uma única Cloud Function chamada 'api'
    exports.api = functions.https.onRequest(app);
    ```

---

### **Passo 5: Construindo o Front-end**

Agora vamos criar a interface, que ficará na pasta `public`.

1.  Dentro da pasta `public`, substitua o `index.html` existente pelo nosso código.
2.  Crie um arquivo `app.js` dentro da pasta `public`.
3.  O `index.html` e `app.js` são quase idênticos aos da versão anterior. A única diferença é que **não sabemos a URL da API ainda**, então deixaremos um espaço reservado.

    * Copie o conteúdo do `index.html` e do `app.js` do guia anterior para os respectivos arquivos dentro da pasta `public`.
    * No arquivo `public/app.js`, deixe a URL da API assim por enquanto:
        ```javascript
        const API_URL = 'URL_DA_SUA_API_AQUI'; // Vamos preencher isso no último passo!
        ```

---

### **Passo 6: Deploy - Publicando a Aplicação!**

Com tudo pronto na IDE online, vamos colocar a aplicação no ar com um único comando.

1.  No terminal do Cloud Shell, na raiz do seu projeto (`sghss-app`), execute:
    ```bash
    firebase deploy
    ```
2.  O Firebase fará a "mágica":
    * Ele irá empacotar e enviar o código da pasta `functions` para a nuvem, criando sua API.
    * Ele irá enviar os arquivos da pasta `public` para o Firebase Hosting.
3.  Ao final do processo, o terminal mostrará duas URLs importantes:
    * **Hosting URL:** O endereço do seu site (front-end). Ex: `https://sghss-vidaplus.web.app`
    * **Function URL:** O endereço da sua API (back-end). Ex: `https://us-central1-sghss-vidaplus.cloudfunctions.net/api`

---

### **Passo 7: Conexão Final**

Agora, o último ajuste para fazer tudo funcionar junto.

1.  Copie a **Function URL** que o terminal forneceu.
2.  Volte para a sua IDE online e abra o arquivo `public/app.js`.
3.  Substitua o `URL_DA_SUA_API_AQUI` pela sua Function URL. A linha deve ficar assim:
    ```javascript
    const API_URL = '[https://us-central1-sghss-vidaplus.cloudfunctions.net/api](https://us-central1-sghss-vidaplus.cloudfunctions.net/api)';
    ```
4.  Salve o arquivo e rode o comando de deploy **apenas mais uma vez** para publicar a alteração final no front-end:
    ```bash
    firebase deploy --only hosting