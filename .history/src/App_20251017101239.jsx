import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, TrendingUp, Navigation, Grid, BarChart3 } from 'lucide-react';
import Papa from 'papaparse';

const DifferentialPrivacyVisualizer = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('laplace');
  const [selectedGraphType, setSelectedGraphType] = useState('heatmap');
  const [showOriginal, setShowOriginal] = useState(true);
  const [selectedK, setSelectedK] = useState(1);
  const [selectedEpsilon, setSelectedEpsilon] = useState('0.01264');
  const [selectedPaso, setSelectedPaso] = useState(1000);
  const [mapHTML, setMapHTML] = useState('');
  const [loading, setLoading] = useState(false);

  const algorithms = [
    { id: 'laplace', name: 'Laplace', icon: TrendingUp },
    { id: 'pivot', name: 'Pivot Sampling', icon: Navigation },
    { id: 'anchor', name: 'Anchor Pivot', icon: MapPin }
  ];

  const graphTypes = [
    { id: 'heatmap', name: 'Mapa de Calor', icon: Grid },
    { id: 'destinations', name: 'Destinos', icon: MapPin },
    { id: 'origins', name: 'Orígenes', icon: Navigation },
    { id: 'flows', name: 'Flujos OD', icon: BarChart3 }
  ];

  const epsilonValues = ['0.01264', '0.02148', '0.03032', '0.03916', '0.04358'];
  const kValues = [1, 2, 3, 4, 5];
  const pasoValues = [1000, 1500, 2000, 2500, 3000];

  const generateMap = async () => {
    setLoading(true);
    
    try {
      // Determinar carpeta y parámetros según algoritmo
      let folder = '';
      let paramStr = '';
      
      if (selectedAlgorithm === 'laplace') {
        folder = 'Laplace_data';
        paramStr = `eps${selectedEpsilon}_paso${selectedPaso}`;
      } else if (selectedAlgorithm === 'pivot') {
        folder = 'Pivot_data';
        paramStr = `k${selectedK}_paso${selectedPaso}`;
      } else {
        folder = 'Pivot_data_anchor';
        paramStr = `k${selectedK}_paso${selectedPaso}`;
      }

      // Cargar archivos CSV
      const odType = showOriginal ? 'original' : 'perturbada';
      const odFile = `${folder}/OD_${odType}_${paramStr}.csv`;
      const celdasFile = `${folder}/celdas_${paramStr}.csv`;
      const minimosFile = `${folder}/minimos_${paramStr}.csv`;

      // Simular carga de datos (en producción, usar fetch real)
      const mockData = generateMockMap();
      setMapHTML(mockData);
      
    } catch (error) {
      console.error('Error generando mapa:', error);
      setMapHTML('<div style="padding: 40px; text-align: center; color: #666;">Error al cargar los datos</div>');
    }
    
    setLoading(false);
  };

  const generateMockMap = () => {
    const algorithmName = algorithms.find(a => a.id === selectedAlgorithm)?.name;
    const graphName = graphTypes.find(g => g.id === selectedGraphType)?.name;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100%; }
          .info-box {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            font-family: system-ui;
          }
          .info-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #333; }
          .info-box p { margin: 5px 0; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="info-box">
          <h3>${algorithmName} - ${graphName}</h3>
          <p><strong>Tipo:</strong> ${showOriginal ? 'Original' : 'Perturbada'}</p>
          <p><strong>Paso:</strong> ${selectedPaso}m</p>
          ${selectedAlgorithm === 'laplace' ? `<p><strong>ε:</strong> ${selectedEpsilon}</p>` : `<p><strong>k:</strong> ${selectedK}</p>`}
        </div>
        <script>
          var map = L.map('map').setView([39.9, 116.4], 12);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(map);

          // Generar datos simulados
          const colors = ['#440154', '#31688e', '#35b779', '#fde724'];
          for (let i = 0; i < 50; i++) {
            const lat = 39.85 + Math.random() * 0.1;
            const lng = 116.35 + Math.random() * 0.1;
            const value = Math.floor(Math.random() * 20);
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            L.rectangle(
              [[lat, lng], [lat + 0.002, lng + 0.002]],
              {
                color: color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 1
              }
            ).bindPopup(\`Celda: \${i}<br>Viajes: \${value}\`).addTo(map);
          }
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    generateMap();
  }, [selectedAlgorithm, selectedGraphType, showOriginal, selectedK, selectedEpsilon, selectedPaso]);

  return (
    <div className="h-screen w-screen bg-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`bg-slate-800 transition-all duration-300 ease-in-out ${
          menuOpen ? 'w-1/4' : 'w-0'
        } overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Configuración
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Algoritmo */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-3 block">
              Algoritmo
            </label>
            <div className="space-y-2">
              {algorithms.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setSelectedAlgorithm(algo.id)}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedAlgorithm === algo.id
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <algo.icon className="w-4 h-4" />
                  <span className="font-medium">{algo.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Gráfica */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-3 block">
              Tipo de Visualización
            </label>
            <div className="space-y-2">
              {graphTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedGraphType(type.id)}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedGraphType === type.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parámetros */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-3 block">
              Paso (metros)
            </label>
            <select
              value={selectedPaso}
              onChange={(e) => setSelectedPaso(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:outline-none"
            >
              {pasoValues.map(p => (
                <option key={p} value={p}>{p}m</option>
              ))}
            </select>
          </div>

          {selectedAlgorithm === 'laplace' ? (
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-3 block">
                Epsilon (ε)
              </label>
              <select
                value={selectedEpsilon}
                onChange={(e) => setSelectedEpsilon(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:outline-none"
              >
                {epsilonValues.map(eps => (
                  <option key={eps} value={eps}>{eps}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-3 block">
                Multiplicador (k)
              </label>
              <select
                value={selectedK}
                onChange={(e) => setSelectedK(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-emerald-500 focus:outline-none"
              >
                {kValues.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-white">
              Análisis de Privacidad Diferencial en Trayectorias
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium transition-colors ${showOriginal ? 'text-purple-400' : 'text-slate-400'}`}>
              Original
            </span>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                showOriginal ? 'bg-purple-500' : 'bg-orange-500'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  showOriginal ? 'translate-x-0' : 'translate-x-8'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${!showOriginal ? 'text-orange-400' : 'text-slate-400'}`}>
              Perturbada
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-slate-900 p-6">
          <div className="h-full w-full bg-white rounded-xl shadow-2xl overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Generando visualización...</p>
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={mapHTML}
                className="w-full h-full border-0"
                title="Mapa de visualización"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifferentialPrivacyVisualizer;