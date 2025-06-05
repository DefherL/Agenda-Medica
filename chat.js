let chatAberto = false;
let chatAtivo = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await carregarHistoricoChat();
    
    // Adiciona evento para fechar com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && chatAberto) {
            fecharChat();
        }
    });
});

// Carrega histórico do chat
async function carregarHistoricoChat() {
    const chatMensagens = document.getElementById('chat-mensagens');
    chatMensagens.innerHTML = '<p class="loading-chat">Carregando mensagens...</p>';
    
    try {
        const Chat = Parse.Object.extend('Chat');
        const query = new Parse.Query(Chat);
        
        query.equalTo('pacienteId', Parse.User.current().id);
        query.ascending('createdAt');
        query.limit(100);
        
        const mensagens = await query.find();
        
        chatMensagens.innerHTML = '';
        
        if (mensagens.length === 0) {
            chatMensagens.innerHTML = '<p class="empty-chat">Nenhuma mensagem ainda. Inicie a conversa!</p>';
            return;
        }
        
        mensagens.forEach(msg => {
            renderMensagem({
                texto: msg.get('texto'),
                tipo: msg.get('tipo'),
                hora: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });
        
        rolarParaUltimaMensagem();
    } catch (error) {
        console.error('Erro ao carregar chat:', error);
        chatMensagens.innerHTML = '<p class="error-chat">Erro ao carregar mensagens</p>';
    }
}

// Abre o chat
function abrirChat() {
    if (chatAberto) return;
    
    document.getElementById('chat-modal').style.display = 'flex';
    document.getElementById('chat-input').focus();
    chatAberto = true;
    
    rolarParaUltimaMensagem();
    iniciarChatAtendente();
}

// Fecha o chat
function fecharChat() {
    document.getElementById('chat-modal').style.display = 'none';
    chatAberto = false;
    
    if (chatAtivo) {
        clearInterval(chatAtivo);
        chatAtivo = null;
    }
}

// Rola para a última mensagem
function rolarParaUltimaMensagem() {
    const chatMensagens = document.getElementById('chat-mensagens');
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

// Verifica novas mensagens do atendente
function iniciarChatAtendente() {
    if (!chatAtivo) {
        chatAtivo = setInterval(async () => {
            try {
                const Chat = Parse.Object.extend('Chat');
                const query = new Parse.Query(Chat);
                
                query.equalTo('pacienteId', Parse.User.current().id);
                query.equalTo('lida', false);
                query.equalTo('tipo', 'atendente');
                
                const mensagensNaoLidas = await query.find();
                
                if (mensagensNaoLidas.length > 0) {
                    mensagensNaoLidas.forEach(async msg => {
                        renderMensagem({
                            texto: msg.get('texto'),
                            tipo: 'atendente',
                            hora: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        });
                        
                        msg.set('lida', true);
                        await msg.save();
                    });
                    
                    rolarParaUltimaMensagem();
                }
            } catch (error) {
                console.error('Erro ao verificar mensagens:', error);
            }
        }, 3000);
    }
}

// Envia mensagem
async function enviarMensagem() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    
    if (texto === '') return;
    
    try {
        // Adiciona mensagem do usuário
        const Chat = Parse.Object.extend('Chat');
        const novaMensagem = new Chat();
        
        novaMensagem.set('pacienteId', Parse.User.current().id);
        novaMensagem.set('texto', texto);
        novaMensagem.set('tipo', 'usuario');
        novaMensagem.set('lida', true);
        
        await novaMensagem.save();
        
        renderMensagem({
            texto: texto,
            tipo: 'usuario',
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        
        input.value = '';
        rolarParaUltimaMensagem();
        
        // Simula resposta do atendente
        setTimeout(async () => {
            const respostaAtendente = new Chat();
            
            respostaAtendente.set('pacienteId', Parse.User.current().id);
            respostaAtendente.set('texto', 'Recebemos sua mensagem. Um atendente responderá em breve.');
            respostaAtendente.set('tipo', 'atendente');
            respostaAtendente.set('lida', false);
            
            await respostaAtendente.save();
        }, 1000);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem: ' + error.message);
    }
}

// Renderiza uma mensagem
function renderMensagem(mensagem) {
    const chatMensagens = document.getElementById('chat-mensagens');
    
    if (chatMensagens.querySelector('.loading-chat, .empty-chat, .error-chat')) {
        chatMensagens.innerHTML = '';
    }
    
    const divMensagem = document.createElement('div');
    divMensagem.className = `mensagem ${mensagem.tipo}`;
    divMensagem.innerHTML = `
        <p>${mensagem.texto}</p>
        <span class="hora-mensagem">${mensagem.hora}</span>
    `;
    
    chatMensagens.appendChild(divMensagem);
}

// Eventos
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        enviarMensagem();
    }
});

document.getElementById('chat-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        fecharChat();
    }
});

// Exporta funções para uso global
window.abrirChat = abrirChat;
window.fecharChat = fecharChat;
window.enviarMensagem = enviarMensagem;