// Funções de UI
function openTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function mostrarCadastro(tipo) {
    const formLogin = document.getElementById(`form-${tipo}`);
    const formCadastro = document.getElementById(`cadastro-${tipo}`);
    formLogin.classList.toggle('hidden');
    formCadastro.classList.toggle('hidden');
}

// Cadastro de Paciente
document.getElementById('cadastro-paciente').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    
    try {
        // Validação dos campos
        if (!form[0].value || !form[1].value || !form[2].value || !form[3].value || !form[4].value) {
            alert("Preencha todos os campos!");
            return;
        }

        // Verifica se CPF já existe
        const Paciente = Parse.Object.extend('Paciente');
        const query = new Parse.Query(Paciente);
        query.equalTo('cpf', form[0].value);
        const exists = await query.first();
        
        if (exists) {
            alert("CPF já cadastrado!");
            return;
        }

        const user = new Parse.User();
        user.set('username', form[0].value);
        user.set('password', form[4].value);
        user.set('email', `${form[0].value}@paciente.com`);
        user.set('tipo', 'paciente');
        user.set('nome', form[1].value);
        user.set('cpf', form[0].value);
        user.set('telefone', form[2].value);
        user.set('plano', form[3].value === 'sim');

        const newUser = await user.signUp();
        console.log('Paciente cadastrado:', newUser);
        
        alert('Cadastro realizado com sucesso! Faça login.');
        form.reset();
        mostrarCadastro('paciente');
    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert(`Erro no cadastro: ${error.message}`);
    }
});

// Login do Paciente
document.getElementById('form-paciente').addEventListener('submit', async function(e) {
    e.preventDefault();
    const cpf = e.target[0].value;
    const senha = e.target[1].value;
    
    if (!cpf || !senha) {
        alert("Preencha CPF e senha!");
        return;
    }

    try {
        const user = await Parse.User.logIn(cpf, senha);
        console.log('Login bem-sucedido:', user);
        
        // Armazena dados básicos na sessionStorage
        sessionStorage.setItem('usuarioLogado', JSON.stringify({
            id: user.id,
            tipo: user.get('tipo'),
            nome: user.get('nome'),
            sessionToken: user.getSessionToken()
        }));
        
        window.location.href = 'paciente.html';
    } catch (error) {
        console.error('Erro no login:', error);
        alert(`Falha no login: ${error.message}`);
    }
});

// Cadastro de Médico
document.getElementById('cadastro-medico').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    
    try {
        // Validação dos campos
        if (!form[0].value || !form[1].value || !form[2].value || !form[3].value) {
            alert("Preencha todos os campos!");
            return;
        }

        // Verifica se CRM já existe
        const Medico = Parse.Object.extend('Medico');
        const query = new Parse.Query(Medico);
        query.equalTo('crm', form[0].value);
        const exists = await query.first();
        
        if (exists) {
            alert("CRM já cadastrado!");
            return;
        }

        const user = new Parse.User();
        user.set('username', form[0].value);
        user.set('password', form[3].value);
        user.set('email', `${form[0].value}@medico.com`);
        user.set('tipo', 'medico');
        user.set('nome', form[1].value);
        user.set('crm', form[0].value);
        user.set('especialidade', form[2].value);

        const newUser = await user.signUp();
        console.log('Médico cadastrado:', newUser);
        
        alert('Cadastro médico realizado! Faça login.');
        form.reset();
        mostrarCadastro('medico');
    } catch (error) {
        console.error('Erro no cadastro médico:', error);
        alert(`Erro no cadastro médico: ${error.message}`);
    }
});

// Login do Médico
document.getElementById('form-medico').addEventListener('submit', async function(e) {
    e.preventDefault();
    const crm = e.target[0].value;
    const senha = e.target[1].value;
    
    if (!crm || !senha) {
        alert("Preencha CRM e senha!");
        return;
    }

    try {
        const user = await Parse.User.logIn(crm, senha);
        console.log('Login médico bem-sucedido:', user);
        
        // Armazena dados básicos na sessionStorage
        sessionStorage.setItem('usuarioLogado', JSON.stringify({
            id: user.id,
            tipo: user.get('tipo'),
            nome: user.get('nome'),
            sessionToken: user.getSessionToken()
        }));
        
        window.location.href = 'medico.html';
    } catch (error) {
        console.error('Erro no login médico:', error);
        alert(`Falha no login médico: ${error.message}`);
    }
});

// Adiciona funções ao escopo global
window.openTab = openTab;
window.mostrarCadastro = mostrarCadastro;