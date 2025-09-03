// IMPORTANTE: Deixe esta linha exatamente assim por enquanto!
// Cole aqui a configuração do seu projeto Firebase
// Você pode encontrar isso no Console do Firebase > Configurações do Projeto
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - SGHSS</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">SGHSS - VidaPlus</h1>
        <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline"></span>
        </div>
        <form id="login-form" class="space-y-6">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" name="email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
                <input type="password" id="password" name="password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div class="flex items-center justify-between gap-4">
                <button type="submit" id="btn-login" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Entrar</button>
                <button type="button" id="btn-signup" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Cadastrar</button>
            </div>
        </form>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    
    <!-- Project Scripts -->
    <script src="firebase-config.js"></script>
    <script src="auth.js"></script>
</body>
</html>
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const loginForm = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Se o usuário já estiver logado, redireciona para a página principal
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = '/index.html';
        }
    });

    const showError = (message) => {
        errorMessage.firstElementChild.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    // Evento de Login
    btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideError();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, preencha o email e a senha.');
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // O onAuthStateChanged vai cuidar do redirecionamento
            })
            .catch((error) => {
                console.error("Erro de login:", error);
                showError('Email ou senha inválidos.');
            });
    });

    // Evento de Cadastro
    btnSignup.addEventListener('click', (e) => {
        e.preventDefault();
        hideError();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, preencha o email e a senha para se cadastrar.');
            return;
        }
        if (password.length < 6) {
            showError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Após o cadastro, o usuário é logado automaticamente.
                // Redireciona para a página de preenchimento de perfil.
                window.location.href = '/profile.html';
            })
            .catch((error) => {
                console.error("Erro de cadastro:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showError('Este email já está em uso.');
                } else {
                    showError('Ocorreu um erro ao tentar se cadastrar.');
                }
            });
    });
});
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Completar Cadastro - SGHSS</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen py-12">
    <div class="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-2">Complete seu Cadastro</h1>
        <p class="text-center text-gray-500 mb-6">Para continuar, precisamos de mais algumas informações.</p>
        
        <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline"></span>
        </div>

        <form id="profile-form" class="space-y-6">
            <!-- Role Selection -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Eu sou:</label>
                <div class="flex gap-4">
                    <label class="flex items-center p-3 border rounded-md cursor-pointer flex-1">
                        <input type="radio" name="role" value="patient" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" checked>
                        <span class="ml-3 text-sm font-medium text-gray-700">Paciente</span>
                    </label>
                    <label class="flex items-center p-3 border rounded-md cursor-pointer flex-1">
                        <input type="radio" name="role" value="professional" class="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500">
                        <span class="ml-3 text-sm font-medium text-gray-700">Profissional de Saúde</span>
                    </label>
                </div>
            </div>

            <!-- Common Fields -->
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input type="text" id="name" name="name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
            </div>
            <div>
                <label for="cpf" class="block text-sm font-medium text-gray-700">CPF</label>
                <input type="text" id="cpf" name="cpf" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="000.000.000-00">
            </div>
            <div>
                <label for="celular" class="block text-sm font-medium text-gray-700">Celular</label>
                <input type="tel" id="celular" name="celular" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="(00) 90000-0000">
            </div>

            <!-- Patient-specific Field -->
            <div id="patient-fields">
                <label for="dataNascimento" class="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input type="date" id="dataNascimento" name="dataNascimento" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
            </div>

            <!-- Professional-specific Field -->
            <div id="professional-fields" class="hidden">
                <label for="especialidade" class="block text-sm font-medium text-gray-700">Especialidade</slabel>
                <input type="text" id="especialidade" name="especialidade" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="Ex: Cardiologista">
            </div>

            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Salvar e Continuar</button>
        </form>
        <div class="text-center mt-4">
            <button id="btn-logout" class="text-sm text-gray-500 hover:text-gray-700">Sair</button>
        </div>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    
    <!-- Project Scripts -->
    <script src="firebase-config.js"></script>
    <script src="profile.js"></script>
