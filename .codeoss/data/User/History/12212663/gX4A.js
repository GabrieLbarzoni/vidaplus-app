document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const loginForm = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Se o usuário já estiver logado, redireciona para a página principal
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = '/index.html';
        }
    });

    const showError = (message) => {
        errorMessage.firstElementChild.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    // Evento de Login
    btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideError();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, preencha o email e a senha.');
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // O onAuthStateChanged vai cuidar do redirecionamento
            })
            .catch((error) => {
                console.error("Erro de login:", error);
                showError('Email ou senha inválidos.');
            });
    });

    // Evento de Cadastro
    btnSignup.addEventListener('click', (e) => {
        e.preventDefault();
        hideError();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, preencha o email e a senha para se cadastrar.');
            return;
        }
        if (password.length < 6) {
            showError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Após o cadastro, o usuário é logado automaticamente.
                // Redireciona para a página de preenchimento de perfil.
                window.location.href = '/profile.html';
            })
            .catch((error) => {
                console.error("Erro de cadastro:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showError('Este email já está em uso.');
                } else {
                    showError('Ocorreu um erro ao tentar se cadastrar.');
                }
            });
    });
});