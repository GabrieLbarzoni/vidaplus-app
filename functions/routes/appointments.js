const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

module.exports = (db, authenticate) => {
  // Rota para agendar uma nova consulta
  router.post("/", authenticate, async (req, res) => {
    try {
      const {patientId, professionalId, date} = req.body;

      const professionalRef = db.collection("professionals").doc(professionalId);
      const professionalDoc = await professionalRef.get();

      if (!professionalDoc.exists) {
        return res.status(404).json({message: "Profissional não encontrado."});
      }

      const professionalData = professionalDoc.data();
      const {horarioInicio, horarioFim} = professionalData;

      if (horarioInicio && horarioFim) {
        const appointmentDate = new Date(date);
        const appointmentTime = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
        const [startHour, startMinute] = horarioInicio.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const [endHour, endMinute] = horarioFim.split(":").map(Number);
        const endTime = endHour * 60 + endMinute;

        if (appointmentTime < startTime || appointmentTime >= endTime) {
          return res.status(400).json({message: `O horário da consulta deve ser entre ${horarioInicio} e ${horarioFim}.`});
        }
      }

      const existingAppointments = await db.collection("appointments")
          .where("professionalId", "==", professionalId)
          .where("date", "==", date)
          .get();

      if (!existingAppointments.empty) {
        return res.status(400).json({message: "Este horário já está agendado para o profissional selecionado."});
      }

      const newAppointment = {patientId, professionalId, date};
      const newAppointmentRef = await db.collection("appointments").add(newAppointment);
      res.status(201).json({id: newAppointmentRef.id, ...newAppointment});
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      res.status(500).json({message: error.message});
    }
  });

  // Rota para buscar todas as consultas (MODIFICADA PARA AUDITORIA)
  router.get("/", authenticate, async (req, res) => {
    try {
      let query = db.collection("appointments");
      const userProfile = req.user.profile;

      if (userProfile) {
        if (userProfile.role === "patient") {
          query = query.where("patientId", "==", userProfile.profileId);
        } else if (userProfile.role === "professional") {
          query = query.where("professionalId", "==", userProfile.profileId);
        }
      }

      const appointmentsSnapshot = await query.get();
      const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

      if (appointmentsData.length === 0) {
        return res.status(200).json([]);
      }

      const patientIds = [...new Set(appointmentsData.map((app) => app.patientId))];
      const professionalIds = [...new Set(appointmentsData.map((app) => app.professionalId))];

      const [patientsSnapshot, professionalsSnapshot] = await Promise.all([
        patientIds.length ? db.collection("patients").where(admin.firestore.FieldPath.documentId(), "in", patientIds).get() : Promise.resolve({docs: []}),
        professionalIds.length ? db.collection("professionals").where(admin.firestore.FieldPath.documentId(), "in", professionalIds).get() : Promise.resolve({docs: []}),
      ]);

      const patientsMap = new Map(patientsSnapshot.docs.map((doc) => [doc.id, doc.data()]));
      const professionalsMap = new Map(professionalsSnapshot.docs.map((doc) => [doc.id, doc.data()]));

      const populatedAppointments = appointmentsData.map((app) => {
        const patient = patientsMap.get(app.patientId);
        const professional = professionalsMap.get(app.professionalId);

        const populatedApp = {
          ...app,
          patientName: patient ? patient.name : "Paciente não encontrado",
          professionalName: professional ? professional.name : "Profissional não encontrado",
          professionalSpecialty: professional ? professional.specialty : "N/A",
        };

        // Para a visão do paciente, removemos o conteúdo do prontuário por segurança,
        // enviando apenas um indicador de que ele existe.
        if (userProfile.role === "patient") {
          populatedApp.hasMedicalRecord = !!populatedApp.medicalRecord;
          delete populatedApp.medicalRecord;
        }

        return populatedApp;
      });

      populatedAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
      res.status(200).json(populatedAppointments);
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      res.status(500).json({message: error.message});
    }
  });

  // Rota para cancelar/excluir uma consulta
  router.delete("/:id", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const appointmentRef = db.collection("appointments").doc(id);
      const doc = await appointmentRef.get();

      if (!doc.exists) {
        return res.status(404).json({message: "Consulta não encontrada."});
      }

      const appointmentData = doc.data();
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

  // Rota para adicionar/atualizar um prontuário (MODIFICADA COM AUDITORIA)
  router.post("/:id/record", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const {recordText} = req.body;
      const userProfile = req.user.profile;

      if (!userProfile || userProfile.role !== "professional") {
        return res.status(403).json({message: "Apenas profissionais podem adicionar prontuários."});
      }

      const appointmentRef = db.collection("appointments").doc(id);
      const doc = await appointmentRef.get();
      if (!doc.exists) {
        return res.status(404).json({message: "Consulta não encontrada."});
      }

      const appointmentData = doc.data();
      if (appointmentData.professionalId !== userProfile.profileId) {
        return res.status(403).json({message: "Você não tem permissão para editar o prontuário desta consulta."});
      }

      await appointmentRef.update({
        medicalRecord: recordText,
        recordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // LOG DE AUDITORIA (ESCRITA)
      const auditLog = {
        action: "WRITE",
        professionalId: userProfile.profileId,
        patientId: appointmentData.patientId,
        appointmentId: id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("audit_logs").add(auditLog);

      res.status(200).json({message: "Prontuário salvo com sucesso."});
    } catch (error) {
      console.error("Erro ao salvar prontuário:", error);
      res.status(500).json({message: "Erro interno ao salvar o prontuário."});
    }
  });

  // Rota para buscar um prontuário (NOVA ROTA COM AUDITORIA)
  router.get("/:id/record", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const userProfile = req.user.profile;

      if (!userProfile || userProfile.role !== "professional") {
        return res.status(403).json({message: "Apenas profissionais podem visualizar prontuários."});
      }

      const appointmentRef = db.collection("appointments").doc(id);
      const doc = await appointmentRef.get();
      if (!doc.exists) {
        return res.status(404).json({message: "Consulta não encontrada."});
      }

      const appointmentData = doc.data();
      if (appointmentData.professionalId !== userProfile.profileId) {
        return res.status(403).json({message: "Você não tem permissão para visualizar este prontuário."});
      }

      // LOG DE AUDITORIA (LEITURA)
      const auditLog = {
        action: "READ",
        professionalId: userProfile.profileId,
        patientId: appointmentData.patientId,
        appointmentId: id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("audit_logs").add(auditLog);

      res.status(200).json({medicalRecord: appointmentData.medicalRecord || ""});
    } catch (error) {
      console.error("Erro ao buscar prontuário:", error);
      res.status(500).json({message: "Erro interno ao buscar prontuário."});
    }
  });

  return router;
};