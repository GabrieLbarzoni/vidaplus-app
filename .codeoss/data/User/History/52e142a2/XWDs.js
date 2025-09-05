// IMPORTANTE: Substitua pela sua Function URL correta do Firebase!
const API_URL = 'https://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api';

// Importa os módulos de UI e Handlers
import { showModal, renderAppointments, populateProfessionalSelect, adjustUiForRole, renderWelcomeMessage } from './modules/ui.js';
import { setupEventListeners } from './modules/handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    if (!appContainer) return; // Garante que o script só execute na página da dashboard

    appContainer.style.visibility = 'hidden';
    document.body.insertAdjacentHTML('afterbegin', '<div id="loader" style="text-align: center; padding: 4rem; font-family: sans-serif;">Verificando autenticação...</div>');

    const auth = firebase.auth();
    let idToken = null;

    // Função wrapper para fetch com autenticação
    const fetchWithAuth = async (url, options = {}) => {
        if (!idToken) throw new Error("Usuário não autenticado.");
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        };
        return fetch(url, { ...options, headers });
    };

    /**
     * Carrega os dados iniciais da aplicação.
     * @param {Function} fetcher - A função de fetch autenticada.
     * @param {object} profile - O perfil do usuário.
     */
    const loadInitialData = async (fetcher, profile) => {
        try {
            // Carrega consultas
            const appointmentsResponse = await fetcher(`${API_URL}/appointments`);
            if (!appointmentsResponse.ok) throw new Error('Falha ao carregar consultas.');
            const appointments = await appointmentsResponse.json();
            renderAppointments(appointments, profile.role);

            // Carrega profissionais (se for paciente)
            if (profile.role === 'patient') {
                const professionalsResponse = await fetcher(`${API_URL}/professionals`);
                if (!professionalsResponse.ok) throw new Error('Falha ao carregar profissionais.');
                const professionals = await professionalsResponse.json();
                populateProfessionalSelect(professionals);
            }
        } catch (error) {
            showModal(error.message, true);
            console.error(error);
        }
    };

    /**
     * Inicializa a aplicação principal após a autenticação e verificação de perfil.
     * @param {object} profile - O perfil do usuário.
     */
    const initializeApp = (profile) => {
        // 1. Renderiza a UI inicial
        renderWelcomeMessage(profile);
        adjustUiForRole(profile.role);

        // 2. Carrega os dados das APIs
        loadInitialData(fetchWithAuth, profile);

        // 3. Configura todos os event listeners
        setupEventListeners(fetchWithAuth, profile, API_URL, auth);
    };

    // Ponto de entrada: Lógica de Autenticação e Roteamento
    auth.onAuthStateChanged(async (user) => {
        const loader = document.getElementById('loader');
        if (loader) loader.remove();

        if (user) {
            try {
                idToken = await user.getIdToken();
                
                const response = await fetchWithAuth(`${API_URL}/user/status`);
                if (!response.ok) {
                    const errorText = await response.text();
                    document.body.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif;"><h1>Erro ao Verificar Perfil</h1><p>A aplicação não conseguiu verificar os dados do seu perfil na API.</p><p><strong>Por favor, envie um print desta tela para o suporte.</strong></p><pre style="background: #f0f0f0; padding: 1rem; text-align: left; white-space: pre-wrap; border-radius: 8px; margin-top: 1rem;"><strong>Status:</strong> ${response.status} ${response.statusText}\n<strong>Resposta:</strong> ${errorText}</pre></div>`;
                    return;
                }

                const userProfile = await response.json();

                if (!userProfile.hasProfile) {
                    window.location.href = '/profile.html';
                } else {
                    if (appContainer) appContainer.style.visibility = 'visible';
                    initializeApp(userProfile);
                }
            } catch (error) {
                console.error("Erro de autenticação ou verificação de perfil:", error);
                document.body.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif;"><h1>Erro de Conexão com a API</h1><p>Não foi possível conectar ao servidor da aplicação.</p><p>Verifique sua conexão com a internet e se a URL da API está correta.</p><p><strong>Por favor, envie um print desta tela para o suporte.</strong></p><pre style="background: #f0f0f0; padding: 1rem; text-align: left; white-space: pre-wrap; border-radius: 8px; margin-top: 1rem;"><strong>URL da API:</strong> ${API_URL}\n<strong>Erro:</strong> ${error.message}</pre></div>`;
            }
        } else {
            window.location.href = '/login.html';
        }
    });
});