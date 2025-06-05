// scripts/medico.js
document.addEventListener('DOMContentLoaded', async function() {
    const usuario = await checkAuth('medico');
    if (!usuario) return;

    // Atualiza os dados na sidebar
    const medico = Parse.User.current();
    if (medico) {
        document.getElementById('medico-nome').textContent = medico.get('nome');
        document.getElementById('medico-especialidade').textContent = medico.get('especialidade');
    }

    // Carrega consultas do dia atual
    await carregarConsultasDoDia(new Date());

    // Navegação entre dias
    document.getElementById('prev-day').addEventListener('click', async () => {
        const currentDate = new Date(document.getElementById('current-date').textContent);
        currentDate.setDate(currentDate.getDate() - 1);
        await carregarConsultasDoDia(currentDate);
    });

    document.getElementById('next-day').addEventListener('click', async () => {
        const currentDate = new Date(document.getElementById('current-date').textContent);
        currentDate.setDate(currentDate.getDate() + 1);
        await carregarConsultasDoDia(currentDate);
    });
});

// Carrega consultas do dia específico (ATUALIZADO)
async function carregarConsultasDoDia(date) {
    const listaConsultas = document.getElementById('lista-consultas');
    listaConsultas.innerHTML = '<p class="loading">Carregando consultas...</p>';

    try {
        // Formata a data para exibição
        document.getElementById('current-date').textContent = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        // Consulta otimizada
        const Consulta = Parse.Object.extend('Consulta');
        const query = new Parse.Query(Consulta);
        
        query.equalTo('medico', Parse.User.current());
        query.greaterThanOrEqualTo('data', new Date(date.setHours(0, 0, 0)));
        query.lessThan('data', new Date(date.setHours(23, 59, 59)));
        query.include('paciente');
        query.ascending('data');

        const consultas = await query.find();

        listaConsultas.innerHTML = '';

        if (consultas.length === 0) {
            listaConsultas.innerHTML = '<p class="empty">Nenhuma consulta agendada</p>';
            return;
        }

        // Exibe cada consulta
        consultas.forEach(consulta => {
            const item = document.createElement('div');
            item.className = 'consulta-item';
            
            const data = new Date(consulta.get('data'));
            const paciente = consulta.get('paciente');

            item.innerHTML = `
                <div class="consulta-horario">
                    ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="consulta-info">
                    <h4>${paciente.get('nome')}</h4>
                    <p>${consulta.get('tipo')}</p>
                    <span class="status ${consulta.get('status')}">${consulta.get('status')}</span>
                </div>
                <div class="consulta-actions">
                    <button class="btn-confirm" onclick="confirmarConsulta('${consulta.id}')">
                        Confirmar
                    </button>
                    <button class="btn-cancel" onclick="cancelarConsulta('${consulta.id}')">
                        Cancelar
                    </button>
                </div>
            `;
            
            listaConsultas.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar consultas:', error);
        listaConsultas.innerHTML = '<p class="error">Erro ao carregar</p>';
    }
}

// Confirma uma consulta (ATUALIZADO)
async function confirmarConsulta(consultaId) {
    try {
        const Consulta = Parse.Object.extend('Consulta');
        const consulta = await new Parse.Query(Consulta).get(consultaId);
        
        consulta.set('status', 'confirmada');
        await consulta.save();
        
        showAlert('success', 'Consulta confirmada!');
        await carregarConsultasDoDia(new Date(consulta.get('data')));
        
    } catch (error) {
        console.error('Erro ao confirmar:', error);
        showAlert('error', 'Falha ao confirmar consulta');
    }
}

// Cancela uma consulta (ATUALIZADO)
async function cancelarConsulta(consultaId) {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;
    
    try {
        const Consulta = Parse.Object.extend('Consulta');
        const consulta = await new Parse.Query(Consulta).get(consultaId);
        
        consulta.set('status', 'cancelada');
        await consulta.save();
        
        showAlert('success', 'Consulta cancelada!');
        await carregarConsultasDoDia(new Date(consulta.get('data')));
        
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        showAlert('error', 'Falha ao cancelar consulta');
    }
}

// Mostra alertas (FUNÇÃO NOVA)
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
window.confirmarConsulta = confirmarConsulta;
window.cancelarConsulta = cancelarConsulta;