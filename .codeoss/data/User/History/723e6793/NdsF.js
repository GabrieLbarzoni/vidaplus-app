    const functions = require("firebase-functions");
    const admin = require("firebase-admin");
    const express = require("express");
    const cors = require("cors");

    // Inicializa o app do Firebase para que as funções possam acessar outros serviços
    admin.initializeApp();

    const app = express();
    // Usa o middleware do CORS para permitir requisições do nosso front-end
    app.use(cors({origin: true}));
    app.use(express.json());

    // Middleware de autenticação
    const authenticate = async (req, res, next) => {
        if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            return res.status(403).json({message: "Unauthorized: No token provided."});
        }
        const idToken = req.headers.authorization.split("Bearer ")[1];
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedIdToken; // uid, email, etc.

            // Busca o perfil do usuário para obter o role e profileId
            const uid = decodedIdToken.uid;
            let userProfile = null;

            const patientDoc = await db.collection("patients").where("userId", "==", uid).limit(1).get();
            if (!patientDoc.empty) {
                userProfile = {role: "patient", profileId: patientDoc.docs[0].id};
            } else {
                const professionalDoc = await db.collection("professionals").where("userId", "==", uid).limit(1).get();
                if (!professionalDoc.empty) {
                    userProfile = {role: "professional", profileId: professionalDoc.docs[0].id};
                }
            }
            req.user.profile = userProfile; // Anexa os dados do perfil a req.user

            next();
        } catch (error) {
            console.error("Error while verifying Firebase ID token:", error);
            res.status(403).json({message: "Unauthorized: Invalid token."});
        }
    };


    // Pega a referência do nosso banco de dados Firestore
    const db = admin.firestore();

    // ======================================================
    // ROTAS DA API COM FIRESTORE
    // ======================================================

    // Rota para verificar o status do perfil do usuário
    app.get("/user/status", authenticate, async (req, res) => {
        try {
            const uid = req.user.uid;
            const patientDoc = await db.collection("patients").where("userId", "==", uid).limit(1).get();
            if (!patientDoc.empty) {
                const profile = patientDoc.docs[0];
                const profileData = profile.data();
                return res.status(200).json({
                    hasProfile: true,
                    role: "patient",
                    profileId: profile.id,
                    name: profileData.name,
                });
            }
            const professionalDoc = await db.collection("professionals").where("userId", "==", uid).limit(1).get();
            if (!professionalDoc.empty) {
                const profile = professionalDoc.docs[0];
                const profileData = profile.data();
                return res.status(200).json({
                    hasProfile: true,
                    role: "professional",
                    profileId: profile.id,
                    name: profileData.name,
                });
            }
            return res.status(200).json({hasProfile: false});
        } catch (error) {
            console.error("Erro ao verificar status do usuário:", error);
            res.status(500).json({message: error.message});
        }
    });

    // Rota para buscar todos os pacientes
    // Protegida: Apenas usuários logados podem ver os pacientes
    app.get("/patients", authenticate, async (req, res) => {
        try {
            const snapshot = await db.collection("patients").get();
            const patients = [];
            snapshot.forEach((doc) => {
                patients.push({id: doc.id, ...doc.data()});
            });
            res.status(200).json(patients);
        } catch (error) {
            console.error("Erro ao buscar pacientes:", error);
            res.status(500).json({message: error.message});
        }
    });

    // Rota para CADASTRAR o perfil de um novo paciente (primeiro acesso)
    app.post("/patients", authenticate, async (req, res) => {
        try {
            const {name, cpf, celular, dataNascimento} = req.body;
            const uid = req.user.uid;

            // Verifica se já existe um perfil para este usuário
            const patientDoc = await db.collection("patients").where("userId", "==", uid).get();
            const profDoc = await db.collection("professionals").where("userId", "==", uid).get();
            if (!patientDoc.empty || !profDoc.empty) {
                return res.status(400).json({message: "Usuário já possui um perfil."});
            }

            // Validação simples de CPF duplicado
            const snapshot = await db.collection("patients").where("cpf", "==", cpf).get();
            if (!snapshot.empty) {
                return res.status(400).json({message: "CPF já cadastrado."});
            }
            const newPatientData = {name, cpf, celular, dataNascimento, userId: uid};
            const newPatientRef = await db.collection("patients").add(newPatientData);
            res.status(201).json({id: newPatientRef.id, ...newPatientData});
        } catch (error) {
            console.error("Erro ao cadastrar paciente:", error); // Adicionado console.error
            res.status(500).json({message: error.message});
        }
    });

    // Rota para CADASTRAR o perfil de um novo profissional (primeiro acesso)
    app.post("/professionals", authenticate, async (req, res) => {
        try {
            const {name, cpf, celular, especialidade} = req.body;
            const uid = req.user.uid;

            // Verifica se já existe um perfil para este usuário
            const patientDoc = await db.collection("patients").where("userId", "==", uid).get();
            const profDoc = await db.collection("professionals").where("userId", "==", uid).get();
            if (!patientDoc.empty || !profDoc.empty) {
                return res.status(400).json({message: "Usuário já possui um perfil."});
            }

            const snapshot = await db.collection("professionals").where("cpf", "==", cpf).get();
            if (!snapshot.empty) {
                return res.status(400).json({message: "CPF já cadastrado."});
            }

            const newProfessionalData = {name, cpf, celular, specialty: especialidade, userId: uid};
            const newProfessionalRef = await db.collection("professionals").add(newProfessionalData);
            res.status(201).json({id: newProfessionalRef.id, ...newProfessionalData});
        } catch (error) {
            console.error("Erro ao cadastrar profissional:", error); // Adicionado console.error
            res.status(500).json({message: error.message});
        }
    });

    // Rota para buscar todos os profissionais (agora do Firestore)
    app.get("/professionals", authenticate, async (req, res) => {
        try {
            const snapshot = await db.collection("professionals").get();
            const professionals = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            res.status(200).json(professionals);
        } catch (error) {
            console.error("Erro ao buscar profissionais:", error); // Adicionado console.error
            res.status(500).json({message: error.message});
        }
    });

    // Rota para agendar uma nova consulta
    app.post("/appointments", authenticate, async (req, res) => {
        try {
            const {patientId, professionalId, date} = req.body;
            const newAppointment = {
                patientId,
                professionalId, // ID do profissional agora é uma string do Firestore
                date,
            };
            const newAppointmentRef = await db.collection("appointments").add(newAppointment);
            res.status(201).json({id: newAppointmentRef.id, ...newAppointment});
        } catch (error) {
            console.error("Erro ao agendar consulta:", error);
            res.status(500).json({message: error.message});
        }
    });

    // Rota para buscar todas as consultas (com join de pacientes e profissionais)
    app.get("/appointments", authenticate, async (req, res) => {
        try {
            let query = db.collection("appointments");
            const userProfile = req.user.profile; // Obtém o perfil do usuário autenticado

            if (userProfile) {
                if (userProfile.role === "patient") {
                    // Se for paciente, filtra as consultas pelo ID do perfil do paciente
                    query = query.where("patientId", "==", userProfile.profileId);
                } else if (userProfile.role === "professional") {
                    // Se for profissional, filtra as consultas pelo ID do perfil do profissional
                    query = query.where("professionalId", "==", userProfile.profileId);
                }
            }
            // Se não for paciente (ex: profissional, admin), a query busca todas as consultas.

            const appointmentsSnapshot = await query.get();
            const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

            if (appointmentsData.length === 0) {
                return res.status(200).json([]);
            }

            // Pega todos os IDs de pacientes únicos das consultas
            const patientIds = [...new Set(appointmentsData.map((app) => app.patientId))];
            const professionalIds = [...new Set(appointmentsData.map((app) => app.professionalId))];

            // Busca os dados dos pacientes de uma só vez
            const patientsSnapshot = patientIds.length ? await db.collection("patients").where(admin.firestore.FieldPath.documentId(), "in", patientIds).get() : {docs: []};
            const patientsMap = new Map();
            patientsSnapshot.forEach((doc) => {
                patientsMap.set(doc.id, doc.data());
            });

            // Busca os dados dos profissionais de uma só vez
            const professionalsSnapshot = professionalIds.length ? await db.collection("professionals").where(admin.firestore.FieldPath.documentId(), "in", professionalIds).get() : {docs: []};
            const professionalsMap = new Map();
            professionalsSnapshot.forEach((doc) => {
                professionalsMap.set(doc.id, doc.data());
            });

            // Adiciona os nomes aos dados da consulta
            const populatedAppointments = appointmentsData.map((app) => {
                const patient = patientsMap.get(app.patientId);
                const professional = professionalsMap.get(app.professionalId);
                return {
                    ...app,
                    patientName: patient ? patient.name : "Paciente não encontrado",
                    professionalName: professional ? professional.name : "Profissional não encontrado",
                };
            });

            // Ordena as consultas pela data mais próxima após buscá-las
            populatedAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

            res.status(200).json(populatedAppointments);
        } catch (error) {
            console.error("Erro ao buscar consultas:", error);
            res.status(500).json({message: error.message});
        }
    });

    // Rota para cancelar/excluir uma consulta
    app.delete("/appointments/:id", authenticate, async (req, res) => {
        try {
            const {id} = req.params;
            const appointmentRef = db.collection("appointments").doc(id);
            const doc = await appointmentRef.get();

            if (!doc.exists) {
                return res.status(404).json({message: "Consulta não encontrada."});
            }

            const appointmentData = doc.data();
            // Verifica se o profileId do usuário autenticado corresponde ao patientId da consulta
            // Ou se o usuário tem um papel de 'admin' (se implementado)
            if (req.user.profile && appointmentData.patientId !== req.user.profile.profileId) {
                 return res.status(403).json({message: "Você não tem permissão para cancelar esta consulta."});
            }

            await appointmentRef.delete();

            res.status(200).json({message: "Consulta cancelada com sucesso."});
        } catch (error) {
            console.error("Erro ao cancelar consulta:", error);
            res.status(500).json({message: "Erro interno ao cancelar a consulta."}); // Alterado para resposta JSON
        }
    });

    // Rota para popular o banco de dados com dados de teste (seeding)
    // IMPORTANTE: Esta rota deve ser removida ou fortemente protegida em produção!
    app.post("/seed-database", async (req, res) => {
        // Uma chave secreta simples para evitar execução acidental.
        const {secret} = req.body;
        if (secret !== "VIDAPLUS_SEED_SECRET") {
            return res.status(403).json({message: "Acesso não autorizado."});
        }

        try {
            const password = "password123";
            const logins = [];

            // --- 1. Criar Profissionais ---
            const professionalsData = [
                {name: "Dr. Ricardo Gomes", cpf: "11122233301", celular: "11911111111", specialty: "Cardiologia", email: "ricardo.gomes@vidaplus.com"},
                {name: "Dra. Helena Costa", cpf: "11122233302", celular: "11922222222", specialty: "Psicologia", email: "helena.costa@vidaplus.com"},
                {name: "Dr. Bruno Martins", cpf: "11122233303", celular: "11933333333", specialty: "Nutrição", email: "bruno.martins@vidaplus.com"},
                {name: "Dra. Lúcia Ferreira", cpf: "11122233304", celular: "11944444444", specialty: "Fisioterapia", email: "lucia.ferreira@vidaplus.com"},
                {name: "Dr. Pedro Almeida", cpf: "11122233305", celular: "11955555555", specialty: "Clínica Geral", email: "pedro.almeida@vidaplus.com"},
            ];

            const professionalAuthUsers = await Promise.all(
                professionalsData.map((prof) => admin.auth().createUser({email: prof.email, password: password})),
            );
            logins.push(...professionalsData.map((p) => ({email: p.email, password, role: "professional"})));

            const professionalProfilePromises = professionalAuthUsers.map((user, index) => {
                const data = professionalsData[index];
                return db.collection("professionals").add({
                    name: data.name,
                    cpf: data.cpf,
                    celular: data.celular,
                    specialty: data.specialty,
                    userId: user.uid,
                });
            });
            const professionalRefs = await Promise.all(professionalProfilePromises);
            const professionalIds = professionalRefs.map((ref) => ref.id);

            // --- 2. Criar Pacientes ---
            const patientsData = [
                {name: "Ana Silva", cpf: "22233344401", celular: "21911111111", dataNascimento: "1990-05-15", email: "ana.silva@vidaplus.com"},
                {name: "Beatriz Santos", cpf: "22233344402", celular: "21922222222", dataNascimento: "1985-11-20", email: "beatriz.santos@vidaplus.com"},
                {name: "Carlos Pereira", cpf: "22233344403", celular: "21933333333", dataNascimento: "1992-01-30", email: "carlos.pereira@vidaplus.com"},
                {name: "Daniel Oliveira", cpf: "22233344404", celular: "21944444444", dataNascimento: "2000-07-22", email: "daniel.oliveira@vidaplus.com"},
                {name: "Eduarda Lima", cpf: "22233344405", celular: "21955555555", dataNascimento: "1998-03-12", email: "eduarda.lima@vidaplus.com"},
                {name: "Fábio Souza", cpf: "22233344406", celular: "21966666666", dataNascimento: "1978-09-05", email: "fabio.souza@vidaplus.com"},
                {name: "Gabriela Rocha", cpf: "22233344407", celular: "21977777777", dataNascimento: "1995-02-18", email: "gabriela.rocha@vidaplus.com"},
                {name: "Hugo Azevedo", cpf: "22233344408", celular: "21988888888", dataNascimento: "1988-12-01", email: "hugo.azevedo@vidaplus.com"},
                {name: "Isabela Nunes", cpf: "22233344409", celular: "21999999999", dataNascimento: "1993-06-25", email: "isabela.nunes@vidaplus.com"},
                {name: "Jorge Mendes", cpf: "22233344410", celular: "21910101010", dataNascimento: "1982-10-10", email: "jorge.mendes@vidaplus.com"},
                {name: "Larissa Dias", cpf: "22233344411", celular: "21912121212", dataNascimento: "1999-04-08", email: "larissa.dias@vidaplus.com"},
                {name: "Marcos Barbosa", cpf: "22233344412", celular: "21913131313", dataNascimento: "1991-08-14", email: "marcos.barbosa@vidaplus.com"},
            ];

            const patientAuthUsers = await Promise.all(
                patientsData.map((p) => admin.auth().createUser({email: p.email, password: password})),
            );
            logins.push(...patientsData.map((p) => ({email: p.email, password, role: "patient"})));

            const patientProfilePromises = patientAuthUsers.map((user, index) => {
                const data = patientsData[index];
                return db.collection("patients").add({name: data.name, cpf: data.cpf, celular: data.celular, dataNascimento: data.dataNascimento, userId: user.uid});
            });
            const patientRefs = await Promise.all(patientProfilePromises);
            const patientIds = patientRefs.map((ref) => ref.id);

            // --- 3. Criar Consultas ---
            const batch = db.batch();
            for (let i = 0; i < 12; i++) {
                const patientId = patientIds[i]; // Cada paciente terá uma consulta
                const professionalId = professionalIds[i % professionalIds.length]; // Distribui entre os profissionais
                const appointmentDate = new Date();
                appointmentDate.setDate(appointmentDate.getDate() + (i + 1) * 2); // Espalha as consultas pelos próximos dias
                appointmentDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0); // Horários entre 9:00 e 16:30
                const newAppointmentRef = db.collection("appointments").doc(); // Cria uma referência com ID automático
                batch.set(newAppointmentRef, {patientId: patientId, professionalId: professionalId, date: appointmentDate.toISOString()});
            }
            await batch.commit();

            res.status(201).json({message: "Banco de dados populado com sucesso! 5 profissionais, 12 pacientes e 12 consultas foram criados.", logins: logins});
        } catch (error) {
            console.error("Erro ao popular o banco de dados:", error);
            if (error.code && error.code.startsWith("auth/")) {
                res.status(400).json({message: `Erro de autenticação ao criar usuários: ${error.message}. Verifique se os emails já existem.`});
            } else {
                res.status(500).json({message: "Erro interno ao popular o banco de dados.", error: error.message});
            }
        }
    });

    // Expõe o app Express como uma única Cloud Function chamada 'api'
    exports.api = functions.https.onRequest(app);

    // Expõe o app Express como uma única Cloud Function chamada 'api'
    exports.api = functions.https.onRequest(app);
