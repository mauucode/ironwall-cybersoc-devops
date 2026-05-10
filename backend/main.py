import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId # 👈 NUEVO: Para manejar IDs de Mongo

# Configuración de Logs
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    filename="logs/audit.log",
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/cybersoc")
try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client.get_database() 
    coleccion_incidentes = db["incidentes"]
    logging.info("Conexion a MongoDB exitosa.")
except Exception as e:
    logging.error(f"Error al conectar a MongoDB: {e}")

@app.post("/api/incidentes/reportar")
async def reportar_incidente(request: Request):
    datos = await request.json()
    tipo = datos.get("tipo", "Desconocido")
    descripcion = datos.get("descripcion", "Sin detalles")
    nuevo_incidente = {
        "tipo": tipo,
        "descripcion": descripcion,
        "estado": "Abierto",
        "fecha": datos.get("fecha", "Hoy")
    }
    try:
        coleccion_incidentes.insert_one(nuevo_incidente)
        logging.info(f"Nuevo incidente guardado en DB: Tipo {tipo}")
        return {"status": "success"}
    except Exception as e:
        return {"status": "error"}

@app.get("/api/incidentes")
async def obtener_incidentes():
    try:
        incidentes_cursor = coleccion_incidentes.find({})
        incidentes = []
        for inc in incidentes_cursor:
            inc["_id"] = str(inc["_id"]) # 👈 NUEVO: Convertimos el ID a texto para React
            incidentes.append(inc)
        return {"status": "success", "data": incidentes}
    except Exception as e:
        return {"status": "error"}

# 👈 NUEVO ENDPOINT: Para actualizar el estado a Resuelto
@app.patch("/api/incidentes/{incidente_id}/resolver")
async def resolver_incidente(incidente_id: str):
    try:
        coleccion_incidentes.update_one(
            {"_id": ObjectId(incidente_id)},
            {"$set": {"estado": "Resuelto"}}
        )
        logging.info(f"Incidente {incidente_id} marcado como Resuelto.")
        return {"status": "success"}
    except Exception as e:
        return {"status": "error"}