import "./RoleSelection.css";

function RoleSelection({ onStudent, onDriver }) {
  return (
    <div className="role-page">

      <div className="role-box">

        <div className="bus-logo">
          🚌
        </div>

        <h1>Smart Bus Tracking</h1>

        <p className="role-subtitle">
          Track your bus. Travel smarter.
        </p>

        <h2>Who are you?</h2>

        <div className="role-options">

          <button
            className="role-card"
            onClick={onStudent}
          >
            <div className="role-emoji">
              🎓
            </div>

            <h3>Student</h3>

            <p>
              Track buses and check
              arrival information
            </p>
          </button>


          <button
            className="role-card"
            onClick={onDriver}
          >
            <div className="role-emoji">
              👨‍✈️
            </div>

            <h3>Driver</h3>

            <p>
              Start trips and share
              your live location
            </p>
          </button>

        </div>

      </div>

    </div>
  );
}

export default RoleSelection;