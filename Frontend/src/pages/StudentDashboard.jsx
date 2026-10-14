import { useEffect, useState } from "react";
import LiveBusMap from "./LiveBusMap";
import "./StudentDashboard.css";

function StudentDashboard({ onDriver }) {
  const [buses, setBuses] = useState([]);
  const [busLocations, setBusLocations] = useState({});
  const [studentLocation, setStudentLocation] = useState(null);

  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [etaData, setEtaData] = useState({});

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // ==========================================
  // GET ACTIVE BUSES
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchBuses = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/buses?t=${Date.now()}`,
          {
            cache: "no-store"
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (isMounted) {
            setMessage(
              data.message || "Failed to load buses"
            );
          }
          return;
        }

        /*
          Only ACTIVE buses should be shown to students.
          Driver registration alone does not make a bus live.
          Start Trip changes status to active.
        */
        const activeBuses = Array.isArray(data)
          ? data.filter(
              (bus) => bus.status === "active"
            )
          : [];

        if (isMounted) {
          setBuses(activeBuses);
        }
      } catch (error) {
        console.error("Bus fetch error:", error);

        if (isMounted) {
          setMessage(
            "Cannot connect to backend"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBuses();

    /*
      Refresh active buses every 5 seconds.
      This means when driver presses Start Trip,
      the bus can automatically appear here.
    */
    const interval = setInterval(
      fetchBuses,
      5000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // GET ALL STOPS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchStops = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/stops?t=${Date.now()}`,
          {
            cache: "no-store"
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Failed to load stops"
          );
          return;
        }

        if (!Array.isArray(data)) {
          return;
        }

        if (isMounted) {
          setStops(data);

          // Restore previously selected stop
          const savedStop =
            localStorage.getItem(
              "selectedStop"
            );

          if (savedStop) {
            try {
              const parsedStop =
                JSON.parse(savedStop);

              const exists = data.find(
                (stop) =>
                  String(stop._id) ===
                  String(parsedStop._id)
              );

              if (exists) {
                setSelectedStop(exists);
              }
            } catch (error) {
              console.error(
                "Invalid saved stop:",
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Stop fetch error:",
          error
        );
      }
    };

    fetchStops();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // STUDENT GPS
  // ==========================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    const getStudentLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStudentLocation({
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude,
            accuracy:
              position.coords.accuracy
          });
        },
        (error) => {
          console.error(
            "Student GPS Error:",
            error.message
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    };

    getStudentLocation();

    const interval = setInterval(
      getStudentLocation,
      10000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // GET LIVE BUS LOCATIONS
  // ==========================================

  useEffect(() => {
    if (buses.length === 0) {
      setBusLocations({});
      return;
    }

    let isMounted = true;

    const fetchBusLocations = async () => {
      const locations = {};

      await Promise.all(
        buses.map(async (bus) => {
          try {
            const response = await fetch(
              `http://localhost:5000/api/location/${encodeURIComponent(
                bus.busNumber
              )}?t=${Date.now()}`,
              {
                cache: "no-store"
              }
            );

            if (!response.ok) {
              return;
            }

            const data =
              await response.json();

            if (
              data &&
              data.latitude !== undefined &&
              data.longitude !== undefined
            ) {
              locations[bus.busNumber] =
                data;
            }
          } catch (error) {
            console.error(
              `Location error for ${bus.busNumber}:`,
              error
            );
          }
        })
      );

      if (isMounted) {
        setBusLocations(locations);
      }
    };

    fetchBusLocations();

    const interval = setInterval(
      fetchBusLocations,
      5000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [buses]);

  // ==========================================
  // SELECT STUDENT STOP
  // ==========================================

  const handleStopChange = (event) => {
    const stopId = event.target.value;

    const stop = stops.find(
      (item) =>
        String(item._id) === String(stopId)
    );

    if (!stop) {
      setSelectedStop(null);

      localStorage.removeItem(
        "selectedStop"
      );

      return;
    }

    setSelectedStop(stop);

    localStorage.setItem(
      "selectedStop",
      JSON.stringify(stop)
    );
  };

  // ==========================================
  // ROAD ETA TO STUDENT STOP
  // ==========================================

  useEffect(() => {
    if (
      !selectedStop ||
      buses.length === 0
    ) {
      setEtaData({});
      return;
    }

    let isMounted = true;

    const calculateRoadETA = async () => {
      const results = {};

      await Promise.all(
        buses.map(async (bus) => {
          const location =
            busLocations[bus.busNumber];

          if (!location) {
            return;
          }

          const busLat = Number(
            location.latitude
          );

          const busLng = Number(
            location.longitude
          );

          const stopLat = Number(
            selectedStop.latitude
          );

          const stopLng = Number(
            selectedStop.longitude
          );

          if (
            Number.isNaN(busLat) ||
            Number.isNaN(busLng) ||
            Number.isNaN(stopLat) ||
            Number.isNaN(stopLng)
          ) {
            return;
          }

          try {
            const url =
              `https://router.project-osrm.org/route/v1/driving/` +
              `${busLng},${busLat};` +
              `${stopLng},${stopLat}` +
              `?overview=false`;

            const response =
              await fetch(url);

            if (!response.ok) {
              return;
            }

            const data =
              await response.json();

            if (
              !data.routes ||
              data.routes.length === 0
            ) {
              return;
            }

            const route =
              data.routes[0];

            const distanceKm =
              route.distance / 1000;

            const minutes = Math.ceil(
              route.duration / 60
            );

            results[bus.busNumber] = {
              distance: distanceKm,
              eta:
                minutes <= 1
                  ? "Arriving"
                  : `${minutes} min`
            };
          } catch (error) {
            console.error(
              `ETA error for ${bus.busNumber}:`,
              error
            );
          }
        })
      );

      if (isMounted) {
        setEtaData(results);
      }
    };

    calculateRoadETA();

    return () => {
      isMounted = false;
    };
  }, [
    selectedStop,
    busLocations,
    buses
  ]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedStop");

    window.location.reload();
  };

  // ==========================================
  // FILTER BUS
  // ==========================================

  const filteredBuses = buses
    .filter((bus) => {
      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return true;
      }

      const busNumber =
        bus.busNumber?.toLowerCase() || "";

      const routeName =
        bus.route?.routeName?.toLowerCase() ||
        "";

      const origin =
        bus.route?.origin?.toLowerCase() || "";

      const destination =
        bus.route?.destination?.toLowerCase() ||
        "";

      return (
        busNumber.includes(searchText) ||
        routeName.includes(searchText) ||
        origin.includes(searchText) ||
        destination.includes(searchText)
      );
    })
    .map((bus) => {
      const etaInfo =
        etaData[bus.busNumber];

      return {
        ...bus,

        distance:
          etaInfo?.distance ?? null,

        eta:
          etaInfo?.eta ?? null
      };
    })
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;

      return a.distance - b.distance;
    });

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            🚌
          </div>

          <div>
            <h1>
              Smart Bus
            </h1>

            <span>
              Live Tracking System
            </span>
          </div>

        </div>

        <div className="top-actions">

          <button
            className="driver-btn"
            onClick={onDriver}
          >
            👨‍✈️ Driver Tracking
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* WELCOME */}

      <section className="welcome">

        <div>

          <p className="small-title">
            STUDENT DASHBOARD
          </p>

          <h2>
            Welcome,{" "}
            {user?.name || "Student"} 👋
          </h2>

          <p className="welcome-text">
            Find your bus and track it
            in real time.
          </p>

        </div>

        <div className="gps-card">

          <span className="gps-icon">
            📍
          </span>

          <div>

            <strong>
              Your Location
            </strong>

            <p>
              {studentLocation
                ? "Location detected"
                : "Detecting location..."}
            </p>

          </div>

          <span
            className={
              studentLocation
                ? "online-dot"
                : "offline-dot"
            }
          />

        </div>

      </section>

      {/* SELECT STOP */}

      <section className="search-section">

        <h2>
          📍 Your Bus Stop
        </h2>

        <p>
          Select the stop where you want
          to get down
        </p>

        <div className="search-box">

          <span>
            🚌
          </span>

          <select
            value={
              selectedStop?._id || ""
            }
            onChange={handleStopChange}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "16px",
              padding: "4px"
            }}
          >

            <option value="">
              Select your bus stop
            </option>

            {stops.map((stop) => (
              <option
                key={stop._id}
                value={stop._id}
              >
                {stop.name}
              </option>
            ))}

          </select>

        </div>

        {selectedStop && (
          <p
            style={{
              marginTop: "10px",
              fontWeight: "600"
            }}
          >
            📍 ETA will be calculated to{" "}
            <strong>
              {selectedStop.name}
            </strong>
          </p>
        )}

      </section>

      {/* SEARCH */}

      <section className="search-section">

        <h2>
          Find Your Bus
        </h2>

        <p>
          Search by bus number, route,
          origin or destination
        </p>

        <div className="search-box">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search bus or route..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              className="clear-btn"
              onClick={() =>
                setSearch("")
              }
            >
              ✕
            </button>
          )}

        </div>

      </section>

      {/* MESSAGE */}

      {message && (
        <div className="message">
          ❌ {message}
        </div>
      )}

      {/* BUS SECTION */}

      <section className="bus-section">

        <div className="section-heading">

          <div>

            <h2>
              Available Buses
            </h2>

            <p>
              {selectedStop
                ? `ETA to ${selectedStop.name}`
                : "Select your stop to see ETA"}
            </p>

          </div>

          <div className="bus-count">
            {filteredBuses.length} Bus
            {filteredBuses.length !== 1
              ? "es"
              : ""}
          </div>

        </div>

        {loading ? (

          <div className="loading">

            <div className="spinner" />

            <p>
              Loading buses...
            </p>

          </div>

        ) : filteredBuses.length === 0 ? (

          <div className="empty">

            <div>
              🚌
            </div>

            <h3>
              No active buses
            </h3>

            <p>
              Buses will appear here when
              a driver starts a trip.
            </p>

          </div>

        ) : (

          <div className="bus-grid">

            {filteredBuses.map((bus) => (

              <div
                className="bus-card"
                key={bus._id}
              >

                <div className="card-top">

                  <div className="bus-number">
                    🚌 {bus.busNumber}
                  </div>

                  <span
                    className={
                      busLocations[
                        bus.busNumber
                      ]
                        ? "live-badge"
                        : "offline-badge"
                    }
                  >

                    <span>
                      ●
                    </span>

                    {busLocations[
                      bus.busNumber
                    ]
                      ? " LIVE"
                      : " OFFLINE"}

                  </span>

                </div>

                <h3>
                  {bus.route?.routeName ||
                    "Route not assigned"}
                </h3>

                <div className="route-line">

                  <div className="route-point">

                    <span className="start-dot" />

                    <div>

                      <small>
                        FROM
                      </small>

                      <strong>
                        {bus.route?.origin ||
                          "Unknown"}
                      </strong>

                    </div>

                  </div>

                  <div className="route-point">

                    <span className="end-dot" />

                    <div>

                      <small>
                        TO
                      </small>

                      <strong>
                        {bus.route?.destination ||
                          "Unknown"}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="driver-info">
                  👨‍✈️{" "}
                  {bus.driverName ||
                    "Driver"}
                </div>

                {/* YOUR STOP */}

                {selectedStop && (

                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "#f5f7fa"
                    }}
                  >

                    <small>
                      YOUR STOP
                    </small>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "4px"
                      }}
                    >
                      📍 {selectedStop.name}
                    </strong>

                  </div>

                )}

                <div className="stats">

                  <div className="stat">

                    <span>
                      📏
                    </span>

                    <div>

                      <small>
                        DISTANCE
                      </small>

                      <strong>
                        {bus.distance !== null
                          ? `${bus.distance.toFixed(
                              2
                            )} km`
                          : "--"}
                      </strong>

                    </div>

                  </div>

                  <div className="stat">

                    <span>
                      ⏱️
                    </span>

                    <div>

                      <small>
                        ETA
                      </small>

                      <strong>
                        {selectedStop
                          ? bus.eta ||
                            "Calculating..."
                          : "--"}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* MAP */}

      {filteredBuses.length > 0 && (

        <section className="map-section">

          <div className="map-header">

            <div>

              <h2>
                🗺️ Live Bus Map
              </h2>

              <p>
                Track buses in real time
              </p>

            </div>

            <span className="map-live">
              ● LIVE
            </span>

          </div>

          <div className="map-container">

            <LiveBusMap
              buses={filteredBuses}
              busLocations={busLocations}
              studentLocation={
                studentLocation
              }
              stops={stops}
              selectedStop={
                selectedStop
              }
            />

          </div>

        </section>

      )}

      {/* FOOTER */}

      <footer>

        <p>
          🚌 Smart Bus Tracking System
        </p>

        <span>
          Live location updates every 5 seconds
        </span>

      </footer>

    </div>
  );
}

export default StudentDashboard;