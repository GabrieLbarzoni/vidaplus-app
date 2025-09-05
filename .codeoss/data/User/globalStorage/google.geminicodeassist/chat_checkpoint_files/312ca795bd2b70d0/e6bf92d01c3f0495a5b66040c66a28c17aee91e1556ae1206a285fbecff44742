document.addEventListener("DOMContentLoaded", () => {
    // IMPORTANTE: Substitua pela URL da sua API, a mesma que você usa no app.js!
    const API_URL = 'https://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api';

    // --- Elementos do DOM ---
    const pageTitle = document.querySelector("h1");
    const formTitle = document.querySelector("h2");
    const formProfile = document.getElementById("form-profile");
    const submitBtn = document.getElementById("submit-btn");

    // Campos comuns
    const nameInput = document.getElementById("name");
    const celularInput = document.getElementById("celular");
    const cpfField = document.getElementById("cpf-field");
    const cpfInput = document.getElementById("cpf");

    // Campo de seleção de Role (para criação)
    const roleSelectionField = document.getElementById("role-selection-field");
    const roleSelect = document.getElementById("role-select");

    // Campos de Paciente
    const patientFields = document.getElementById("patient-fields");
    const dataNascimentoInput = document.getElementById("dataNascimento");

    // Campos de Profissional
    const professionalFields = document.getElementById("professional-fields");
    const especialidadeInput = document.getElementById("especialidade");
    const horarioInicioInput = document.getElementById("horarioInicio");
    const horarioFimInput = document.getElementById("horarioFim");

    // --- Elementos do Modal ---
    const modal = document.getElementById("feedback-modal");
    const modalMessage = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    
    let userProfileId = null;
    let currentUserRole = null;
    let isEditMode = false;

    // --- Funções do Modal ---
    const showModal = (message, isError = false) => {
        modalMessage.textContent = message;
        modal.classList.remove("hidden", "modal-enter-active");
        modalIcon.innerHTML = isError ?
            `<i class="fas fa-times-circle text-5xl text-red-500"></i>` :
            `<i class="fas fa-check-circle text-5xl text-green-500"></i>`;
        void modal.offsetWidth; // Força o reflow
        modal.classList.add('modal-enter-active');
    };
    const hideModal = () => modal.classList.add("hidden");
    modalCloseBtn.addEventListener("click", hideModal);

    // --- Lógica de UI ---
    const toggleFieldsByRole = (role) => {
        patientFields.classList.toggle('hidden', role !== 'patient');
        professionalFields.classList.toggle('hidden', role !== 'professional');
    };

    // --- Lógica Principal ---
    const initializeProfilePage = async () => {
        submitBtn.disabled = true;
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
                pageTitle.textContent = "Criar Novo Perfil";
                formTitle.textContent = "Escolha seu tipo de perfil e complete o cadastro";
                submitBtn.textContent = "Cadastrar Perfil";

                roleSelectionField.classList.remove("hidden");
                cpfField.classList.remove("hidden");
                toggleFieldsByRole(roleSelect.value);

                roleSelect.addEventListener('change', () => toggleFieldsByRole(roleSelect.value));

            } else {
                if (!response.ok) throw new Error("Falha ao carregar dados do perfil.");
                const profile = await response.json();

                // MODO EDIÇÃO: Perfil encontrado.
                isEditMode = true;
                userProfileId = profile.id;
                currentUserRole = profile.role;

                pageTitle.textContent = `Meu Perfil de ${profile.role === 'patient' ? 'Paciente' : 'Profissional'}`;
                formTitle.textContent = "Editar Informações";

                // Esconde a seleção de role e mostra os campos corretos
                roleSelectionField.classList.add("hidden");
                toggleFieldsByRole(profile.role);

                // Preenche campos comuns
                nameInput.value = profile.name || "";
                celularInput.value = profile.celular || "";

                // Preenche e desabilita o CPF
                cpfField.classList.remove("hidden");
                cpfInput.value = profile.cpf || "";
                cpfInput.disabled = true;
                cpfInput.classList.add("bg-gray-100");

                // Preenche campos específicos do role
                if (profile.role === 'patient') {
                    dataNascimentoInput.value = profile.dataNascimento || "";
                } else if (profile.role === 'professional') {
                    especialidadeInput.value = profile.specialty || "";
                    horarioInicioInput.value = profile.horarioInicio || "";
                    horarioFimInput.value = profile.horarioFim || "";
                }
                submitBtn.textContent = "Salvar Alterações";
            }
            submitBtn.disabled = false;
        } catch (error) {
            submitBtn.textContent = "Erro ao Carregar";
            submitBtn.disabled = false;
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
 
        const role = isEditMode ? currentUserRole : roleSelect.value;
        let url;
        let data;
 
        if (role === 'patient') {
            data = {
                name: nameInput.value,
                celular: celularInput.value,
                dataNascimento: dataNascimentoInput.value,
            };
            if (!isEditMode) data.cpf = cpfInput.value;
            url = isEditMode ? `${API_URL}/patients/${userProfileId}` : `${API_URL}/patients`;
        } else if (role === 'professional') {
            data = {
                name: nameInput.value,
                celular: celularInput.value,
                especialidade: especialidadeInput.value,
                horarioInicio: horarioInicioInput.value,
                horarioFim: horarioFimInput.value,
            };
            if (!isEditMode) data.cpf = cpfInput.value;
            url = isEditMode ? `${API_URL}/professionals/${userProfileId}` : `${API_URL}/professionals`;
        } else {
            showModal("Por favor, selecione um tipo de perfil.", true);
            submitBtn.disabled = false;
            submitBtn.textContent = "Cadastrar Perfil";
            return;
        }
 
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
 
            setTimeout(() => {
                // Após criar ou editar, volta para a dashboard principal.
                window.location.href = "/index.html";
            }, 1500);

        } catch (error) {
            showModal(error.message, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? "Salvar Alterações" : "Cadastrar Perfil";
        }
    });
 
    initializeProfilePage();
});