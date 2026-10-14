import { useEffect, useState } from "react";

function BusSearch({ onBusSelect }) {

    const [buses, setBuses] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchBuses = async () => {

            try {

                const response = await fetch(
                    "http://localhost:5000/api/buses"
                );

                const data = await response.json();

                setBuses(data);

            } catch (error) {

                console.error(
                    "Error fetching buses:",
                    error
                );

            } finally {

                setLoading(false);

            }
        };

        fetchBuses();

    }, []);

    const filteredBuses = buses.filter((bus) => {

        const busNumber =
            bus.busNumber?.toLowerCase() || "";

        const routeName =
            bus.route?.routeName?.toLowerCase() || "";

        const searchText =
            search.toLowerCase();

        return (
            busNumber.includes(searchText) ||
            routeName.includes(searchText)
        );
    });

    return (

        <div>

            <h2>
                🔍 Search Bus
            </h2>

            <input
                type="text"
                placeholder="Search bus number or route..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                style={{
                    width: "300px",
                    padding: "10px",
                    marginBottom: "15px"
                }}
            />

            {loading && (
                <p>
                    Loading buses...
                </p>
            )}

            {!loading &&
                filteredBuses.length === 0 && (
                    <p>
                        No bus found
                    </p>
                )}

            {filteredBuses.map((bus) => (

                <div
                    key={bus._id}
                    onClick={() =>
                        onBusSelect(
                            bus.busNumber
                        )
                    }
                    style={{
                        border: "1px solid #ccc",
                        padding: "12px",
                        marginBottom: "8px",
                        width: "300px",
                        cursor: "pointer",
                        borderRadius: "8px"
                    }}
                >

                    <strong>
                        🚌 {bus.busNumber}
                    </strong>

                    <br />

                    🛣️{" "}
                    {bus.route?.routeName ||
                        "No route assigned"}

                    <br />

                    Status:{" "}
                    {bus.status}

                </div>

            ))}

        </div>
    );
}

export default BusSearch;