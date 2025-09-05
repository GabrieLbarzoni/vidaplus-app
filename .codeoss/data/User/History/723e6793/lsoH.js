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
            // Otimização: Busca perfis de paciente e profissional em paralelo para reduzir a latência.
            const uid = decodedIdToken.uid;
            const [patientQuery, professionalQuery] = await Promise.all([
                db.collection("patients").where("userId", "==", uid).limit(1).get(),
                db.collection("professionals").where("userId", "==", uid).limit(1).get(),
            ]);

            if (!patientQuery.empty) {
                const doc = patientQuery.docs[0];
                req.user.profile = {role: "patient", profileId: doc.id, name: doc.data().name};
            } else if (!professionalQuery.empty) {
                const doc = professionalQuery.docs[0];
                req.user.profile = {role: "professional", profileId: doc.id, name: doc.data().name};
            } else {
                req.user.profile = null; // Anexa null se nenhum perfil for encontrado
            }

            next();
        } catch (error) {
            console.error("Error while verifying Firebase ID token:", error);
            res.status(403).json({message: "Unauthorized: Invalid token."});
        }
    };

    // Pega a referência do nosso banco de dados Firestore
    const db = admin.firestore();

    // Rota para verificar o status do perfil do usuário
    app.get("/user/status", authenticate, async (req, res) => {
        try {
            // Otimização: Reutiliza o perfil já buscado pelo middleware, evitando novas leituras do DB.
            if (req.user.profile) {
                return res.status(200).json({
                    hasProfile: true,
                    ...req.user.profile,
                });
            }
            return res.status(200).json({hasProfile: false});
        } catch (error) {
            console.error("Erro ao verificar status do usuário:", error);
            res.status(500).json({message: error.message});
        }
    });

    // ======================================================
    // ROTAS DA API COM FIRESTORE
    // ======================================================

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
            // Se não tiver perfil (ex: admin), a query busca todas as consultas.

            const appointmentsSnapshot = await query.get();
            const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

            if (appointmentsData.length === 0) {
                return res.status(200).json([]);
            }

            // Pega todos os IDs de pacientes e profissionais únicos das consultas
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
            // Apenas o paciente da consulta pode cancelar.
            // 1. O usuário deve ter um perfil.
            // 2. O perfil deve ser de paciente.
            // 3. O ID do perfil do paciente deve ser o mesmo que o patientId da consulta.
            if (!req.user.profile || req.user.profile.role !== "patient" || appointmentData.patientId !== req.user.profile.profileId) {
                return res.status(403).json({message: "Você não tem permissão para cancelar esta consulta."});
            }

            await appointmentRef.delete();

            res.status(200).json({message: "Consulta cancelada com sucesso."});
        } catch (error) {
            console.error("Erro ao cancelar consulta:", error);
            res.status(500).json({message: "Erro interno ao cancelar a consulta."});
        }
    });

    // Rota para adicionar/atualizar um prontuário em uma consulta
    app.post("/appointments/:id/record", authenticate, async (req, res) => {
        try {
            const {id} = req.params;
            const {recordText} = req.body;
            const userProfile = req.user.profile;

            // 1. Verificar se o usuário é um profissional
            if (!userProfile || userProfile.role !== "professional") {
                return res.status(403).json({message: "Apenas profissionais de saúde podem adicionar prontuários."});
            }
            const professionalProfileId = userProfile.profileId;

            // 2. Obter a consulta e verificar se o profissional é o responsável
            const appointmentRef = db.collection("appointments").doc(id);
            const doc = await appointmentRef.get();

            if (!doc.exists) {
                return res.status(404).json({message: "Consulta não encontrada."});
            }

            const appointmentData = doc.data();
            if (appointmentData.professionalId !== professionalProfileId) {
                return res.status(403).json({message: "Você não tem permissão para editar o prontuário desta consulta."});
            }

            // 3. Atualizar a consulta com o prontuário
            await appointmentRef.update({
                medicalRecord: recordText,
                recordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            res.status(200).json({message: "Prontuário salvo com sucesso."});
        } catch (error) {
            console.error("Erro ao salvar prontuário:", error);
            res.status(500).json({message: "Erro interno ao salvar o prontuário."});
        }
    });

    // Rota para buscar o perfil completo do usuário logado (para edição)
    app.get("/profile", authenticate, async (req, res) => {
        try {
            const uid = req.user.uid;
            const patientDoc = await db.collection("patients").where("userId", "==", uid).limit(1).get();
            if (!patientDoc.empty) {
                const profile = patientDoc.docs[0];
                return res.status(200).json({id: profile.id, role: "patient", ...profile.data()});
            }

            const professionalDoc = await db.collection("professionals").where("userId", "==", uid).limit(1).get();
            if (!professionalDoc.empty) {
                const profile = professionalDoc.docs[0];
                return res.status(200).json({id: profile.id, role: "professional", ...profile.data()});
            }

            // Se o usuário está autenticado mas não tem perfil, é o cenário de criação.
            return res.status(404).json({message: "Perfil não encontrado."});
        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            res.status(500).json({message: "Erro interno ao buscar perfil."});
        }
    });

    // Rota para ATUALIZAR o perfil de um paciente
    app.put("/patients/:id", authenticate, async (req, res) => {
        try {
            const {id} = req.params;
            const {name, celular, dataNascimento} = req.body;

            if (!req.user.profile || req.user.profile.profileId !== id || req.user.profile.role !== "patient") {
                return res.status(403).json({message: "Você não tem permissão para atualizar este perfil."});
            }

            const updatedData = {name, celular, dataNascimento};
            await db.collection("patients").doc(id).update(updatedData);

            res.status(200).json({id, ...updatedData});
        } catch (error) {
            console.error("Erro ao atualizar perfil do paciente:", error);
            res.status(500).json({message: "Erro interno ao atualizar perfil."});
        }
    });

    // Rota para ATUALIZAR o perfil de um profissional
    app.put("/professionals/:id", authenticate, async (req, res) => {
        try {
            const {id} = req.params;
            const {name, celular, especialidade} = req.body;

            if (!req.user.profile || req.user.profile.profileId !== id || req.user.profile.role !== "professional") {
                return res.status(403).json({message: "Você não tem permissão para atualizar este perfil."});
            }

            const updatedData = {name, celular, specialty: especialidade};
            await db.collection("professionals").doc(id).update(updatedData);

            res.status(200).json({id, ...updatedData});
        } catch (error) {
            console.error("Erro ao atualizar perfil do profissional:", error);
            res.status(500).json({message: "Erro interno ao atualizar perfil."});
        }
    });

    // Expõe o app Express como uma única Cloud Function chamada 'api'
    // Atualizado para 2ª Geração, especificando a região para maior clareza.
    exports.api = onRequest({region: "us-central1"}, app);