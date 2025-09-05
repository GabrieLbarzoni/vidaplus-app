const express = require("express");
const router = express.Router();

module.exports = (db, authenticate) => {
  // Rota para CADASTRAR o perfil de um novo paciente (primeiro acesso)
  router.post("/", authenticate, async (req, res) => {
    try {
      const {name, cpf, celular, dataNascimento} = req.body;
      const uid = req.user.uid;

      const patientDoc = await db.collection("patients").where("userId", "==", uid).get();
      const profDoc = await db.collection("professionals").where("userId", "==", uid).get();
      if (!patientDoc.empty || !profDoc.empty) {
        return res.status(400).json({message: "Usuário já possui um perfil."});
      }

      const snapshot = await db.collection("patients").where("cpf", "==", cpf).get();
      if (!snapshot.empty) {
        return res.status(400).json({message: "CPF já cadastrado."});
      }
      const newPatientData = {name, cpf, celular, dataNascimento, userId: uid};
      const newPatientRef = await db.collection("patients").add(newPatientData);
      res.status(201).json({id: newPatientRef.id, ...newPatientData});
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      res.status(500).json({message: error.message});
    }
  });

  // Rota para ATUALIZAR o perfil de um paciente
  router.put("/:id", authenticate, async (req, res) => {
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

  return router;
};