// IMPORTANTE: Substitua pela sua Function URL correta do Firebase!
const API_URL = 'https://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    let currentUser = null;
    let userProfile = null; // Armazena os dados do perfil para saber se estamos editando

    const profileForm = document.getElementById('profile-form');
    const pageTitle = document.getElementById('page-title');
    const roleSelector = document.getElementById('role-selector');
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const patientFields = document.getElementById('patient-fields');
    const professionalFields = document.getElementById('professional-fields');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const especialidadeInput = document.getElementById('especialidade');
    const btnLogout = document.getElementById('btn-logout');
    const errorMessage = document.getElementById('error-message');

    const showError = (message) => {
        errorMessage.firstElementChild.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    // Função wrapper para fetch com autenticação
    const fetchWithAuth = async (url, options = {}) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const token = await currentUser.getIdToken();
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        return fetch(url, { ...options, headers });
    };

    // Carrega os dados do perfil para preencher o formulário no modo de edição
    const loadProfileData = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/profile`);

            // Se o perfil não for encontrado (404), significa que é um novo usuário.
            // Mantemos a página no modo de criação de perfil.
            if (response.status === 404) {
                pageTitle.textContent = 'Complete seu Perfil';
                roleSelector.classList.remove('hidden');
                return;
            }
            if (!response.ok) throw new Error('Falha ao carregar dados do perfil.');

            userProfile = await response.json();

            // Se encontramos um perfil, mudamos para o modo de edição
            pageTitle.textContent = 'Editar Perfil';
            roleSelector.classList.add('hidden'); // Esconde a opção de trocar de papel

            // Preenche os campos comuns
            profileForm.elements.name.value = userProfile.name || '';
            profileForm.elements.cpf.value = userProfile.cpf || '';
            profileForm.elements.celular.value = userProfile.celular || '';
            profileForm.elements.cpf.readOnly = true; // Impede a edição do CPF
            profileForm.elements.cpf.classList.add('bg-gray-100', 'cursor-not-allowed');

            // Mostra e preenche os campos específicos do papel
            if (userProfile.role === 'patient') {
                patientFields.classList.remove('hidden');
                professionalFields.classList.add('hidden');
                profileForm.elements.dataNascimento.value = userProfile.dataNascimento || '';
            } else if (userProfile.role === 'professional') {
                patientFields.classList.add('hidden');
                professionalFields.classList.remove('hidden');
                profileForm.elements.especialidade.value = userProfile.specialty || '';
            }
        } catch (error) {
            showError(error.message);
        }
    };

    // Verifica o estado de autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadProfileData(); // Carrega os dados do perfil ao iniciar
        } else {
            // Se não estiver logado, volta para a página de login
            window.location.href = '/login.html';
        }
    });

    // Alterna os campos do formulário com base no papel selecionado
    roleRadios.forEach((radio) => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'patient') {
                patientFields.classList.remove('hidden');
                professionalFields.classList.add('hidden');
                dataNascimentoInput.required = true;
                especialidadeInput.required = false;
            } else {
                patientFields.classList.add('hidden');
                professionalFields.classList.remove('hidden');
                dataNascimentoInput.required = false;
                especialidadeInput.required = true;
            }
        });
    });

    // Envio do formulário de perfil
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        if (!currentUser) {
            showError("Sessão expirada. Por favor, faça login novamente.");
            return;
        }

        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData.entries());
        const isUpdating = !!userProfile;

        try {
            let response;
            if (isUpdating) {
                // Lógica de ATUALIZAÇÃO (PUT)
                const endpoint = userProfile.role === 'patient' ?
                    `/patients/${userProfile.id}` :
                    `/professionals/${userProfile.id}`;

                response = await fetchWithAuth(`${API_URL}${endpoint}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } else {
                // Lógica de CRIAÇÃO (POST) - comportamento original
                const role = data.role;
                delete data.role;
                const endpoint = role === 'patient' ? '/patients' : '/professionals';
                response = await fetchWithAuth(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao salvar o perfil.');
            }

            window.location.href = '/index.html';

        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            showError(error.message);
        }
    });

    // Logout
    btnLogout.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '/login.html';
        });
    });
});