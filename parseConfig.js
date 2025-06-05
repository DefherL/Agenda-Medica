// Configuração do Back4App (Parse Server)
(function() {
    // Inicializa o Parse
    Parse.initialize(
        "bOFYz8xlcuDmnYIAKE06FpKMDh4zZXjwUQk3HgeD", // App ID
        "Ct8Ktu8KYcruwQALT7FOkvAZSkIhUXfO2IcB2uCU"  // JavaScript Key
    );
    Parse.serverURL = 'https://parseapi.back4app.com/';
    
    // Verificação de conexão
    console.log('Parse configurado com sucesso');
    console.log('App ID:', Parse.applicationId);
    console.log('Server URL:', Parse.serverURL);
    
    // Adiciona Parse ao escopo global para depuração
    window.Parse = Parse;
})();