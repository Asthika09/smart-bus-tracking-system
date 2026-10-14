import { useState } from "react";

function Login({
  role,
  onRegister,
  onLoginSuccess,
  onBack
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const isStudent = role === "student";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      let loginData;

      // =========================
      // STUDENT LOGIN
      // =========================
      if (isStudent) {
        loginData = {
          name,
          email,
          password,
          role: "student"
        };
      }

      // =========================
      // DRIVER LOGIN
      // =========================
      else {
        loginData = {
          name,
          busNumber,
          password,
          role: "driver"
        };
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(loginData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Login failed"
        );
        return;
      }

      // =========================
      // SAVE LOGIN DATA
      // =========================

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setMessage("Login successful!");

      // =========================
      // GO TO DASHBOARD
      // =========================

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        "Cannot connect to server"
      );
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.loginBox}>

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={onBack}
          style={styles.backButton}
        >
          ← Back
        </button>

        {/* ICON */}
        <div style={styles.icon}>
          {isStudent ? "🎓" : "👨‍✈️"}
        </div>

        {/* TITLE */}
        <h1 style={styles.title}>
          {isStudent
            ? "Student Login"
            : "Driver Login"}
        </h1>

        <p style={styles.subtitle}>
          {isStudent
            ? "Login to track your bus"
            : "Login to manage your bus trip"}
        </p>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>

          {/* NAME */}
          <div style={styles.field}>

            <label style={styles.label}>
              {isStudent
                ? "Student Name"
                : "Driver Name"}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder={
                isStudent
                  ? "Enter your name"
                  : "Enter driver name"
              }
              style={styles.input}
              required
            />

          </div>

          {/* STUDENT EMAIL */}
          {isStudent && (
            <div style={styles.field}>

              <label style={styles.label}>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                style={styles.input}
                required
              />

            </div>
          )}

          {/* DRIVER BUS NUMBER */}
          {!isStudent && (
            <div style={styles.field}>

              <label style={styles.label}>
                Bus Number
              </label>

              <input
                type="text"
                value={busNumber}
                onChange={(e) =>
                  setBusNumber(e.target.value)
                }
                placeholder="Example: BUS-001"
                style={styles.input}
                required
              />

            </div>
          )}

          {/* PASSWORD */}
          <div style={styles.field}>

            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              style={styles.input}
              required
            />

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            style={styles.loginButton}
          >
            Login
          </button>

        </form>

        {/* MESSAGE */}
        {message && (
          <p
            style={{
              ...styles.message,
              color:
                message === "Login successful!"
                  ? "green"
                  : "red"
            }}
          >
            {message}
          </p>
        )}

        {/* REGISTER - STUDENT ONLY */}
        {isStudent && (
          <p style={styles.registerText}>
            Don't have an account?{" "}

            <button
              type="button"
              onClick={onRegister}
              style={styles.registerButton}
            >
              Register
            </button>

          </p>
        )}

      </div>

    </div>
  );
}


/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background:
      "linear-gradient(135deg, #eef6ff, #f8fbff)"
  },

  loginBox: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "20px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.10)"
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2878ff",
    fontSize: "15px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "15px"
  },

  icon: {
    width: "70px",
    height: "70px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#eaf3ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "35px"
  },

  title: {
    textAlign: "center",
    margin: "0",
    color: "#172033",
    fontSize: "28px"
  },

  subtitle: {
    textAlign: "center",
    color: "#718096",
    marginTop: "8px",
    marginBottom: "25px"
  },

  field: {
    marginBottom: "18px"
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#374151",
    fontWeight: "600",
    fontSize: "14px"
  },

  input: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d8dee8",
    borderRadius: "9px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box"
  },

  loginButton: {
    width: "100%",
    padding: "14px",
    marginTop: "5px",
    border: "none",
    borderRadius: "9px",
    background: "#2878ff",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  message: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px"
  },

  registerText: {
    textAlign: "center",
    marginTop: "22px",
    color: "#718096",
    fontSize: "14px"
  },

  registerButton: {
    border: "none",
    background: "transparent",
    color: "#2878ff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  }

};

export default Login;