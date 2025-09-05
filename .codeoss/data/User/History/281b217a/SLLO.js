/**
 * Módulo de Handlers: Funções para lidar com eventos do usuário.
 */
import { showModal, hideModal, renderAppointments } from './ui.js';

export const setupEventListeners = (fetcher, profile, API_URL, auth) => {
    
    // --- Seletores de Elementos ---
    // É mais seguro buscar os elementos dentro desta função,
    // pois temos certeza que o DOM já carregou.
    const formAddAppointment = document.getElementById('form-add-appointment');
    const appointmentList = document.getElementById('appointment-list');
    const logoutButton = document.getElementById('btn-logout');
    const modalCloseBtn = document.getElementById('modal-close-btn');

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
                
                // Recarrega a lista de agendamentos
                const appointments = await (await fetcher(`${API_URL}/appointments`)).json();
                renderAppointments(appointments, profile.role);
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
                        const appointments = await (await fetcher(`${API_URL}/appointments`)).json();
                        renderAppointments(appointments, profile.role);
                    } catch (error) {
                        showModal(error.message, true);
                    }
                }
            }
            // Adicionar lógica para 'open-record-btn' aqui se necessário
        });
    }
};