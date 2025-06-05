// scripts/paciente.js
document.addEventListener('DOMContentLoaded', async function() {
    // Verifica autenticação
    const usuario = await checkAuth('paciente');
    if (!usuario) {
        window.location.href = 'index.html';
        return;
    }

    // Atualiza o nome do usuário na sidebar
    const paciente = Parse.User.current();
    if (paciente) {
        document.getElementById('username').textContent = paciente.get('nome');
    }

    // Menu toggle para mobile
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    document.body.appendChild(menuToggle);
    
    menuToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Carrega dados iniciais
    await carregarMedicosDisponiveis();
    await carregarAgendamentos();

    // Formulário de agendamento
    document.getElementById('form-agendamento').addEventListener('submit', async function(e) {
        e.preventDefault();
        await agendarConsulta();
    });

    // Atualiza responsividade
    function updateMenuToggle() {
        if (window.innerWidth <= 992) {
            menuToggle.style.display = 'flex';
        } else {
            menuToggle.style.display = 'none';
            document.querySelector('.sidebar').classList.remove('active');
        }
    }
    
    window.addEventListener('resize', updateMenuToggle);
    updateMenuToggle();
});

// Carrega médicos disponíveis para agendamento
async function carregarMedicosDisponiveis() {
    const selectMedico = document.getElementById('medico');
    selectMedico.innerHTML = '<option value="">Carregando médicos...</option>';

    try {
        // 1. Busca médicos ativos
        const Medico = Parse.Object.extend('Medico');
        const query = new Parse.Query(Medico);
        
        query.equalTo('ativo', true);
        query.include('user'); // Carrega dados do usuário relacionado
        query.ascending('user.nome'); // Ordena por nome
        
        const medicos = await query.find();

        // 2. Verifica resultados
        if (medicos.length === 0) {
            selectMedico.innerHTML = '<option value="">Nenhum médico disponível</option>';
            showAlert('warning', 'Nenhum médico cadastrado no sistema');
            return;
        }

        // 3. Preenche o select
        selectMedico.innerHTML = '<option value="">Selecione um médico</option>';
        medicos.forEach(medico => {
            const user = medico.get('user');
            const option = document.createElement('option');
            option.value = medico.id;
            option.textContent = `Dr. ${user.get('nome')} - ${medico.get('especialidade')}`;
            selectMedico.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
        selectMedico.innerHTML = '<option value="">Erro ao carregar</option>';
        showAlert('error', 'Falha ao carregar lista de médicos');
    }
}

// Agenda uma nova consulta
async function agendarConsulta() {
    const form = document.getElementById('form-agendamento');
    const tipoConsulta = document.getElementById('tipo-consulta').value;
    const dataConsulta = document.getElementById('data-consulta').value;
    const medicoId = document.getElementById('medico').value;

    // Validação
    if (!tipoConsulta || !dataConsulta || !medicoId) {
        showAlert('error', 'Preencha todos os campos!');
        return;
    }

    try {
        // 1. Busca o médico selecionado
        const Medico = Parse.Object.extend('Medico');
        const medico = await new Parse.Query(Medico).get(medicoId);

        // 2. Cria a consulta
        const Consulta = Parse.Object.extend('Consulta');
        const novaConsulta = new Consulta();
        
        novaConsulta.set('paciente', Parse.User.current());
        novaConsulta.set('medico', medico.get('user'));
        novaConsulta.set('tipo', tipoConsulta);
        novaConsulta.set('data', new Date(dataConsulta));
        novaConsulta.set('status', 'pendente');
        novaConsulta.set('pacienteNome', Parse.User.current().get('nome'));
        novaConsulta.set('medicoNome', medico.get('user').get('nome'));

        // 3. Salva no Back4App
        await novaConsulta.save();
        
        // 4. Feedback e atualização
        showAlert('success', 'Consulta agendada com sucesso!');
        form.reset();
        await carregarAgendamentos();

    } catch (error) {
        console.error('Erro ao agendar:', error);
        showAlert('error', `Erro: ${error.message}`);
    }
}

// Carrega os agendamentos do paciente
async function carregarAgendamentos() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    listaAgendamentos.innerHTML = '<p class="loading">Carregando agendamentos...</p>';

    try {
        const Consulta = Parse.Object.extend('Consulta');
        const query = new Parse.Query(Consulta);
        
        query.equalTo('paciente', Parse.User.current());
        query.greaterThanOrEqualTo('data', new Date());
        query.ascending('data');
        query.include('medico');
        
        const consultas = await query.find();

        listaAgendamentos.innerHTML = '';

        if (consultas.length === 0) {
            listaAgendamentos.innerHTML = '<p class="empty">Nenhuma consulta agendada</p>';
            return;
        }

        consultas.forEach(consulta => {
            const item = document.createElement('div');
            item.className = 'agendamento-item';
            
            const data = new Date(consulta.get('data'));
            const medico = consulta.get('medico');
            
            item.innerHTML = `
                <div class="agendamento-data">
                    ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div class="agendamento-info">
                    <h4>${consulta.get('tipo')}</h4>
                    <p>Com Dr. ${medico.get('nome')}</p>
                    <span class="status ${consulta.get('status')}">${consulta.get('status')}</span>
                </div>
                <button class="btn-cancel" onclick="cancelarAgendamento('${consulta.id}')">Cancelar</button>
            `;
            
            listaAgendamentos.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        listaAgendamentos.innerHTML = '<p class="error">Erro ao carregar</p>';
    }
}

// Cancela um agendamento
async function cancelarAgendamento(consultaId) {
    if (!confirm('Deseja realmente cancelar esta consulta?')) return;
    
    try {
        const Consulta = Parse.Object.extend('Consulta');
        const consulta = await new Parse.Query(Consulta).get(consultaId);
        
        await consulta.destroy();
        showAlert('success', 'Consulta cancelada com sucesso!');
        await carregarAgendamentos();
        
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        showAlert('error', 'Falha ao cancelar consulta');
    }
}

// Mostra alertas na tela
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    document.body.prepend(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Funções globais
window.cancelarAgendamento = cancelarAgendamento;