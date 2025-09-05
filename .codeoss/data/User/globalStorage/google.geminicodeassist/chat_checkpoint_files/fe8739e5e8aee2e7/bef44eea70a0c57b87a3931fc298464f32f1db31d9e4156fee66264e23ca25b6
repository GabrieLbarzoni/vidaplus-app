// IMPORTANTE: Substitua pela sua Function URL correta do Firebase!
const API_URL = 'https://us-central1-vidaplus-sghss-8e11c.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // Esconde o conteúdo principal e mostra um loader para evitar "piscadas" na tela.
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.style.visibility = 'hidden';
        document.body.insertAdjacentHTML('afterbegin', '<div id="loader" style="text-align: center; padding: 4rem; font-family: sans-serif;">Verificando autenticação...</div>');
    }

    const auth = firebase.auth();
    let idToken = null;
    let userProfile = null; // Armazena os dados do perfil do usuário logado

    // Função wrapper para fetch com autenticação
    const fetchWithAuth = async (url, options = {}) => {
        if (!idToken) {
            throw new Error("Usuário não autenticado.");
        }
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        };
        return fetch(url, { ...options, headers });
    };

    // Lógica de Autenticação e Roteamento
    auth.onAuthStateChanged(async (user) => {
        // Remove o loader, pois o estado de autenticação foi definido.
        const loader = document.getElementById('loader');
        if (loader) {
            loader.remove();
        }

        if (user) {
            try {
                idToken = await user.getIdToken();
                
                // Verifica se o usuário já completou o perfil
                const response = await fetchWithAuth(`${API_URL}/user/status`);
                
                // Se a chamada à API falhar (status não for 2xx), não deslogue.
                // Em vez disso, mostre um erro claro para depuração.
                if (!response.ok) {
                    const errorText = await response.text();
                    document.body.innerHTML = `
                        <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
                            <h1>Erro ao Verificar Perfil</h1>
                            <p>A aplicação não conseguiu verificar os dados do seu perfil na API.</p>
                            <p>Isso pode ser um problema temporário ou de configuração.</p>
                            <p><strong>Por favor, envie um print desta tela para o suporte.</strong></p>
                            <pre style="background: #f0f0f0; padding: 1rem; text-align: left; white-space: pre-wrap; border-radius: 8px; margin-top: 1rem;"><strong>Status:</strong> ${response.status} ${response.statusText}\n<strong>Resposta:</strong> ${errorText}</pre>
                        </div>
                    `;
                    return;
                }

                const status = await response.json();
                userProfile = status; // Salva o perfil do usuário (incluindo role e profileId)

                if (!status.hasProfile) {
                    // Se não tem perfil, redireciona para a página de criação de perfil
                    window.location.href = '/profile.html';
                } else {
                    // Se tem perfil, inicializa o app principal
                    // e torna o conteúdo visível.
                    if (appContainer) {
                        appContainer.style.visibility = 'visible';
                    }
                    initializeApp(fetchWithAuth, userProfile);
                }
            } catch (error) {
                console.error("Erro de autenticação ou verificação de perfil:", error);
                // Se ocorrer um erro de rede (API offline, CORS, etc.), mostre na tela.
                document.body.innerHTML = `
                    <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
                        <h1>Erro de Conexão com a API</h1>
                        <p>Não foi possível conectar ao servidor da aplicação.</p>
                        <p>Verifique sua conexão com a internet e se a URL da API está correta.</p>
                        <p><strong>Por favor, envie um print desta tela para o suporte.</strong></p>
                        <pre style="background: #f0f0f0; padding: 1rem; text-align: left; white-space: pre-wrap; border-radius: 8px; margin-top: 1rem;"><strong>URL da API:</strong> ${API_URL}\n<strong>Erro:</strong> ${error.message}</pre>
                    </div>
                `;
            }
        } else {
            // Se não há usuário, redireciona para a página de login
            window.location.href = '/login.html';
        }
    });

    // Seletores do DOM
    const formAddAppointment = document.getElementById('form-add-appointment');
    const appointmentList = document.getElementById('appointment-list');
    const professionalSelect = document.getElementById('appointment-professional');
    const modal = document.getElementById('feedback-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Funções de Renderização (agora recebem a função de fetch)
    const renderAppointments = async (fetcher) => {
        try {
            const response = await fetcher(`${API_URL}/appointments`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro do servidor ao buscar consultas: ${errorText}`);
            }
            const appointments = await response.json();
            appointmentList.innerHTML = '';
            if (appointments.length === 0) {
                appointmentList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma consulta agendada.</li>`;
            } else {
                // A ordenação já é feita no backend, mas podemos garantir aqui também.
                // appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
                appointments.forEach(app => {
                    const li = document.createElement('li');
                    li.className = 'p-2 bg-gray-50 rounded border flex justify-between items-center';
                    const formattedDate = new Date(app.date).toLocaleString('pt-BR');
                    li.innerHTML = `
                        <div class="flex-grow">
                            <div class="font-semibold">${app.patientName}</div>
                            <div class="text-sm text-gray-600">Com: ${app.professionalName}</div>
                            <div class="text-xs text-gray-500 mt-1">${formattedDate}</div>
                        </div>
                        <button data-id="${app.id}" class="cancel-appointment-btn bg-red-100 text-red-700 px-2 py-1 text-xs rounded hover:bg-red-200 transition-colors">
                            Cancelar
                        </button>
                    `;
                    appointmentList.appendChild(li);
                });
            }
        } catch (error) {
            showModal('Erro ao carregar consultas.', true);
            console.error(error);
        }
    };

    const populateProfessionalSelect = async (fetcher) => {
        try {
            const response = await fetcher(`${API_URL}/professionals`);
            if (!response.ok) {
                throw new Error('Falha ao carregar profissionais do servidor.');
            }
            const professionals = await response.json();
            professionalSelect.innerHTML = '<option value="">Selecione um profissional...</option>';
            professionals.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = `${prof.name} (${prof.specialty})`;
                professionalSelect.appendChild(option);
            });
        } catch (error) {
            showModal('Erro ao carregar profissionais.', true);
            console.error(error);
        }
    };

    const showModal = (message, isError = false) => {
        modalMessage.textContent = message;
        const modalIcon = document.getElementById('modal-icon'); // Pega o ícone dentro da função
        modal.classList.remove('hidden', 'modal-enter-active');
        if (isError) {
            modalIcon.innerHTML = `<i class="fas fa-times-circle text-5xl text-red-500"></i>`;
        } else {
            modalIcon.innerHTML = `<i class="fas fa-check-circle text-5xl text-green-500"></i>`;
        }
        void modal.offsetWidth; // Força o reflow
        modal.classList.add('modal-enter-active');
    };
    const hideModal = () => modal.classList.add('hidden');

    // A inicialização agora é chamada apenas se o usuário estiver logado e com perfil
    const initializeApp = (fetcher, profile) => {
        // --- Lógica da Barra de Navegação ---
        const welcomeContainer = document.getElementById('welcome-container');
        if (welcomeContainer && profile.name) {
            welcomeContainer.innerHTML = `
                <span class="text-gray-700">Olá,&nbsp;</span>
                <a href="/profile.html" class="text-blue-600 hover:underline font-semibold">${profile.name}</a>
                <span class="text-gray-700">!</span>
            `;
        }

        const logoutButton = document.getElementById('btn-logout');
        if (logoutButton) {
            logoutButton.onclick = () => auth.signOut();
        }
        // --- Fim da Lógica da Barra de Navegação ---

        // Carrega os dados iniciais
        populateProfessionalSelect(fetcher);
        renderAppointments(fetcher);

        // Event listener para agendar consulta
        formAddAppointment.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formAddAppointment);
            const appointmentData = Object.fromEntries(formData.entries());

            // Define o ID do paciente como o do usuário logado, já que ele é o paciente.
            if (profile && profile.role === 'patient') {
                appointmentData.patientId = profile.profileId;
            }

            try {
                const response = await fetcher(`${API_URL}/appointments`, {
                    method: 'POST',
                    body: JSON.stringify(appointmentData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Erro ao agendar consulta.");
                showModal('Consulta agendada com sucesso!');
                formAddAppointment.reset();
                renderAppointments(fetcher);
            } catch (error) {
                showModal(error.message, true);
            }
        });

        // Event listener para cancelar consulta (usando delegação de eventos)
        appointmentList.addEventListener('click', async (e) => {
            if (e.target && e.target.classList.contains('cancel-appointment-btn')) {
                const appointmentId = e.target.dataset.id;
                
                if (confirm('Tem certeza que deseja cancelar esta consulta?')) {
                    try {
                        const response = await fetcher(`${API_URL}/appointments/${appointmentId}`, {
                            method: 'DELETE',
                        });

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(result.message || 'Erro ao cancelar a consulta.');
                        }

                        showModal('Consulta cancelada com sucesso!');
                        renderAppointments(fetcher); // Atualiza a lista de consultas
                    } catch (error) {
                        showModal(error.message, true);
                        console.error('Erro ao cancelar consulta:', error);
                    }
                }
            }
        });

        modalCloseBtn.addEventListener('click', hideModal);

    };
});