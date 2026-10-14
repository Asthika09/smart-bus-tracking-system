
import { useState } from "react";

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setMessage("");
  };

  // Password rules
  const passwordRules = {
    length: formData.password.length >= 8,
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password)
  };

  const passwordValid =
    passwordRules.length &&
    passwordRules.number &&
    passwordRules.special;

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    // Password match
    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setMessage("Passwords do not match");
      return;
    }

    // Password validation
    if (!passwordValid) {
      setMessage(
        "Please follow all password rules"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: "student"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
          "Registration failed"
        );
        return;
      }

      setSuccess(true);

      setMessage(
        "Registration successful!"
      );

      // Clear form
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setMessage(
        "Cannot connect to server"
      );
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.registerBox}>

        {/* Back / Login */}
        <button
          type="button"
          onClick={onLogin}
          style={styles.backButton}
        >
          ← Back to Login
        </button>

        {/* Icon */}
        <div style={styles.icon}>
          🎓
        </div>

        {/* Heading */}
        <h1 style={styles.title}>
          Create Student Account
        </h1>

        <p style={styles.subtitle}>
          Register to track your bus
        </p>

        <form onSubmit={handleRegister}>

          {/* NAME */}
          <div style={styles.field}>
            <label style={styles.label}>
              Student Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              style={styles.input}
              required
            />
          </div>


          {/* PHONE */}
          <div style={styles.field}>
            <label style={styles.label}>
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              pattern="[0-9]{10}"
              maxLength="10"
              style={styles.input}
              required
            />
          </div>


          {/* EMAIL */}
          <div style={styles.field}>
            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>


          {/* PASSWORD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              style={styles.input}
              required
            />
          </div>


          {/* PASSWORD RULES */}
          <div style={styles.rulesBox}>

            <p style={styles.rulesTitle}>
              Password must contain:
            </p>

            <p
              style={{
                ...styles.rule,
                color: passwordRules.length
                  ? "green"
                  : "#777"
              }}
            >
              {passwordRules.length
                ? "✓"
                : "○"}{" "}
              At least 8 characters
            </p>

            <p
              style={{
                ...styles.rule,
                color: passwordRules.number
                  ? "green"
                  : "#777"
              }}
            >
              {passwordRules.number
                ? "✓"
                : "○"}{" "}
              One number
            </p>

            <p
              style={{
                ...styles.rule,
                color: passwordRules.special
                  ? "green"
                  : "#777"
              }}
            >
              {passwordRules.special
                ? "✓"
                : "○"}{" "}
              One special character
            </p>

          </div>


          {/* CONFIRM PASSWORD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={
                formData.confirmPassword
              }
              onChange={handleChange}
              placeholder="Confirm your password"
              style={styles.input}
              required
            />
          </div>


          {/* REGISTER BUTTON */}
          <button
            type="submit"
            style={styles.registerButton}
          >
            Create Account
          </button>

        </form>


        {/* MESSAGE */}
        {message && (
          <p
            style={{
              ...styles.message,
              color: success
                ? "green"
                : "red"
            }}
          >
            {success ? "✅ " : "❌ "}
            {message}
          </p>
        )}


        {/* LOGIN */}
        <p style={styles.loginText}>
          Already have an account?{" "}

          <button
            type="button"
            onClick={onLogin}
            style={styles.loginButton}
          >
            Login
          </button>
        </p>

      </div>

    </div>
  );
}


/* =====================================
   STYLES
===================================== */

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

  registerBox: {
    width: "100%",

    maxWidth: "430px",

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

    fontSize: "14px",

    cursor: "pointer",

    marginBottom: "15px"
  },

  icon: {
    width: "65px",

    height: "65px",

    margin: "0 auto 15px",

    borderRadius: "50%",

    background: "#eaf3ff",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    fontSize: "32px"
  },

  title: {
    textAlign: "center",

    margin: "0",

    fontSize: "27px",

    color: "#172033"
  },

  subtitle: {
    textAlign: "center",

    color: "#718096",

    marginTop: "8px",

    marginBottom: "25px"
  },

  field: {
    marginBottom: "17px"
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

    border:
      "1px solid #d8dee8",

    borderRadius: "9px",

    fontSize: "15px",

    outline: "none",

    boxSizing: "border-box"
  },

  rulesBox: {
    background: "#f7f9fc",

    padding: "12px 15px",

    borderRadius: "10px",

    marginBottom: "18px"
  },

  rulesTitle: {
    marginTop: "0",

    marginBottom: "8px",

    fontWeight: "600",

    fontSize: "13px",

    color: "#374151"
  },

  rule: {
    margin: "5px 0",

    fontSize: "13px"
  },

  registerButton: {
    width: "100%",

    padding: "14px",

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

  loginText: {
    textAlign: "center",

    marginTop: "22px",

    color: "#718096",

    fontSize: "14px"
  },

  loginButton: {
    border: "none",

    background: "transparent",

    color: "#2878ff",

    cursor: "pointer",

    fontWeight: "600",

    fontSize: "14px"
  }
};

export default Register;
