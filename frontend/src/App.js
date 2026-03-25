import { useEffect, useState, useRef } from "react"; // Hooks de React: efectos, estado y referencias
import axios from "axios";                            // Cliente HTTP para llamadas a la API
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"; // Componentes del mapa
import L from "leaflet";                              // Librería base de mapas interactivos
import "leaflet/dist/leaflet.css";                    // Estilos visuales del mapa

// Componente que mueve el mapa hacia una posición específica
function MapCenter({ position }) {
  const map = useMap(); // Obtiene la instancia del mapa de Leaflet
  
  useEffect(() => {
    if (position) {
      map.setView(position, 13); // Centra el mapa en la posición con zoom nivel 13
    }
  }, [position, map]); // Se ejecuta cada vez que cambia la posición
  
  return null; // No renderiza nada visual, solo afecta el mapa
}

// Icono azul por defecto para marcar estaciones en el mapa
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/.../marker-icon.png", // URL del ícono azul
  iconSize: [25, 41],      // Tamaño del ícono en píxeles
  iconAnchor: [12, 41],    // Punto del ícono que se ancla al marcador
  popupAnchor: [1, -34],   // Posición del popup relativa al ícono
  shadowUrl: "https://cdnjs.cloudflare.com/.../marker-shadow.png", // Sombra del ícono
  shadowSize: [41, 41]     // Tamaño de la sombra
});

// Icono rojo para resaltar la estación seleccionada o recién editada
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/.../marker-icon-red.png", // URL del ícono rojo
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/.../marker-shadow.png",
  shadowSize: [41, 41]
});

