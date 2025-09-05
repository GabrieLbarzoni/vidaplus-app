/**
 * Módulo de Handlers: Funções para lidar com eventos do usuário.
 */
import { showModal, hideModal, renderAppointments } from './ui.js';

// Função auxiliar para recarregar e renderizar as consultas de forma centralizada.
// Isso evita a repetição de código e resolve o problema de cache.
const reloadAndRenderAppointments = async (fetcher, profile, API_URL) => {
    try {
        // Adicionado { cache: 'no-store' } para garantir que os dados mais recentes sejam buscados,
        // evitando que o navegador use uma resposta em cache que pode estar desatualizada.
        const response = await fetcher(`${API_URL}/appointments`, { cache: 'no-store' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao recarregar as consultas.');
        }
        const appointments = await response.json();
        renderAppointments(appointments, profile.role);
    } catch (error) {
        console.error('Erro ao recarregar consultas:', error);
        showModal('Não foi possível atualizar a lista de consultas.', true);
    }
};

export const setupEventListeners = (fetcher, profile, API_URL, auth) => {
    
    // --- Seletores de Elementos ---
    // É mais seguro buscar os elementos dentro desta função,
    // pois temos certeza que o DOM já carregou.
    const formAddAppointment = document.getElementById('form-add-appointment');
    const appointmentList = document.getElementById('appointment-list');
    const logoutButton = document.getElementById('btn-logout');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const medicalRecordModal = document.getElementById('medical-record-modal');
    const medicalRecordForm = document.getElementById('medical-record-form');
    const recordModalCloseBtn = document.getElementById('record-modal-close-btn');

    // --- Event Listeners ---

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => auth.signOut());
    }

    // Fechar Modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideModal);
    }

    // Agendar Consulta (só existe para pacientes)
    if (formAddAppointment) {
        formAddAppointment.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formAddAppointment);
            const appointmentData = Object.fromEntries(formData.entries());
            appointmentData.patientId = profile.profileId; // O paciente é o próprio usuário

            try {
                const response = await fetcher(`${API_URL}/appointments`, {
                    method: 'POST',
                    body: JSON.stringify(appointmentData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Erro ao agendar consulta.");
                
                showModal('Consulta agendada com sucesso!');
                formAddAppointment.reset();
                
                // Recarrega a lista de agendamentos usando a nova função
                await reloadAndRenderAppointments(fetcher, profile, API_URL);
            } catch (error) {
                showModal(error.message, true);
            }
        });
    }

    // Ações na Lista de Consultas (Cancelar / Prontuário)
    if (appointmentList) {
        appointmentList.addEventListener('click', async (e) => {
            const target = e.target;

            // Botão de Cancelar
            if (target.classList.contains('cancel-appointment-btn')) {
                const appointmentId = target.dataset.id;
                if (confirm('Tem certeza que deseja cancelar esta consulta?')) {
                    try {
                        const response = await fetcher(`${API_URL}/appointments/${appointmentId}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error((await response.json()).message || 'Erro ao cancelar.');
                        
                        showModal('Consulta cancelada com sucesso!');
                        await reloadAndRenderAppointments(fetcher, profile, API_URL);
                    } catch (error) {
                        showModal(error.message, true);
                    }
                }
            }

            // Botão de Abrir Prontuário (apenas para profissionais)
            if (target.classList.contains('open-record-btn')) {
                const recordPatientName = document.getElementById('record-patient-name');
                const recordAppointmentId = document.getElementById('record-appointment-id');
                const medicalRecordText = document.getElementById('medical-record-text');

                // O `li` mais próximo contém o texto do prontuário no seu dataset
                const li = target.closest('li');
                const medicalRecord = li.dataset.medicalRecord;

                // Preenche o modal com os dados da consulta
                recordAppointmentId.value = target.dataset.id;
                recordPatientName.textContent = target.dataset.patientName;
                medicalRecordText.value = medicalRecord;
                
                // Exibe o modal
                if (medicalRecordModal) {
                    medicalRecordModal.classList.remove('hidden');
                }
            }
        });
    }

    // Fechar Modal de Prontuário
    if (recordModalCloseBtn) {
        recordModalCloseBtn.addEventListener('click', () => {
            if (medicalRecordModal) medicalRecordModal.classList.add('hidden');
        });
    }

    // Salvar Prontuário
    if (medicalRecordForm) {
        medicalRecordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const appointmentId = document.getElementById('record-appointment-id').value;
            const recordText = document.getElementById('medical-record-text').value;

            try {
                const response = await fetcher(`${API_URL}/appointments/${appointmentId}/record`, {
                    method: 'POST',
                    body: JSON.stringify({ recordText })
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Erro ao salvar prontuário.');

                showModal('Prontuário salvo com sucesso!');
                if (medicalRecordModal) medicalRecordModal.classList.add('hidden');
                
                // Recarrega a lista para refletir a mudança, garantindo dados novos
                await reloadAndRenderAppointments(fetcher, profile, API_URL);
            } catch (error) {
                showModal(error.message, true);
            }
        });
    }
};