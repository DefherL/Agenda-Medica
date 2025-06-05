// Verificação de autenticação
async function checkAuth(requiredType) {
    try {
        const currentUser = Parse.User.current();
        
        // Verificação adicional da sessão
        if (currentUser) {
            try {
                await currentUser.fetch();
                const valid = await Parse.User.become(currentUser.getSessionToken());
                if (!valid) throw new Error('Sessão inválida');
            } catch (e) {
                console.log('Sessão expirada ou inválida, fazendo logout...');
                await Parse.User.logOut();
                throw new Error('Sessão expirada');
            }
        }

        if (!currentUser) {
            console.log('Nenhum usuário logado, redirecionando...');
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = 'index.html';
            }
            return null;
        }

        const userType = currentUser.get('tipo');
        if (requiredType && userType !== requiredType) {
            console.log('Tipo de usuário incorreto, fazendo logout...');
            await Parse.User.logOut();
            window.location.href = 'index.html';
            return null;
        }
        
        // Atualiza sessionStorage
        sessionStorage.setItem('usuarioLogado', JSON.stringify({
            id: currentUser.id,
            tipo: userType,
            nome: currentUser.get('nome'),
            sessionToken: currentUser.getSessionToken()
        }));
        
        return {
            id: currentUser.id,
            tipo: userType,
            nome: currentUser.get('nome'),
            sessionToken: currentUser.getSessionToken()
        };
    } catch (e) {
        console.error("Erro na autenticação:", e);
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
        return null;
    }
}

// Logout
async function logout() {
    try {
        await Parse.User.logOut();
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair do sistema');
    }
}

// Verifica sessão a cada 5 minutos
setInterval(async () => {
    const user = Parse.User.current();
    if (user) {
        try {
            await Parse.User.become(user.getSessionToken());
            console.log('Sessão renovada com sucesso');
        } catch (e) {
            console.log('Falha ao renovar sessão, fazendo logout...');
            await logout();
        }
    }
}, 300000); // 5 minutos

// Exporta para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, logout };
}