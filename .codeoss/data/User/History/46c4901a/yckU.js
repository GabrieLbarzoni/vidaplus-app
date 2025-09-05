document.addEventListener("DOMContentLoaded", () => {
    // IMPORTANTE: Substitua pela URL da sua API, a mesma que você usa no app.js!
    const API_URL = "ttps://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api

    // --- Elementos do DOM ---
    const pageTitle = document.querySelector("h1");
    const formTitle = document.querySelector("h2");
    const formProfile = document.getElementById("form-profile");
    const nameInput = document.getElementById("name");
    const cpfField = document.getElementById("cpf-field");
    const cpfInput = document.getElementById("cpf");
    const celularInput = document.getElementById("celular");
    const especialidadeInput = document.getElementById("especialidade");
    const horarioInicioInput = document.getElementById("horarioInicio");
    const horarioFimInput = document.getElementById("horarioFim");
    const submitBtn = document.getElementById("submit-btn");

    // --- Elementos do Modal ---
    const modal = document.getElementById("feedback-modal");
    const modalMessage = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const modalCloseBtn = document.getElementById("modal-close-btn");

    let userProfileId = null;
    let isEditMode = false;

    // --- Funções do Modal ---
    const showModal = (message, isError = false) => {
        modalMessage.textContent = message;
        modal.classList.remove("hidden");
        modalIcon.innerHTML = isError ?
            `<i class="fas fa-times-circle text-5xl text-red-500"></i>` :
            `<i class="fas fa-check-circle text-5xl text-green-500"></i>`;
    };
    const hideModal = () => modal.classList.add("hidden");
    modalCloseBtn.addEventListener("click", hideModal);

    // --- Lógica Principal ---
    const initializeProfilePage = async () => {
        const token = localStorage.getItem("firebaseToken");
        if (!token) {
            showModal("Você não está autenticado. Redirecionando...", true);
            setTimeout(() => (window.location.href = "/login.html"), 2000);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/profile`, {
                headers: {Authorization: `Bearer ${token}`},
            });

            if (response.status === 404) {
                // MODO CRIAÇÃO: Usuário sem perfil.
                isEditMode = false;
                pageTitle.textContent = "Criar Perfil Profissional";
                formTitle.textContent = "Complete seu Cadastro";
                submitBtn.textContent = "Cadastrar Perfil";
                cpfField.classList.remove("hidden"); // Mostra o campo de CPF.
                return;
            }

            if (!response.ok) throw new Error("Falha ao carregar dados do perfil.");

            const profile = await response.json();

            if (profile.role !== "professional") {
                showModal("Esta página é apenas para profissionais.", true);
                // Idealmente, redirecionar para o painel do paciente.
                return;
            }

            // MODO EDIÇÃO: Perfil encontrado.
            isEditMode = true;
            userProfileId = profile.id;
            pageTitle.textContent = "Meu Perfil Profissional";
            formTitle.textContent = "Editar Informações";
            submitBtn.textContent = "Salvar Alterações";

            // Preenche o formulário com os dados existentes.
            nameInput.value = profile.name || "";
            celularInput.value = profile.celular || "";
            especialidadeInput.value = profile.specialty || "";
            horarioInicioInput.value = profile.horarioInicio || "09:00";
            horarioFimInput.value = profile.horarioFim || "18:00";

            // Preenche e desabilita o CPF, pois não deve ser alterado.
            cpfInput.value = profile.cpf || "";
            cpfInput.disabled = true;
            cpfInput.classList.add("bg-gray-100");
            cpfField.classList.remove("hidden"); // Mostra o campo já preenchido.

        } catch (error) {
            showModal(error.message, true);
        }
    };

    formProfile.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = isEditMode ? "Salvando..." : "Cadastrando...";

        const token = localStorage.getItem("firebaseToken");
        if (!token) {
            showModal("Sessão expirada. Faça login novamente.", true);
            submitBtn.disabled = false;
            return;
        }

        // Coleta os dados do formulário
        const data = {
            name: nameInput.value,
            celular: celularInput.value,
            especialidade: especialidadeInput.value,
            horarioInicio: horarioInicioInput.value,
            horarioFim: horarioFimInput.value,
        };

        if (!isEditMode) {
            data.cpf = cpfInput.value;
        }

        const url = isEditMode ? `${API_URL}/professionals/${userProfileId}` : `${API_URL}/professionals`;
        const method = isEditMode ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Ocorreu um erro.");

            const successMessage = isEditMode ? "Perfil atualizado com sucesso!" : "Perfil criado com sucesso!";
            showModal(successMessage);

            // Se foi um cadastro, recarrega a página para entrar no modo de edição.
            if (!isEditMode) {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            showModal(error.message, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? "Salvar Alterações" : "Cadastrar Perfil";
        }
    });

    initializeProfilePage();
});