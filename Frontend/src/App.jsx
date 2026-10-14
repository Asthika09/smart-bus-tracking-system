import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import DriverTracking from "./pages/DriverTracking";
import RoleSelection from "./pages/RoleSelection";

function App() {
  const [page, setPage] = useState("role");

  return (
    <div>

      {/* =========================
          ROLE SELECTION
      ========================== */}
      {page === "role" && (
        <RoleSelection
          onStudent={() => setPage("studentLogin")}
          onDriver={() => setPage("driverLogin")}
        />
      )}


      {/* =========================
          STUDENT LOGIN
      ========================== */}
      {page === "studentLogin" && (
        <Login
          role="student"
          onRegister={() => setPage("register")}
          onLoginSuccess={() => setPage("dashboard")}
          onBack={() => setPage("role")}
        />
      )}


      {/* =========================
          DRIVER LOGIN
      ========================== */}
      {page === "driverLogin" && (
        <Login
          role="driver"
          onLoginSuccess={() => setPage("driver")}
          onBack={() => setPage("role")}
        />
      )}


      {/* =========================
          STUDENT REGISTER
      ========================== */}
      {page === "register" && (
        <Register
          onLogin={() => setPage("studentLogin")}
        />
      )}


      {/* =========================
          STUDENT DASHBOARD
      ========================== */}
      {page === "dashboard" && (
        <StudentDashboard
          onDriver={() => setPage("driverLogin")}
          onLogout={() => setPage("role")}
        />
      )}


      {/* =========================
          DRIVER TRACKING
      ========================== */}
      {page === "driver" && (
        <DriverTracking
          onStudent={() => setPage("studentLogin")}
          onLogout={() => setPage("role")}
        />
      )}

    </div>
  );
}

export default App;