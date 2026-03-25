from flask import Flask, request, jsonify  # Importa Flask y utilidades para manejar requests/respuestas
from flask_cors import CORS                # Permite solicitudes desde otros dominios (ej: coectar el frontend)
from flask_sqlalchemy import SQLAlchemy    # ORM para manejar la base de datos con Python

app = Flask(__name__)  # Crea la aplicación Flask
CORS(app)              # Habilita CORS en toda la app

# Configuración BD
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stations.db'  # Archivo de base de datos local
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False             # Desactiva alertas innecesarias

db = SQLAlchemy(app)  # Conecta SQLAlchemy con la app Flask

# MODELO
class Station(db.Model):                                    # Define la tabla "station" en la BD
    id = db.Column(db.Integer, primary_key=True)            # ID único autoincremental
    ubicacion = db.Column(db.String(100))                   # Nombre/descripción del lugar
    longitud = db.Column(db.Float)                          # Coordenada longitud
    latitud = db.Column(db.Float)                           # Coordenada latitud
    temperatura = db.Column(db.Float)                       # Temperatura registrada

# CREAR BD
with app.app_context():  # Abre el contexto de la app
    db.create_all()      # Crea las tablas si no existen

# GET
@app.route('/stations', methods=['GET'])  # Endpoint para obtener todas las estaciones
def get_stations():
    stations = Station.query.all()  # Consulta todos los registros de la tabla
    return jsonify([                # Convierte la lista a JSON y la retorna
        {
            "id": s.id,
            "ubicacion": s.ubicacion,
            "longitud": s.longitud,
            "latitud": s.latitud,
            "temperatura": s.temperatura
        } for s in stations  # itera cada interaccion y la convierte en direcciones espefcificas 
    ])

# POST
@app.route('/stations', methods=['POST'])  # Endpoint para crear una nueva estación
def create_station():
    data = request.json  # Lee el cuerpo JSON del request
    new_station = Station(  # Crea un nuevo objeto Station con los datos recibidos
        ubicacion=data["ubicacion"],
        longitud=data["longitud"],
        latitud=data["latitud"],
        temperatura=data["temperatura"]
    )
    db.session.add(new_station)  # Agrega el objeto a la sesión de BD
    db.session.commit()          # Guarda los cambios en la BD
    return jsonify({"message": "Created"})  # Retorna confirmación

# PUT
@app.route('/stations/<int:id>', methods=['PUT'])  # Endpoint para actualizar una estación por ID
def update_station(id):
    station = Station.query.get(id)               # Busca la estación por su ID
    if not station:                                # Si no existe, retorna error 404
        return jsonify({"error": "Not found"}), 404

    data = request.json                # hace la respetiva lectura del request
    station.ubicacion = data["ubicacion"]    # Actualiza cada campo correspondiente 
    station.longitud = data["longitud"]
    station.latitud = data["latitud"]
    station.temperatura = data["temperatura"]

    db.session.commit()                          # Guarda los cambios
    return jsonify({"message": "Updated"})       # Hace el retorno de los cambios guardados 

# DELETE
@app.route('/stations/<int:id>', methods=['DELETE'])  # Endpoint para eliminar una estación por ID
def delete_station(id):
    station = Station.query.get(id)               # Busca la estación por su ID
    if not station:                                # Si no existe, retorna error 404
        return jsonify({"error": "Not found"}), 404

    db.session.delete(station)  # Marca el registro para eliminar
    db.session.commit()         # Ejecuta la eliminación en la BD
    return jsonify({"message": "Deleted"})  # Retorna confirmación

if __name__ == '__main__':
    app.run(debug=True)  # Inicia el servidor en modo debug (solo para desarrollo)