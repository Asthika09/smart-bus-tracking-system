import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// ==========================================
// BUS ICON
// ==========================================

const busIcon = L.divIcon({
  className: "bus-emoji",

  html: `
    <div style="
      font-size: 28px;
      text-align: center;
      line-height: 28px;
    ">
      🚌
    </div>
  `,

  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// ==========================================
// STUDENT ICON
// ==========================================

const studentIcon = L.divIcon({
  className: "student-marker",

  html: `
    <div style="
      font-size: 30px;
      text-align: center;
      line-height: 30px;
    ">
      📍
    </div>
  `,

  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

// ==========================================
// MAP CENTER
// ==========================================

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.setView(
      position,
      map.getZoom()
    );
  }, [position, map]);

  return null;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function LiveBusMap({
  buses = [],
  busLocations = {},
  studentLocation = null
}) {
  const [routeData, setRouteData] =
    useState({});

  const [routeLoading, setRouteLoading] =
    useState(false);

  // ==========================================
  // CALCULATE BUS → STUDENT ROAD ROUTE
  // ==========================================

  useEffect(() => {
    if (
      !studentLocation ||
      buses.length === 0
    ) {
      setRouteData({});
      return;
    }

    let isMounted = true;

    const calculateRoutes = async () => {
      setRouteLoading(true);

      const results = {};

      await Promise.all(
        buses.map(async (bus) => {
          const location =
            busLocations[
              bus.busNumber
            ];

          if (!location) {
            return;
          }

          const busLat = Number(
            location.latitude
          );

          const busLng = Number(
            location.longitude
          );

          const studentLat = Number(
            studentLocation.latitude
          );

          const studentLng = Number(
            studentLocation.longitude
          );

          if (
            Number.isNaN(busLat) ||
            Number.isNaN(busLng) ||
            Number.isNaN(studentLat) ||
            Number.isNaN(studentLng)
          ) {
            return;
          }

          try {
            /*
              OSRM coordinate format:

              longitude,latitude;
              longitude,latitude

              BUS → STUDENT
            */

            const url =
              `https://router.project-osrm.org/route/v1/driving/` +
              `${busLng},${busLat};` +
              `${studentLng},${studentLat}` +
              `?overview=full&geometries=geojson`;

            const response =
              await fetch(url);

            if (!response.ok) {
              console.error(
                "OSRM request failed:",
                response.status
              );

              return;
            }

            const data =
              await response.json();

            if (
              data.code !== "Ok" ||
              !data.routes ||
              data.routes.length === 0
            ) {
              return;
            }

            const route =
              data.routes[0];

            const coordinates =
              route.geometry.coordinates.map(
                ([lng, lat]) => [
                  lat,
                  lng
                ]
              );

            const distanceKm =
              route.distance / 1000;

            const etaMinutes =
              Math.ceil(
                route.duration / 60
              );

            results[
              bus.busNumber
            ] = {
              coordinates,
              distance: distanceKm,
              eta: etaMinutes
            };
          } catch (error) {
            console.error(
              `OSRM route error for ${bus.busNumber}:`,
              error
            );
          }
        })
      );

      if (isMounted) {
        setRouteData(results);
        setRouteLoading(false);
      }
    };

    calculateRoutes();

    return () => {
      isMounted = false;
    };
  }, [
    buses,
    busLocations,
    studentLocation
  ]);

  // ==========================================
  // BUS POSITIONS
  // ==========================================

  const busPositions =
    buses
      .map((bus) => {
        const location =
          busLocations[
            bus.busNumber
          ];

        if (!location) {
          return null;
        }

        const latitude = Number(
          location.latitude
        );

        const longitude = Number(
          location.longitude
        );

        if (
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          return null;
        }

        return {
          bus,
          position: [
            latitude,
            longitude
          ]
        };
      })
      .filter(Boolean);

  // ==========================================
  // STUDENT POSITION
  // ==========================================

  const studentPosition =
    studentLocation &&
    !Number.isNaN(
      Number(studentLocation.latitude)
    ) &&
    !Number.isNaN(
      Number(studentLocation.longitude)
    )
      ? [
          Number(
            studentLocation.latitude
          ),
          Number(
            studentLocation.longitude
          )
        ]
      : null;

  // ==========================================
  // MAP CENTER
  // ==========================================

  let mapCenter =
    studentPosition;

  if (
    !mapCenter &&
    busPositions.length > 0
  ) {
    mapCenter =
      busPositions[0].position;
  }

  if (!mapCenter) {
    mapCenter = [
      13.623814,
      74.691705
    ];
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        width: "100%"
      }}
    >
      {/* ======================================
          LIVE INFORMATION
      ====================================== */}

      {busPositions.map(
        ({ bus }) => {
          const data =
            routeData[
              bus.busNumber
            ];

          return (
            <div
              key={
                `info-${bus.busNumber}`
              }
              style={{
                border:
                  "1px solid #ddd",
                padding: "14px",
                marginBottom: "12px",
                borderRadius: "10px",
                background:
                  "#ffffff"
              }}
            >
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  marginBottom: "8px"
                }}
              >
                🚌 {bus.busNumber}
              </div>

              <div>
                Route:{" "}
                <strong>
                  {bus.route?.routeName ||
                    "Unknown"}
                </strong>
              </div>

              <div>
                From:{" "}
                {bus.route?.origin ||
                  "Unknown"}
              </div>

              <div>
                To:{" "}
                {bus.route?.destination ||
                  "Unknown"}
              </div>

              {studentPosition ? (
                <>
                  <div
                    style={{
                      marginTop: "8px"
                    }}
                  >
                    📍 Your Location:{" "}
                    <strong>
                      Detected
                    </strong>
                  </div>

                  {data && (
                    <>
                      <div>
                        📏 Road Distance:{" "}
                        <strong>
                          {data.distance.toFixed(
                            2
                          )}{" "}
                          km
                        </strong>
                      </div>

                      <div>
                        ⏱️ ETA:{" "}
                        <strong>
                          {data.eta <= 1
                            ? "Arriving"
                            : `${data.eta} min`}
                        </strong>
                      </div>
                    </>
                  )}

                  {!data &&
                    routeLoading && (
                      <div
                        style={{
                          marginTop: "6px"
                        }}
                      >
                        🛣️ Calculating road
                        route...
                      </div>
                    )}
                </>
              ) : (
                <div
                  style={{
                    marginTop: "8px"
                  }}
                >
                  📍 Waiting for your
                  location...
                </div>
              )}
            </div>
          );
        }
      )}

      {/* ======================================
          MAP
      ====================================== */}

      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{
          height: "550px",
          width: "100%"
        }}
      >
        {/* ====================================
            OPEN STREET MAP
        ==================================== */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ====================================
            STUDENT LOCATION
        ==================================== */}

        {studentPosition && (
          <Marker
            position={
              studentPosition
            }
            icon={studentIcon}
          >
            <Popup>
              📍{" "}
              <strong>
                Your Current Location
              </strong>
            </Popup>
          </Marker>
        )}

        {/* ====================================
            BUS → STUDENT ROAD ROUTES
        ==================================== */}

        {busPositions.map(
          ({ bus }) => {
            const data =
              routeData[
                bus.busNumber
              ];

            if (
              !data?.coordinates ||
              data.coordinates.length === 0
            ) {
              return null;
            }

            return (
              <Polyline
                key={
                  `route-${bus.busNumber}`
                }
                positions={
                  data.coordinates
                }
                pathOptions={{
                  weight: 6
                }}
              />
            );
          }
        )}

        {/* ====================================
            BUS MARKERS
        ==================================== */}

        {busPositions.map(
          ({
            bus,
            position
          }) => {
            const data =
              routeData[
                bus.busNumber
              ];

            return (
              <Marker
                key={
                  `bus-${bus.busNumber}`
                }
                position={position}
                icon={busIcon}
              >
                <Popup>
                  🚌{" "}
                  <strong>
                    {bus.busNumber}
                  </strong>

                  <br />

                  Route:{" "}
                  {bus.route?.routeName ||
                    "Unknown"}

                  <br />

                  From:{" "}
                  {bus.route?.origin ||
                    "Unknown"}

                  <br />

                  To:{" "}
                  {bus.route?.destination ||
                    "Unknown"}

                  <br />

                  {data && (
                    <>
                      📏 Distance:{" "}
                      {data.distance.toFixed(
                        2
                      )}{" "}
                      km

                      <br />

                      ⏱️ ETA:{" "}
                      {data.eta <= 1
                        ? "Arriving"
                        : `${data.eta} min`}
                    </>
                  )}
                </Popup>
              </Marker>
            );
          }
        )}

        {/* ====================================
            CENTER MAP
        ==================================== */}

        {studentPosition && (
          <MapCenter
            position={
              studentPosition
            }
          />
        )}
      </MapContainer>
    </div>
  );
}

export default LiveBusMap;