import { useState } from 'react';
import './App.css';

// SVG Icono de Escudo Moderno
const ShieldIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
  </svg>
);

// SVG Icono de Alerta
const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

function App() {
  const [tipo, setTipo] = useState('Malware/Ransomware');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const enviarReporte = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Enviando reporte seguro...', tipo: 'info' });

    try {
      const response = await fetch('http://localhost:5000/api/incidentes/reportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, descripcion })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setMensaje({ texto: '¡Incidente reportado! Nuestro equipo SOC lo investigará.', tipo: 'success' });
        setDescripcion('');
      } else {
        setMensaje({ texto: 'Error al reportar el incidente.', tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Fallo de conexión con los servidores seguros.', tipo: 'error' });
    }
  };

  return (
    <div className="soc-landing">
      {/* Encabezado Profesional */}
      <header className="soc-header">
        <ShieldIcon />
        <div className="title-group">
          <h1>IRONWALL CyberSOC</h1>
          <p>Portal Público de Respuesta a Incidentes (V1.0)</p>
        </div>
      </header>
      
      {/* Panel Central de Reporte */}
      <main className="soc-main">
        <form onSubmit={enviarReporte} className="report-form">
          <div className="form-header">
            <h2>REPORTAR UNA BRECHA DE SEGURIDAD</h2>
            <p>Utiliza este formulario para notificar sobre un posible incidente de seguridad.</p>
          </div>

          <div className="form-group">
            <label htmlFor="tipoAtaca">Tipo de Ataque Detected:</label>
            <select id="tipoAtaque" value={tipo} onChange={(e) => setTipo(e.target.value)} className="soc-input soc-select">
              <option value="Malware/Ransomware">Malware / Ransomware</option>
              <option value="Phishing">Phishing / Suplantación de Identidad</option>
              <option value="Acceso No Autorizado">Acceso No Autorizado a Sistemas</option>
              <option value="Fuga de Datos">Fuga de Datos Críticos (Data Leak)</option>
              <option value="Ataque DDoS">Ataque DDoS</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="descripcionIncidente">Descripción del Incidente (Sea específico):</label>
            <textarea 
              id="descripcionIncidente"
              rows="6" 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              placeholder="Por favor describa lo sucedido, indicando la fecha aproximada y los sistemas afectados si los conoce..."
              required
              className="soc-input soc-textarea"
            />
          </div>
          
          <button type="submit" className="soc-btn soc-btn-danger">
            <AlertIcon /> ENVIAR REPORTE AL SOC
          </button>
        </form>
        
        {/* Banner de Mensajes Dinámico */}
        {mensaje.texto && (
          <div className={`status-banner status-${mensaje.tipo}`}>
            {mensaje.tipo === 'success' ? '✅' : '📡'} {mensaje.texto}
          </div>
        )}
      </main>

      <footer className="soc-footer">
        <p>Propiedad de IronWall Technologies. © 2026</p>
        <p>Conexión segura y cifrada para todos los reportes.</p>
      </footer>
    </div>
  );
}

export default App;