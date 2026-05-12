import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId

os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    filename="logs/audit.log", level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/cybersoc")
try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client.get_database() 
    coleccion_incidentes = db["incidentes"]
except Exception as e:
    logging.error(f"Error Mongo: {e}")

# 1. Crear Ticket (Ahora retorna el ID)
@app.post("/api/incidentes/reportar")
async def reportar_incidente(request: Request):
    datos = await request.json()
    nuevo_incidente = {
        "entidad": datos.get("entidad", "Anónimo"),
        "tipo": datos.get("tipo", "Desconocido"),
        "severidad": datos.get("severidad", "medium"),
        "descripcion": datos.get("descripcion", "Sin detalles"),
        "estado": "Recibido", # Estado inicial
        "fecha": datos.get("fecha", "Hoy")
    }
    try:
        resultado = coleccion_incidentes.insert_one(nuevo_incidente)
        ticket_id = str(resultado.inserted_id)
        logging.info(f"Ticket creado: {ticket_id}")
        return {"status": "success", "ticket_id": ticket_id}
    except Exception as e:
        return {"status": "error"}

# 2. Consultar TODOS los tickets (Para el SOC)
@app.get("/api/incidentes")
async def obtener_incidentes():
    try:
        incidentes = []
        for inc in coleccion_incidentes.find({}):
            inc["_id"] = str(inc["_id"])
            incidentes.append(inc)
        return {"status": "success", "data": incidentes}
    except Exception as e:
        return {"status": "error"}

# 3. Consultar UN ticket por ID (Para el tracking del usuario)
@app.get("/api/incidentes/{ticket_id}")
async def obtener_un_incidente(ticket_id: str):
    try:
        inc = coleccion_incidentes.find_one({"_id": ObjectId(ticket_id)})
        if inc:
            inc["_id"] = str(inc["_id"])
            return {"status": "success", "data": inc}
        return {"status": "error", "message": "Ticket no encontrado"}
    except InvalidId:
        return {"status": "error", "message": "ID Inválido"}

# 4. Actualizar Estado del Ticket (Recibido, En Revisión, Falso Positivo, Mitigado)
@app.patch("/api/incidentes/{incidente_id}/estado")
async def actualizar_estado(incidente_id: str, request: Request):
    datos = await request.json()
    nuevo_estado = datos.get("estado")
    try:
        coleccion_incidentes.update_one(
            {"_id": ObjectId(incidente_id)},
            {"$set": {"estado": nuevo_estado}}
        )
        logging.info(f"Ticket {incidente_id} cambió a {nuevo_estado}.")
        return {"status": "success"}
    except Exception as e:
        return {"status": "error"}