/**
 * Módulo de UI: Funções para manipular o DOM.
 */

// --- Seletores de Elementos do DOM ---
const getDOMElements = () => ({
    // Seções principais
    schedulingSection: document.getElementById('scheduling-section'),
    appointmentsSection: document.getElementById('appointments-section'),
    
    // Formulário e lista
    formAddAppointment: document.getElementById('form-add-appointment'),
    appointmentList: document.getElementById('appointment-list'),
    professionalSelect: document.getElementById('appointment-professional'),

    // Navbar
    welcomeContainer: document.getElementById('welcome-container'),
    logoutButton: document.getElementById('btn-logout'),

    // Modal de Feedback
    feedbackModal: document.getElementById('feedback-modal'),
    modalMessage: document.getElementById('modal-message'),
    modalIcon: document.getElementById('modal-icon'),
    modalCloseBtn: document.getElementById('modal-close-btn'),

    // Modal de Prontuário
    medicalRecordModal: document.getElementById('medical-record-modal'),
    medicalRecordForm: document.getElementById('medical-record-form'),
    recordPatientName: document.getElementById('record-patient-name'),
    recordAppointmentId: document.getElementById('record-appointment-id'),
    medicalRecordText: document.getElementById('medical-record-text'),
    recordModalCloseBtn: document.getElementById('record-modal-close-btn'),
});

// --- Funções do Modal de Feedback ---
export const showModal = (message, isError = false) => {
    const { feedbackModal, modalMessage, modalIcon } = getDOMElements();
    if (!feedbackModal || !modalMessage || !modalIcon) return;

    modalMessage.textContent = message;
    modalIcon.innerHTML = isError
        ? `<i class="fas fa-times-circle text-5xl text-red-500"></i>`
        : `<i class="fas fa-check-circle text-5xl text-green-500"></i>`;
    
    feedbackModal.classList.remove('hidden', 'modal-enter');
    void feedbackModal.offsetWidth; // Força reflow para a animação funcionar
    feedbackModal.classList.add('modal-enter-active');
};

export const hideModal = () => {
    const { feedbackModal } = getDOMElements();
    if (feedbackModal) {
        feedbackModal.classList.add('hidden');
        feedbackModal.classList.remove('modal-enter-active');
    }
};

// --- Funções de Renderização da UI ---

export const renderWelcomeMessage = (profile) => {
    const { welcomeContainer } = getDOMElements();
    if (welcomeContainer) {
        // Mostra o nome completo do usuário
        welcomeContainer.innerHTML = `Bem-vindo(a), <span class="font-bold text-blue-700 ml-1">${profile.name}</span>!`;
        
        // Adiciona o evento de clique para redirecionar para a página de perfil
        welcomeContainer.onclick = () => {
            window.location.href = '/profile.html';
        };
    }
};

export const adjustUiForRole = (role) => {
    const { schedulingSection } = getDOMElements();
    if (schedulingSection) {
        // Pacientes podem agendar, profissionais não (nesta UI).
        schedulingSection.style.display = role === 'patient' ? 'block' : 'none';
    }
};

export const renderAppointments = (appointments, role) => {
    const { appointmentList } = getDOMElements();
    if (!appointmentList) return;

    appointmentList.innerHTML = '';
    if (appointments.length === 0) {
        appointmentList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma consulta encontrada.</li>`;
        return;
    }

    appointments.forEach(app => {
        const li = document.createElement('li');
        li.className = 'p-3 bg-gray-50 rounded-lg border flex justify-between items-center';
        // Adiciona o prontuário ao dataset do LI para ser acessado pelo handler
        li.dataset.medicalRecord = app.medicalRecord || '';

        const formattedDate = new Date(app.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

        const infoDiv = `
            <div>
                <div class="font-semibold">${role === 'patient' ? app.professionalName : app.patientName}</div>
                <div class="text-sm text-gray-600">Especialidade: ${app.professionalSpecialty}</div>
                <div class="text-xs text-gray-500 mt-1">${formattedDate}</div>
            </div>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex flex-col sm:flex-row gap-2';

        // Botão de Cancelar (para ambos)
        const cancelButton = document.createElement('button');
        cancelButton.dataset.id = app.id;
        cancelButton.className = 'cancel-appointment-btn text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors';
        cancelButton.textContent = 'Cancelar';
        actionsDiv.appendChild(cancelButton);

        // Botão de Prontuário (apenas para profissionais)
        if (role === 'professional') {
            const recordButton = document.createElement('button');
            recordButton.dataset.id = app.id;
            recordButton.dataset.patientName = app.patientName;
            recordButton.className = 'open-record-btn text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors';
            recordButton.textContent = 'Prontuário';
            actionsDiv.appendChild(recordButton);
        }

        li.innerHTML = infoDiv;
        li.appendChild(actionsDiv);
        appointmentList.appendChild(li);
    });
};

export const populateProfessionalSelect = (professionals) => {
    const { professionalSelect } = getDOMElements();
    if (!professionalSelect) return;

    professionalSelect.innerHTML = '<option value="">Selecione um profissional...</option>';
    professionals.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = `${prof.name} (${prof.specialty})`;
        professionalSelect.appendChild(option);
    });
};