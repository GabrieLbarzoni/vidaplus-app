// IMPORTANTE: Substitua pela sua Function URL correta do Firebase!
const API_URL = 'https://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    let currentUser = null;

    const profileForm = document.getElementById('profile-form');
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

    // Verifica o estado de autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
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
        const role = data.role;

        // Remove o campo 'role' que não vai para a API
        delete data.role;

        // O endpoint agora não tem mais o /api, pois a URL da função já é a nossa API base.
        const endpoint = role === 'patient' ? '/patients' : '/professionals';

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao salvar o perfil.');
            }

            // Sucesso! Redireciona para a página principal da aplicação.
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