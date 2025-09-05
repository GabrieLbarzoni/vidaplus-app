const express = require("express");
const router = express.Router();

module.exports = (db, authenticate) => {
    // Rota para verificar o status do perfil do usuário
    router.get("/user/status", authenticate, async (req, res) => {
        try {
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

    // Rota para buscar o perfil completo do usuário logado (para edição)
    router.get("/profile", authenticate, async (req, res) => {
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
            return res.status(404).json({message: "Perfil não encontrado."});
        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            res.status(500).json({message: "Erro interno ao buscar perfil."});
        }
    });

    return router;
};