// IMPORTANTE: Deixe esta linha exatamente assim por enquanto!
const API_URL = 'URL_DA_SUA_API_AQUI';

document.addEventListener('DOMContentLoaded', () => {
    // Seletores do DOM (idênticos ao original)
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

    // Funções de Renderização (buscam dados da API real)
    const renderPatients = async () => {
        try {
            const response = await fetch(`${API_URL}/patients`);
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

    const renderAppointments = async () => {
        try {
            const response = await fetch(`${API_URL}/appointments`);
            const appointments = await response.json();
            appointmentList.innerHTML = '';
            if (appointments.length === 0) {
                appointmentList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma consulta agendada.</li>`;
            } else {
                appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
                // Em um app real, faríamos um "join" no backend para buscar os nomes
                // Aqui, vamos simular essa busca para fins de exibição
                const patientsResponse = await fetch(`${API_URL}/patients`);
                const patients = await patientsResponse.json();
                const professionalsResponse = await fetch(`${API_URL}/professionals`);
                const professionals = await professionalsResponse.json();

                appointments.forEach(app => {
                    const patient = patients.find(p => p.id === app.patientId);
                    const professional = professionals.find(p => p.id === app.professionalId);
                    const li = document.createElement('li');
                    li.className = 'p-2 bg-gray-50 rounded border';
                    const formattedDate = new Date(app.date).toLocaleString('pt-BR');
                    li.innerHTML = `
                        <div class="font-semibold">${patient ? patient.name : 'Paciente não encontrado'}</div>
                        <div class="text-sm text-gray-600">Com: ${professional ? professional.name : 'Profissional não encontrado'}</div>
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

    const populateProfessionalSelect = async () => {
        try {
            const response = await fetch(`${API_URL}/professionals`);
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

    formAddPatient.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formAddPatient);
        const patientData = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_URL}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showModal('Paciente cadastrado com sucesso!');
            formAddPatient.reset();
            renderPatients();
        } catch (error) {
            showModal(error.message, true);
        }
    });

    formAddAppointment.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formAddAppointment);
        const appointmentData = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showModal('Consulta agendada com sucesso!');
            formAddAppointment.reset();
            renderAppointments();
        } catch (error) {
            showModal(error.message, true);
        }
    });

    modalCloseBtn.addEventListener('click', hideModal);

    const initializeApp = () => {
        renderPatients();
        populateProfessionalSelect();
        renderAppointments();
    };

    initializeApp();
});
```

---

### **Passos Finais para Ativar o Site**

Agora, os dois últimos comandos para colocar sua aplicação no ar.

#### **Passo 6: Deploy Inicial (Publicar Tudo)**

Com os arquivos `index.html` e `app.js` salvos na pasta `public`, volte para o terminal do Cloud Shell (ele deve estar na pasta raiz do seu projeto, `sghss-vidaplus` ou similar).

Execute o seguinte comando:

```bash
firebase deploy
```

O Firebase irá publicar seu back-end (Cloud Functions) e seu front-end (Hosting). Ao final, ele te dará duas URLs. A que nos interessa agora é a **Function URL**. Ela será parecida com isto:

`Function URL: https://us-central1-seu-projeto-id.cloudfunctions.net/api`

**Copie essa URL!**

#### **Passo 7: Conexão Final e Ativação do Site**

1.  Volte para o código na sua IDE online e abra o arquivo `public/app.js`.
2.  Na primeira linha, substitua `'URL_DA_SUA_API_AQUI'` pela **Function URL** que você acabou de copiar. A linha deve ficar assim:

    ```javascript
    const API_URL = 'https://us-central1-seu-projeto-id.cloudfunctions.net/api';
    ```

3.  Salve o arquivo `app.js`.
4.  Agora, execute o último comando no terminal para publicar apenas a atualização do front-end:

    ```bash
    firebase deploy --only hosting