// const API_URL = "http://localhost:8080/api/auth";

// async function register() {
//   const name = document.getElementById("name").value;
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   const response = await fetch(`${API_URL}/register`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ name, email, password })
//   });

//   if (response.ok) {
//     alert("Registration successful");
//     window.location.href = "login.html";
//   } else {
//     alert("Registration failed");
//   }
// }

// async function login() {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   const response = await fetch(`${API_URL}/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password })
//   });

//   const result = await response.text();

//   if (result === "LOGIN_SUCCESS") {
//     alert("Login successful");
//     window.location.href = "index.html";
//   } else {
//     alert("Invalid credentials");
//   }
// }

// ==============================
// SyncSpace Authentication Logic
// ==============================

const API_BASE = "http://localhost:8080/api/auth";

// -------- REGISTER --------
async function register() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        alert("All fields are required");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.text();

        if (result === "REGISTER_SUCCESS") {
            alert("Registration successful. Please login.");
        } else if (result === "EMAIL_ALREADY_EXISTS") {
            alert("Email already exists. Try logging in.");
        } else {
            alert("Registration failed");
        }

    } catch (error) {
        console.error("Register error:", error);
        alert("Backend not reachable");
    }
}

// -------- LOGIN --------
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Email and password required");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const token = await response.text();

        // JWT tokens always start with "ey"
        if (token.startsWith("ey")) {
            localStorage.setItem("jwt", token);
            localStorage.setItem("loggedIn", "true");

            alert("Login successful");
            window.location.href = "index.html";
        } else {
            alert("Invalid email or password");
        }

    } catch (error) {
        console.error("Login error:", error);
        alert("Backend not reachable");
    }
}

// -------- LOGOUT --------
function logout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}

// -------- AUTH CHECK (OPTIONAL) --------
// Call this at top of index.html if needed
function checkAuth() {
    if (!localStorage.getItem("jwt")) {
        window.location.href = "login.html";
    }
}
