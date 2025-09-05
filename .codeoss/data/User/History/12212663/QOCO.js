document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    // GUARDA DE AUTENTICAÇÃO:
    // Se um usuário já logado tentar acessar a página de login,
    // ele é redirecionado para o painel principal.
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = '/index.html';
        }
    });

    const loginForm = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    const showError = (message) => {
        errorMessage.firstElementChild.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    // Define a persistência da autenticação. 'local' é o padrão, mas ser explícito ajuda a garantir o comportamento.
    // A sessão do usuário persistirá mesmo que o navegador seja fechado.
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            // Os listeners de evento só são adicionados DEPOIS que a persistência foi configurada.

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
                    .then(() => {
                        // Redirecionamento para a página principal após o login.
                        window.location.href = '/index.html';
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
                    .then(() => {
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
        })
        .catch((error) => {
            console.error("Erro ao configurar persistência da autenticação:", error);
            showError("Ocorreu um erro de configuração. Por favor, recarregue a página.");
        });
});