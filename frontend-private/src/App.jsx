import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// Iconos
const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;

function App() {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('panorama'); // 'panorama' o 'logs'

  const cargarIncidentes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/incidentes');
      const data = await response.json();
      if (data.status === 'success') {
        // Invertimos para ver los más nuevos arriba
        setIncidentes(data.data.reverse()); 
      }
    } catch (error) {
      console.error("Error al cargar:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIncidentes();
  }, []);

  // Lógica Real: Actualizar en MongoDB
  const marcarComoResuelto = async (id_mongo) => {
    try {
      await fetch(`http://localhost:5000/api/incidentes/${id_mongo}/resolver`, {
        method: 'PATCH'
      });
      cargarIncidentes(); // Recargamos para traer los datos frescos
    } catch (error) {
      console.error("Error al resolver:", error);
    }
  };

  // --- Procesamiento de Datos para Gráficas ---
  const incidentesAbiertos = incidentes.filter(i => i.estado === 'Abierto').length;
  const incidentesResueltos = incidentes.filter(i => i.estado === 'Resuelto').length;
  
  // Datos para Gráfica de Dona (Estado)
  const dataEstado = [
    { name: 'Resueltos', value: incidentesResueltos, color: '#10b981' },
    { name: 'Abiertos', value: incidentesAbiertos, color: '#f59e0b' }
  ];

  // Datos para Gráfica de Barras (Tipos de Ataque)
  const conteoTipos = incidentes.reduce((acc, inc) => {
    acc[inc.tipo] = (acc[inc.tipo] || 0) + 1;
    return acc;
  }, {});
  const dataTipos = Object.keys(conteoTipos).map(key => ({
    name: key.replace(' / Ransomware', '').replace(' / Suplantación de Identidad', ''), 
    cantidad: conteoTipos[key]
  }));

  return (
    <div className="layout-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <IconShield />
          <h2>IronWall</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${vistaActual === 'panorama' ? 'active' : ''}`} onClick={() => setVistaActual('panorama')}>
            <IconDashboard /> Panorama General
          </a>
          <a href="#" className={`nav-item ${vistaActual === 'logs' ? 'active' : ''}`} onClick={() => setVistaActual('logs')}>
            <IconAlert /> Logs de Amenazas
          </a>
          <div className="system-status">
            <span className="dot pulse"></span>
            <p>Conexión Segura (VPC)</p>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1 className="page-title">{vistaActual === 'panorama' ? 'SOC Dashboard' : 'Registro de Eventos'}</h1>
            <p className="page-subtitle">Centro de Operaciones de Seguridad</p>
          </div>
          <button onClick={cargarIncidentes} className="btn-refresh">Actualizar Red</button>
        </header>

        {/* VISTA: PANORAMA (Métricas y Gráficas) */}
        {vistaActual === 'panorama' && (
          <>
            <section className="kpi-grid">
              <div className="kpi-card"><div className="kpi-header">Total Eventos</div><div className="kpi-value">{incidentes.length}</div></div>
              <div className="kpi-card"><div className="kpi-header">Casos Abiertos</div><div className="kpi-value text-warning">{incidentesAbiertos}</div></div>
              <div className="kpi-card"><div className="kpi-header">Eficacia de Resolución</div><div className="kpi-value text-success">{incidentes.length ? Math.round((incidentesResueltos/incidentes.length)*100) : 0}%</div></div>
            </section>

            {/* SECCIÓN DE GRÁFICAS */}
            <section className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              
              {/* Gráfica 1: Tipos de Ataques */}
              <div className="chart-container" style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '20px' }}>Vectores de Ataque Detectados</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataTipos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica 2: Estado de Tickets */}
              <div className="chart-container" style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '20px' }}>Estado de Incidentes</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dataEstado} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {dataEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {/* VISTA: LOGS DE AMENAZAS (La Tabla Completa) */}
        {vistaActual === 'logs' && (
          <section className="operations-panel">
            <div className="panel-header"><h3>Registro Maestro de Telemetría</h3></div>
            <div className="table-responsive">
              <table className="cyber-table">
                <thead>
                  <tr><th>ID</th><th>Vector</th><th>Detalles</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {cargando ? <tr><td colSpan="5">Cargando...</td></tr> : incidentes.map((inc) => (
                    <tr key={inc._id} className={inc.estado === 'Resuelto' ? 'row-resolved' : ''}>
                      <td className="font-mono text-sm">{inc._id.substring(0,8)}...</td>
                      <td><span className={`badge ${inc.tipo.includes('Malware') ? 'badge-danger' : 'badge-warning'}`}>{inc.tipo}</span></td>
                      <td className="desc-cell text-sm">{inc.descripcion}</td>
                      <td><span className={`status-indicator ${inc.estado === 'Abierto' ? 'status-open' : 'status-closed'}`}>{inc.estado}</span></td>
                      <td>
                        {inc.estado === 'Abierto' ? (
                          <button onClick={() => marcarComoResuelto(inc._id)} className="btn-action">Mitigar / Resolver</button>
                        ) : <span className="text-muted text-sm">Mitigado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;