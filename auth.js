document.addEventListener('DOMContentLoaded', function() {
  // Chave do administrador para registro
  const ADMIN_KEY = '123456789'; // Chave de administrador que será usada no processo de registro

  // Manipula a alternância do checkbox de administrador
  const isAdminCheckbox = document.getElementById('isAdmin'); // Captura o checkbox de administrador
  const adminKeyGroup = document.querySelector('.admin-key-group'); // Captura o grupo de entrada da chave de administrador
  if (isAdminCheckbox && adminKeyGroup) {
    // Escuta a mudança no checkbox de administrador
    isAdminCheckbox.addEventListener('change', function() {
      adminKeyGroup.style.display = this.checked ? 'block' : 'none'; // Exibe ou oculta o campo de chave de administrador dependendo do checkbox
      const adminKeyInput = document.getElementById('adminKey'); // Captura o campo de chave de administrador
      if (!this.checked && adminKeyInput) {
        adminKeyInput.value = ''; // Limpa o campo de chave de administrador caso o checkbox não esteja marcado
      }
    });
  }

  // Máscara para o campo de telefone
  const phoneInput = document.getElementById('phone'); // Captura o campo de telefone
  if (phoneInput) {
    // Escuta a entrada de dados no campo de telefone
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Formata o número de telefone com parênteses
        value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Adiciona o hífen ao número de telefone
      }
      e.target.value = value; // Atualiza o valor do campo com o número formatado
    });
  }

  // Manipula o formulário de registro
  const registerForm = document.getElementById('registerForm'); // Captura o formulário de registro
  if (registerForm) {
    // Escuta o envio do formulário de registro
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Previne o envio padrão do formulário

      // Captura os dados inseridos nos campos do formulário
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const isAdmin = document.getElementById('isAdmin').checked; // Verifica se o usuário quer ser administrador
      const adminKey = document.getElementById('adminKey')?.value; // Captura a chave de administrador, caso tenha sido fornecida

      // Verifica se as senhas não coincidem
      if (password !== confirmPassword) {
        showError('As senhas não coincidem'); // Exibe uma mensagem de erro se as senhas não coincidirem
        return;
      }

      // Valida a chave de administrador, se o usuário estiver tentando se registrar como administrador
      if (isAdmin && adminKey !== ADMIN_KEY) {
        showError('Chave de administrador inválida'); // Exibe erro se a chave de administrador for inválida
        return;
      }

      // Recupera os usuários existentes ou inicializa um array vazio
      const users = JSON.parse(localStorage.getItem('users')) || [];

      // Verifica se o e-mail já está registrado
      if (users.some(user => user.email === email)) {
        showError('Este email já está cadastrado'); // Exibe erro se o e-mail já estiver cadastrado
        return;
      }

      // Adiciona um novo usuário com os dados inseridos, incluindo o número de telefone
      users.push({
        username,
        email,
        phone, // Inclui o número de telefone
        password,
        isAdmin: isAdmin && adminKey === ADMIN_KEY // Define como administrador apenas se a chave for válida
      });

      // Salva os usuários no localStorage
      localStorage.setItem('users', JSON.stringify(users));

      // Exibe uma mensagem de sucesso e redireciona para a página de login
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    });
  }

  // Manipula o formulário de login
  const loginForm = document.getElementById('loginForm'); // Captura o formulário de login
  if (loginForm) {
    // Escuta o envio do formulário de login
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Previne o envio padrão do formulário

      // Captura o e-mail e a senha inseridos
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Recupera os usuários registrados do localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];

      // Procura o usuário com o e-mail e senha fornecidos
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        // Armazena o usuário logado e seu status de administrador no localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        }));

        alert('Login realizado com sucesso!'); // Exibe uma mensagem de sucesso
        window.location.href = 'index.html'; // Redireciona para a página inicial
      } else {
        showError('Email ou senha incorretos'); // Exibe erro se o e-mail ou senha estiverem incorretos
      }
    });
  }

  // Função para exibir mensagens de erro
  function showError(message) {
    let errorDiv = document.querySelector('.error-message'); // Captura a área de mensagens de erro
    if (!errorDiv) {
      errorDiv = document.createElement('div'); // Cria o elemento de erro se ele não existir
      errorDiv.className = 'error-message'; // Define a classe do elemento
      document.querySelector('.auth-form').insertBefore(errorDiv, document.querySelector('.auth-form').firstChild); // Insere o elemento no início do formulário
    }
    errorDiv.style.display = 'block'; // Exibe a mensagem de erro
    errorDiv.textContent = message; // Define o conteúdo da mensagem de erro
  }

  // Função para verificar se o usuário está logado
  function checkAuth() {
    const currentUser = localStorage.getItem('currentUser'); // Recupera o usuário logado
    // Se não estiver logado e não for na página de login ou registro, redireciona para a página de login
    if (!currentUser && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
      window.location.href = 'login.html';
    }
  }

  // Descomente a linha abaixo para forçar a autenticação
  // checkAuth();
});

// Função para logout
function logout() {
  localStorage.removeItem('currentUser'); // Remove o usuário logado do localStorage
  window.location.href = 'index.html'; // Redireciona para a página inicial
}

// Nova função para verificar se o usuário atual é administrador
function isCurrentUserAdmin() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Recupera o usuário logado
  return currentUser?.isAdmin === true; // Retorna verdadeiro se o usuário for administrador
}
