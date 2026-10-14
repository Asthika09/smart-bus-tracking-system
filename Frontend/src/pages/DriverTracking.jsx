import { useEffect, useRef, useState } from "react";
import { normalizeBusNumber } from "../utils/normalizeBusNumber";
import "./DriverTracking.css";

function DriverTracking({ onStudent, onLogout }) {
  const getStoredDriverState = () => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        return { busNumber: "", driverName: "Driver" };
      }

      const user = JSON.parse(savedUser);

      if (user.role === "driver") {
        return {
          busNumber: normalizeBusNumber(user.busNumber) || "",
          driverName: user.name || "Driver",
        };
      }
    } catch (error) {
      console.error("User data error:", error);
    }

    return { busNumber: "", driverName: "Driver" };
  };

  const [busNumber] = useState(() => getStoredDriverState().busNumber);
  const [driverName] = useState(() => getStoredDriverState().driverName);
  const [tracking, setTracking] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tripStartedAt, setTripStartedAt] = useState(null);
  const [tripDuration, setTripDuration] = useState("00:00");
  const [lastUpdated, setLastUpdated] = useState(null);

  const watchIdRef = useRef(null);
  const tripSessionIdRef = useRef(0);

  useEffect(() => {
    if (!tripStartedAt) {
      return;
    }

    const updateTimer = () => {
      const difference = Date.now() - tripStartedAt;
      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const nextDuration =
        hours > 0
          ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
              2,
              "0"
            )}:${String(seconds).padStart(2, "0")}`
          : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
              2,
              "0"
            )}`;

      setTripDuration(nextDuration);
    };

    const timerId = setTimeout(updateTimer, 0);
    const intervalId = setInterval(updateTimer, 1000);

    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [tripStartedAt]);

  const displayBusNumber = (number) => {
    const normalized = normalizeBusNumber(number);
    return normalized || "Loading...";
  };

  const updateBusStatus = async (status) => {
    const normalizedBusNumber = normalizeBusNumber(busNumber);

    if (!normalizedBusNumber) {
      setMessage("Bus number not found.");
      return false;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/buses/${encodeURIComponent(normalizedBusNumber)}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to update bus status.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Bus status update error:", error);
      setMessage("Cannot connect to backend.");
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendLocation = async (
    latitude,
    longitude,
    sessionId = tripSessionIdRef.current
  ) => {
    const normalizedBusNumber = normalizeBusNumber(busNumber);

    if (!normalizedBusNumber || sessionId !== tripSessionIdRef.current) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/location/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          busNumber: normalizedBusNumber,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (sessionId === tripSessionIdRef.current) {
          setMessage(data.message || "Location update failed.");
        }
        return;
      }

      if (sessionId !== tripSessionIdRef.current) {
        return;
      }

      setLastUpdated(new Date());
      setMessage("Live location updated.");
    } catch (error) {
      console.error("Location update error:", error);

      if (sessionId === tripSessionIdRef.current) {
        setMessage("Cannot connect to backend.");
      }
    }
  };

  const handleLocation = (position) => {
    if (!tracking) {
      return;
    }

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    setLocation({ latitude, longitude, accuracy });
    sendLocation(latitude, longitude, tripSessionIdRef.current);
  };

  const handleLocationError = (error) => {
    console.error("GPS error:", error);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    tripSessionIdRef.current += 1;
    setTracking(false);

    if (error.code === 1) {
      setMessage("Location permission denied. Please allow location access.");
    } else if (error.code === 2) {
      setMessage("Unable to detect your location.");
    } else if (error.code === 3) {
      setMessage("Location request timed out.");
    } else {
      setMessage("Unable to get current location.");
    }

    updateBusStatus("inactive");
  };

  const startTracking = async () => {
    const normalizedBusNumber = normalizeBusNumber(busNumber);

    if (tracking || updatingStatus) return;

    if (!normalizedBusNumber) {
      setMessage("Bus number not found.");
      return;
    }

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    tripSessionIdRef.current += 1;
    const sessionId = tripSessionIdRef.current;

    setMessage("Starting trip...");

    const statusUpdated = await updateBusStatus("active");

    if (!statusUpdated) {
      return;
    }

    setTracking(true);
    setTripStartedAt(Date.now());
    setMessage("Requesting location permission...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (sessionId !== tripSessionIdRef.current) return;
        handleLocation(position);
      },
      (error) => {
        if (sessionId !== tripSessionIdRef.current) return;
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    setMessage(
      `${displayBusNumber(normalizedBusNumber)} trip started. GPS tracking active.`
    );
  };

  const stopTracking = async () => {
    if (updatingStatus) return;

    tripSessionIdRef.current += 1;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);

    const statusUpdated = await updateBusStatus("inactive");

    if (!statusUpdated) return;

    setMessage(`${displayBusNumber(busNumber)} trip ended successfully.`);
    setTripStartedAt(null);
    setTripDuration("00:00");
  };

  useEffect(() => {
    return () => {
      tripSessionIdRef.current += 1;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    if (tracking) {
      await stopTracking();
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (onLogout) {
      onLogout();
    } else if (onStudent) {
      onStudent();
    }
  };

  const getGpsStatus = () => {
    if (!tracking) {
      return { label: "Offline", className: "gps-offline" };
    }

    if (!location) {
      return { label: "Searching...", className: "gps-searching" };
    }

    if (location.accuracy <= 20) {
      return { label: "Excellent", className: "gps-good" };
    }

    if (location.accuracy <= 50) {
      return { label: "Good", className: "gps-medium" };
    }

    return { label: "Weak", className: "gps-weak" };
  };

  const gpsStatus = getGpsStatus();

  const formatLastUpdated = () => {
    if (!lastUpdated) {
      return "Waiting for GPS";
    }

    return lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="driver-app">
      <header className="driver-header">
        <div className="brand-section">
          <div className="brand-logo">🚌</div>
          <div>
            <div className="brand-name">MIT BUS</div>
            <div className="brand-subtitle">Driver Console</div>
          </div>
        </div>

        <div className="header-actions">
          <div className={`live-pill ${tracking ? "live-active" : ""}`}>
            <span className="live-dot"></span>
            {tracking ? "LIVE" : "OFFLINE"}
          </div>

          <button className="profile-button" onClick={handleLogout} title="Logout">
            {driverName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="driver-main">
        <section className="welcome-section">
          <div>
            <span className="eyebrow">DRIVER CONSOLE</span>
            <h1>Good day, {driverName.split(" ")[0]}</h1>
            <p>
              {tracking
                ? "Your trip is currently active."
                : "Ready when you are. Start your trip to begin tracking."}
            </p>
          </div>
        </section>

        <section className={`bus-hero ${tracking ? "bus-hero-active" : ""}`}>
          <div className="hero-top">
            <div>
              <span className="hero-label">ASSIGNED VEHICLE</span>
              <h2>{displayBusNumber(busNumber)}</h2>
            </div>

            <div className={`status-badge ${tracking ? "status-running" : "status-idle"}`}>
              <span></span>
              {tracking ? "Trip Active" : "Trip Inactive"}
            </div>
          </div>

          <div className="hero-bottom">
            <div>
              <span>TRIP DURATION</span>
              <strong>{tripDuration}</strong>
            </div>

            <div>
              <span>LAST GPS UPDATE</span>
              <strong>{formatLastUpdated()}</strong>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIVE TELEMETRY</span>
              <h3>GPS Status</h3>
            </div>

            <div className={`gps-status ${gpsStatus.className}`}>
              <span></span>
              {gpsStatus.label}
            </div>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-icon">📡</div>
              <div>
                <span>GPS SIGNAL</span>
                <strong>{tracking ? "Connected" : "Not active"}</strong>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">◎</div>
              <div>
                <span>ACCURACY</span>
                <strong>{location ? `${Math.round(location.accuracy)} m` : "--"}</strong>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">N</div>
              <div>
                <span>LATITUDE</span>
                <strong>{location ? location.latitude.toFixed(6) : "--"}</strong>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon">E</div>
              <div>
                <span>LONGITUDE</span>
                <strong>{location ? location.longitude.toFixed(6) : "--"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="location-card">
          <div className="location-card-header">
            <div className="location-title">
              <div className="location-icon">📍</div>
              <div>
                <span>CURRENT LOCATION</span>
                <strong>{location ? "GPS position available" : "Waiting for location"}</strong>
              </div>
            </div>

            {tracking && (
              <div className="tracking-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          {location ? (
            <div className="coordinates">
              <div>
                <span>Latitude</span>
                <strong>{location.latitude.toFixed(6)}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{location.longitude.toFixed(6)}</strong>
              </div>
            </div>
          ) : (
            <div className="location-empty">
              <div className="location-loader"></div>
              <span>Start the trip to begin GPS tracking</span>
            </div>
          )}
        </section>

        <section className="trip-control">
          <div className="control-heading">
            <div>
              <span className="eyebrow">TRIP CONTROL</span>
              <h3>{tracking ? "Trip is in progress" : "Ready to start"}</h3>
            </div>
          </div>

          {!tracking ? (
            <button className="trip-button start-button" onClick={startTracking} disabled={updatingStatus || !busNumber}>
              <span className="button-icon">▶</span>
              <span>
                <strong>START TRIP</strong>
                <small>Begin live GPS tracking</small>
              </span>
              <span className="button-arrow">→</span>
            </button>
          ) : (
            <button className="trip-button end-button" onClick={stopTracking} disabled={updatingStatus}>
              <span className="button-icon">■</span>
              <span>
                <strong>END TRIP</strong>
                <small>Stop live GPS tracking</small>
              </span>
              <span className="button-arrow">→</span>
            </button>
          )}
        </section>

        {message && (
          <div
            className={`system-message ${
              message.toLowerCase().includes("error") ||
              message.toLowerCase().includes("unable") ||
              message.toLowerCase().includes("cannot")
                ? "message-error"
                : tracking
                ? "message-success"
                : "message-info"
            }`}
          >
            <span className="message-icon">{tracking ? "✓" : "i"}</span>
            <span>{message}</span>
          </div>
        )}
      </main>

      <footer className="driver-footer">
        <div>
          <strong>MIT Smart Bus</strong>
          <span>Real-time transport system</span>
        </div>
        <span>Driver App</span>
      </footer>
    </div>
  );
}

export default DriverTracking;

