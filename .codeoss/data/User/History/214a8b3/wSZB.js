const admin = require("firebase-admin");

// Esta função cria e retorna o middleware de autenticação.
// Ela recebe a instância do 'db' para poder buscar os perfis.
const createAuthMiddleware = (db) => {
    return async (req, res, next) => {
        if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            return res.status(403).json({message: "Unauthorized: No token provided."});
        }
        const idToken = req.headers.authorization.split("Bearer ")[1];
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedIdToken; // uid, email, etc.

            // Busca o perfil do usuário para obter o role e profileId
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
};

module.exports = createAuthMiddleware;