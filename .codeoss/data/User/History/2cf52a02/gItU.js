const express = require("express");
const router = express.Router();

module.exports = (db, authenticate) => {
  // Rota para CADASTRAR o perfil de um novo profissional (primeiro acesso)
  router.post("/", authenticate, async (req, res) => {
    try {
      const {name, cpf, celular, specialty, horarioInicio, horarioFim} = req.body;
      const uid = req.user.uid;

      const patientDoc = await db.collection("patients").where("userId", "==", uid).get();
      const profDoc = await db.collection("professionals").where("userId", "==", uid).get();
      if (!patientDoc.empty || !profDoc.empty) {
        return res.status(400).json({message: "Usuário já possui um perfil."});
      }

      const snapshot = await db.collection("professionals").where("cpf", "==", cpf).get();
      if (!snapshot.empty) {
        return res.status(400).json({message: "CPF já cadastrado."});
      }

      const newProfessionalData = {
        name,
        cpf,
        celular,
        specialty,
        userId: uid,
        horarioInicio,
        horarioFim,
      };
      const newProfessionalRef = await db.collection("professionals").add(newProfessionalData);
      res.status(201).json({id: newProfessionalRef.id, ...newProfessionalData});
    } catch (error) {
      console.error("Erro ao cadastrar profissional:", error);
      res.status(500).json({message: error.message});
    }
  });

  // Rota para buscar todos os profissionais
  router.get("/", authenticate, async (req, res) => {
    try {
      const snapshot = await db.collection("professionals").get();
      const professionals = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
      res.status(200).json(professionals);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      res.status(500).json({message: error.message});
    }
  });

  // Rota para ATUALIZAR o perfil de um profissional
  router.put("/:id", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const {name, celular, specialty, horarioInicio, horarioFim} = req.body;

      if (!req.user.profile || req.user.profile.profileId !== id || req.user.profile.role !== "professional") {
        return res.status(403).json({message: "Você não tem permissão para atualizar este perfil."});
      }

      const updatedData = {
        name,
        celular,
        specialty,
        horarioInicio,
        horarioFim,
      };
      await db.collection("professionals").doc(id).update(updatedData);

      res.status(200).json({id, ...updatedData});
    } catch (error) {
      console.error("Erro ao atualizar perfil do profissional:", error);
      res.status(500).json({message: "Erro interno ao atualizar perfil."});
    }
  });

  return router;
};