document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.getElementById("toggle-password");
    const toggleIcon = document.getElementById("password-toggle-icon");
    const errorBox = document.getElementById("error-message");

    if (!loginForm) {
        console.error("Elemento #login-form não encontrado.");
        return;
    }

    // 🔁 Alternar visibilidade da senha
    toggleBtn.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";

        toggleIcon.src = isHidden
            ? "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/eye-slash.svg"
            : "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/eye.svg";
    });

    // 🔐 Lógica de envio do formulário
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.querySelector("#username").value.trim();
        const password = passwordInput.value.trim();

        if (errorBox) errorBox.style.display = "none";

        if (!username || !password) {
            showAlert("Preencha usuário e senha!", "error");
            return;
        }

        if (!validarEmailTelefone(username)) {
            showAlert("Informe um e-mail ou telefone válido!", "error");
            return;
        }

        showLoading(true);

        try {
            const senhaCriptografada = await encryptPassword(password);

            const response = await fetch("https://vistotrack.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: username,
                    senha: senhaCriptografada
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Erro ao fazer login.");
            }

            localStorage.setItem("access_token", data.access_token);

            if (data.role) {
                localStorage.setItem("user_role", data.role);
            }

            if (data.role === "user") {
                window.location.href = "../dashboard_condutor/";
            } else {
                window.location.href = "../dashboard_inspetor/";
            }

        } catch (error) {
            showAlert(error.message, "error");
            document.querySelector("#username").focus();
        } finally {
            showLoading(false);
        }
    });
});

// 🔐 Criptografa senha com SHA-256
async function encryptPassword(password) {
    try {
        if (typeof CryptoJS === "undefined") {
            throw new Error("CryptoJS não está definido. Verifique se foi importado no HTML.");
        }
        return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    } catch (error) {
        console.error("Erro ao criptografar a senha:", error);
        return null;
    }
}

// ✅ Valida email ou telefone brasileiro (10 ou 11 dígitos)
function validarEmailTelefone(input) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const telefoneRegex = /^\d{10,11}$/;
    return emailRegex.test(input) || telefoneRegex.test(input);
}


// 🔔 Exibe mensagens de erro
function showAlert(message, type = "error") {
    const box = document.getElementById("error-message");
    if (box) {
        box.textContent = message;
        box.style.display = "block";
    } else {
        alert(message);
    }
}

// ⏳ Indica carregamento no botão
function showLoading(isLoading) {
    const button = document.querySelector("#login-form button[type='submit']");
    if (button) {
        button.disabled = isLoading;
        button.textContent = isLoading ? "Aguarde..." : "Entrar";
    }
}