</body>
</html>
// A URL da API será preenchida no deploy, como antes.
const API_URL = 'URL_DA_SUA_API_AQUI';

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

    // Verifica o estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
        } else {
            // Se não estiver logado, volta para a página de login
            window.location.href = '/login.html';
        }
    });

    // Alterna os campos do formulário com base no papel selecionado
    roleRadios.forEach(radio => {
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
        if (!currentUser) {
            showError("Sessão expirada. Por favor, faça login novamente.");
            return;
        }

        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData.entries());
        const role = data.role;
        
        // Remove o campo 'role' que não vai para a API
        delete data.role;

        const endpoint = role === 'patient' ? '/api/patients' : '/api/professionals';

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `
                },
                body: JSON.stringify(data)
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
const API_URL = 'URL_DA_SUA_API_AQUI';

document.addEventListener('DOMContentLoaded', async () => {
    const auth = firebase.auth();
    let idToken = null;

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
        if (user) {
            try {
                idToken = await user.getIdToken();
                
                // Verifica se o usuário já completou o perfil
                const response = await fetchWithAuth(`${API_URL}/user/status`);
                if (!response.ok) {
                    // Se a verificação falhar, desloga para segurança
                    await auth.signOut();
                    return;
                }

                const status = await response.json();
                if (!status.hasProfile) {
                    // Se não tem perfil, redireciona para a página de criação de perfil
                    window.location.href = '/profile.html';
                } else {
                    // Se tem perfil, inicializa o app principal
                    initializeApp(fetchWithAuth);
                }
            } catch (error) {
                console.error("Erro de autenticação ou verificação de perfil:", error);
                await auth.signOut(); // Força o logout em caso de erro
            }
        } else {
            // Se não há usuário, redireciona para a página de login
            window.location.href = '/login.html';
        }
    });

    // Seletores do DOM
    const formAddPatient = document.getElementById('form-add-patient');
    const patientList = document.getElementById('patient-list');
    const formAddAppointment = document.getElementById('form-add-appointment');
    const appointmentList = document.getElementById('appointment-list');
    const patientSelect = document.getElementById('appointment-patient');
    const professionalSelect = document.getElementById('appointment-professional');
    const modal = document.getElementById('feedback-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Funções de Renderização (agora recebem a função de fetch)
    const renderPatients = async (fetcher) => {
        try {
            const response = await fetcher(`${API_URL}/patients`);
            const patients = await response.json();
            patientList.innerHTML = '';
            if (patients.length === 0) {
                patientList.innerHTML = `<li class="text-gray-500 text-sm">Nenhum paciente cadastrado.</li>`;
            } else {
                patients.forEach(patient => {
                    const li = document.createElement('li');
                    li.className = 'p-2 bg-gray-50 rounded border flex justify-between items-center';
                    li.innerHTML = `<span>${patient.name}</span> <span class="text-xs text-gray-500">${patient.cpf}</span>`;
                    patientList.appendChild(li);
                });
            }
            populatePatientSelect(patients);
        } catch (error) {
            showModal('Erro ao carregar pacientes.', true);
            console.error(error);
        }
    };

    const renderAppointments = async (fetcher) => {
        try {
            const response = await fetcher(`${API_URL}/appointments`);
            const appointments = await response.json();
            appointmentList.innerHTML = '';
            if (appointments.length === 0) {
                appointmentList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma consulta agendada.</li>`;
            } else {
                // A ordenação já é feita no backend, mas podemos garantir aqui também.
                // appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
                appointments.forEach(app => {
                    const li = document.createElement('li');
                    li.className = 'p-2 bg-gray-50 rounded border';
                    const formattedDate = new Date(app.date).toLocaleString('pt-BR');
                    li.innerHTML = `
                        <div class="font-semibold">${app.patientName}</div>
                        <div class="text-sm text-gray-600">Com: ${app.professionalName}</div>
                        <div class="text-xs text-gray-500 mt-1">${formattedDate}</div>
                    `;
                    appointmentList.appendChild(li);
                });
            }
        } catch (error) {
            showModal('Erro ao carregar consultas.', true);
            console.error(error);
        }
    };

    const populatePatientSelect = (patients) => {
        patientSelect.innerHTML = '<option value="">Selecione um paciente...</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name;
            patientSelect.appendChild(option);
        });
    };

    const populateProfessionalSelect = async (fetcher) => {
        try {
            const response = await fetcher(`${API_URL}/professionals`);
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
        }
    };

    const showModal = (message, isError = false) => {
        modalMessage.textContent = message;
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
    const initializeApp = (fetcher) => {
        // O formulário de adicionar paciente não faz mais sentido aqui,
        // pois o cadastro é feito na tela de perfil.
        // Vamos esconder ou desabilitar este formulário.
        formAddPatient.parentElement.style.display = 'none';

        // Carrega os dados iniciais
        renderPatients(fetcher);
        populateProfessionalSelect(fetcher);
        renderAppointments(fetcher);

        // Event listener para agendar consulta
        formAddAppointment.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formAddAppointment);
            const appointmentData = Object.fromEntries(formData.entries());
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

        // O formulário de adicionar paciente foi removido da lógica principal.
        // Se for necessário manter uma função de "adicionar novo paciente" por um admin,
        // a lógica precisaria ser ajustada. Por ora, vamos remover o listener.
        /*
        formAddPatient.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... lógica para admin adicionar paciente ...
        });
        */

        modalCloseBtn.addEventListener('click', hideModal);

        // Adiciona um botão de logout na interface principal
        const header = document.querySelector('header');
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Sair';
        logoutButton.className = 'absolute top-4 right-4 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600';
        logoutButton.onclick = () => auth.signOut();
        header.style.position = 'relative';
        header.appendChild(logoutButton);
    };
});