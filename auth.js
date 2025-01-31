document.addEventListener('DOMContentLoaded', function() {
  // Admin key for registration
  const ADMIN_KEY = '123456789'; // Updated admin key

  // Handle admin checkbox toggle
  const isAdminCheckbox = document.getElementById('isAdmin');
  const adminKeyGroup = document.querySelector('.admin-key-group');
  if (isAdminCheckbox && adminKeyGroup) {
    isAdminCheckbox.addEventListener('change', function() {
      adminKeyGroup.style.display = this.checked ? 'block' : 'none';
      const adminKeyInput = document.getElementById('adminKey');
      if (!this.checked && adminKeyInput) {
        adminKeyInput.value = '';
      }
    });
  }

  // Phone number mask
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      }
      e.target.value = value;
    });
  }

  // Handle Registration
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const isAdmin = document.getElementById('isAdmin').checked;
      const adminKey = document.getElementById('adminKey')?.value;
      
      if (password !== confirmPassword) {
        showError('As senhas não coincidem');
        return;
      }

      // Validate admin key if trying to register as admin
      if (isAdmin && adminKey !== ADMIN_KEY) {
        showError('Chave de administrador inválida');
        return;
      }
      
      // Get existing users or initialize empty array
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Check if email already exists
      if (users.some(user => user.email === email)) {
        showError('Este email já está cadastrado');
        return;
      }
      
      // Add new user with phone number
      users.push({
        username,
        email,
        phone, // Include phone number in user data
        password,
        isAdmin: isAdmin && adminKey === ADMIN_KEY // Only set as admin if key is correct
      });
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      
      // Redirect to login
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    });
  }
  
  // Handle Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Find user
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Store logged in user with admin status
        localStorage.setItem('currentUser', JSON.stringify({
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        }));
        
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
      } else {
        showError('Email ou senha incorretos');
      }
    });
  }
  
  // Error handling function
  function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      document.querySelector('.auth-form').insertBefore(errorDiv, document.querySelector('.auth-form').firstChild);
    }
    errorDiv.style.display = 'block';
    errorDiv.textContent = message;
  }
  
  // Check if user is logged in
  function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
      window.location.href = 'login.html';
    }
  }
  
  // Uncomment the following line to enforce authentication
  // checkAuth();
});

// Update the logout function to handle admin status
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// New function to check if current user is admin
function isCurrentUserAdmin() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  return currentUser?.isAdmin === true;
}