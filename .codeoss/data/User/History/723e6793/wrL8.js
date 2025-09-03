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
            const appointmentsSnapshot = await db.collection("appointments").orderBy("date", "asc").get();
            const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            if (appointmentsData.length === 0) {
                return res.status(200).json([]);
            }

            // Pega todos os IDs de pacientes únicos das consultas
            const patientIds = [...new Set(appointmentsData.map((app) => app.patientId))];

            // Busca os dados dos pacientes de uma só vez
            const patientsSnapshot = await db.collection("patients").where(admin.firestore.FieldPath.documentId(), "in", patientIds).get();
            const patientsMap = new Map();
            patientsSnapshot.forEach((doc) => {
                patientsMap.set(doc.id, doc.data());
            });

            // Dados estáticos de profissionais (poderiam vir de outra coleção também)
            const professionals = {
                1: { name: "Dr. Carlos Andrade", specialty: "Cardiologista" },
                2: { name: "Dra. Ana Beatriz", specialty: "Dermatologista" },
                3: { name: "Dr. João Pedro", specialty: "Ortopedista" },
            };

            // Adiciona os nomes aos dados da consulta
            const populatedAppointments = appointmentsData.map((app) => {
                const patient = patientsMap.get(app.patientId);
                const professional = professionals[app.professionalId];
                return {
                    ...app,
                    patientName: patient ? patient.name : "Paciente não encontrado",
                    professionalName: professional ? professional.name : "Profissional não encontrado",
                };
            });

            res.status(200).json(populatedAppointments);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // Expõe o app Express como uma única Cloud Function chamada 'api'
    exports.api = functions.https.onRequest(app);