function App() {
  const [stations, setStations] = useState([]);           // Lista de estaciones traídas de la API
  const [editingId, setEditingId] = useState(null);       // ID de la estación que se está editando
  const [selectedLocation, setSelectedLocation] = useState(null); // Estación resaltada en el mapa
  const [mapCenter, setMapCenter] = useState([4.6, -74.1]); // Centro inicial del mapa (Bogotá)

  const [form, setForm] = useState({  // Estado del formulario con los campos de la estación
    ubicacion: "",
    longitud: "",
    latitud: "",
    temperatura: ""
  });

  // Llama a la API y guarda las estaciones en el estado
  const getStations = async () => {
    const res = await axios.get("http://127.0.0.1:5000/stations"); // GET a la API local
    setStations(res.data);                                          // Guarda los datos en el estado
  };

  useEffect(() => {
    getStations(); // Carga las estaciones al iniciar la app
  }, []);          // El [] asegura que solo se ejecute una vez

  // Actualiza el campo correspondiente del formulario al escribir
  const handleChange = (e) => {
    setForm({
      ...form,                        // Mantiene los demás campos sin cambios
      [e.target.name]: e.target.value // Actualiza solo el campo que cambió
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    const data = {
      ...form,
      longitud: parseFloat(form.longitud),      // Convierte strings a números decimales
      latitud: parseFloat(form.latitud),
      temperatura: parseFloat(form.temperatura)
    };

    if (editingId) {
      await axios.put(`http://127.0.0.1:5000/stations/${editingId}`, data); // PUT: actualiza la estación
      setEditingId(null); // Limpia el ID de edición

      setSelectedLocation({ // Resalta la estación actualizada en el mapa con ícono rojo
        latitud: data.latitud,
        longitud: data.longitud,
        ubicacion: data.ubicacion,
        temperatura: data.temperatura,
        esEdicion: true // Indica que fue una edición
      });
      setMapCenter([data.latitud, data.longitud]); // Centra el mapa en la estación actualizada

      setTimeout(() => {
        setSelectedLocation(null); // Quita el marcador rojo después de 8 segundos
      }, 8000);
    } else {
      await axios.post("http://127.0.0.1:5000/stations", data); // POST: crea nueva estación

      setSelectedLocation({ // Resalta la nueva estación en el mapa
        latitud: data.latitud,
        longitud: data.longitud,
        ubicacion: data.ubicacion,
        temperatura: data.temperatura,
        esEdicion: false // Indica que fue una creación
      });
      setMapCenter([data.latitud, data.longitud]); // Centra el mapa en la nueva estación

      setTimeout(() => {
        setSelectedLocation(null); // Quita el marcador rojo después de 8 segundos
      }, 8000);
    }

    setForm({ ubicacion: "", longitud: "", latitud: "", temperatura: "" }); // Limpia el formulario
    getStations(); // Recarga la lista de estaciones
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:5000/stations/${id}`); // DELETE: elimina la estación
    getStations(); // Recarga la lista actualizada

    if (selectedLocation && selectedLocation.id === id) {
      setSelectedLocation(null); // Si la estación eliminada estaba resaltada, la oculta del mapa
    }
  };

  const handleEdit = (station) => {
    setForm({                          // Rellena el formulario con los datos de la estación
      ubicacion: station.ubicacion,
      longitud: station.longitud,
      latitud: station.latitud,
      temperatura: station.temperatura
    });
    setEditingId(station.id); // Guarda el ID para saber que estamos editando

    setSelectedLocation({  // Resalta la estación en el mapa con ícono rojo
      id: station.id,
      latitud: station.latitud,
      longitud: station.longitud,
      ubicacion: station.ubicacion,
      temperatura: station.temperatura,
      esEdicion: true
    });

    setMapCenter([station.latitud, station.longitud]); // Centra el mapa en la estación a editar

    setTimeout(() => {
      setSelectedLocation(null); // Quita el marcador rojo después de 8 segundos
    }, 8000);
  };

  //Formulario para crear/editar estaciones, tabla con todos los registros y sus botones de editar/eliminar.
  //un mapa con marcadores azules para todas las estaciones y uno rojo temporal de 8 segundos para la última acción realizada.
  return (
    <div style={{ fontFamily: "Arial", background: "#f4f6f8", minHeight: "100vh", padding: "20px" }}>
      
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>🌎 Estaciones Climáticas</h1>

      {/* FORM */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input 
            name="ubicacion" 
            placeholder="Ubicación (ej: Mosquera)" 
            value={form.ubicacion} 
            onChange={handleChange}
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd", flex: 1, minWidth: "150px" }}
            required
          />
          <input 
            name="longitud" 
            placeholder="Longitud (ej: -74.2333)" 
            value={form.longitud} 
            onChange={handleChange}
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd", flex: 1, minWidth: "150px" }}
            required
          />
          <input 
            name="latitud" 
            placeholder="Latitud (ej: 4.7167)" 
            value={form.latitud} 
            onChange={handleChange}
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd", flex: 1, minWidth: "150px" }}
            required
          />
          <input 
            name="temperatura" 
            placeholder="Temperatura (°C)" 
            value={form.temperatura} 
            onChange={handleChange}
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd", flex: 1, minWidth: "150px" }}
            required
          />
          <button type="submit" style={{ background: "#007bff", color: "white", border: "none", padding: "8px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
            {editingId ? "Actualizar" : "Agregar"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => {
                setEditingId(null);
                setForm({
                  ubicacion: "",
                  longitud: "",
                  latitud: "",
                  temperatura: ""
                });
                setSelectedLocation(null);
              }}
              style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 20px", borderRadius: "5px", cursor: "pointer" }}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* TABLA */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflowX: "auto"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#007bff", color: "white" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Ubicación</th>
              <th style={{ padding: "12px" }}>Longitud</th>
              <th style={{ padding: "12px" }}>Latitud</th>
              <th style={{ padding: "12px" }}>Temperatura</th>
              <th style={{ padding: "12px" }}>Acciones</th>
              </tr>
          </thead>

          <tbody>
            {stations.map((s) => (
              <tr 
                key={s.id} 
                style={{ 
                  textAlign: "center", 
                  borderBottom: "1px solid #eee",
                  background: selectedLocation?.id === s.id ? "#fff3cd" : "transparent"
                }}
              >
                <td style={{ padding: "10px" }}>{s.id}</td>
                <td style={{ padding: "10px", fontWeight: "500" }}>{s.ubicacion}</td>
                <td style={{ padding: "10px" }}>{s.longitud}</td>
                <td style={{ padding: "10px" }}>{s.latitud}</td>
                <td style={{ padding: "10px" }}>{s.temperatura} °C</td>
                <td style={{ padding: "10px" }}>
                  <button 
                    onClick={() => handleEdit(s)} 
                    style={{ marginRight: "8px", padding: "5px 12px", cursor: "pointer", background: "#28a745", color: "white", border: "none", borderRadius: "4px" }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 12px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MAPA */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: "15px" }}>📍 Mapa de Estaciones</h2>

        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapCenter position={mapCenter} />

          {/* Marcadores de todas las estaciones */}
          {stations.map((s) => (
            <Marker key={s.id} position={[s.latitud, s.longitud]} icon={customIcon}>
              <Popup>
                <div style={{ textAlign: "center", minWidth: "150px" }}>
                  <strong style={{ fontSize: "14px" }}>{s.ubicacion}</strong><br />
                  🌡️ <strong>{s.temperatura}°C</strong><br />
                  📍 {s.latitud}, {s.longitud}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcador rojo para la ubicación seleccionada */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.latitud, selectedLocation.longitud]} 
              icon={redIcon}
            >
              <Popup>
                <div style={{ textAlign: "center", minWidth: "200px" }}>
                  <strong style={{ fontSize: "16px", color: "#d63031" }}>
                    📍 {selectedLocation.esEdicion ? "Usted está editando" : "Usted se encuentra aquí"}
                  </strong><br />
                  <strong style={{ fontSize: "15px" }}>{selectedLocation.ubicacion}</strong><br />
                  🌡️ {selectedLocation.temperatura}°C<br />
                  <small>
                    {selectedLocation.esEdicion 
                      ? "📍 Ubicación seleccionada para editar" 
                      : "✅ Ubicación guardada exitosamente"}
                  </small>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {selectedLocation && (
          <div style={{ 
            marginTop: "10px", 
            padding: "10px", 
            background: selectedLocation.esEdicion ? "#fff3cd" : "#d4edda",
            color: selectedLocation.esEdicion ? "#856404" : "#155724",
            borderRadius: "5px",
            textAlign: "center",
            animation: "fadeOut 8s forwards"
          }}>
            {selectedLocation.esEdicion ? (
              <>✏️ Editando: <strong>{selectedLocation.ubicacion}</strong> - El mapa se ha centrado en esta ubicación</>
            ) : (
              <>✅ ¡Ubicación "<strong>{selectedLocation.ubicacion}</strong>" guardada! El mapa se ha centrado en este punto</>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>

    </div>
  );
}

export default App;