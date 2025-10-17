import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, TrendingUp, Navigation, Grid, BarChart3, ArrowRightLeft } from 'lucide-react';
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
    { id: 'flows', name: 'Flujos OD', icon: ArrowRightLeft }
  ];

  const epsilonValues = ['0.01264', '0.02148', '0.03032', '0.03916', '0.04358'];
  const kValues = [1, 2, 3, 4, 5];
  const pasoValues = [1000, 1500, 2000, 2500, 3000];

  const loadCSVData = async (folder, paramStr, odType) => {
    try {
      const odFile = `/${folder}/OD_${odType}_${paramStr}.csv`;
      const celdasFile = `/${folder}/celdas_${paramStr}.csv`;
      const minimosFile = `/${folder}/minimos_${paramStr}.csv`;
      console.log('Archivos a cargar:', { odFile, celdasFile, minimosFile });

      const [odResponse, celdasResponse, minimosResponse] = await Promise.all([
        fetch(odFile),
        fetch(celdasFile),
        fetch(minimosFile)
      ]);

      if (!odResponse.ok || !celdasResponse.ok || !minimosResponse.ok) {
        throw new Error('Error cargando archivos CSV');
      }

      const [odText, celdasText, minimosText] = await Promise.all([
        odResponse.text(),
        celdasResponse.text(),
        minimosResponse.text()
      ]);

      const odData = Papa.parse(odText, { header: true, dynamicTyping: true }).data;
      const celdasData = Papa.parse(celdasText, { header: true, dynamicTyping: true }).data;
      const minimosData = Papa.parse(minimosText, { header: true, dynamicTyping: true }).data;

      console.log('Datos cargados exitosamente desde:', { odFile, celdasFile, minimosFile });
      // Convertir OD a matriz
      const OD = odData.map(row => Object.values(row).filter(v => typeof v === 'number'));
      
      // Convertir celdas a diccionario
      const celdas = {};
      celdasData.forEach(row => {
        if (row.i !== undefined && row.j !== undefined && row.indice !== undefined) {
          celdas[`${row.i},${row.j}`] = row.indice;
        }
      });

      const lat_min = minimosData[0].lat_min;
      const lon_min = minimosData[0].lon_min;

      return { OD, celdas, lat_min, lon_min };
    } catch (error) {
      console.error('Error cargando datos:', error);
      throw error;
    }
  };

  const generateHeatmap = (OD, celdas, lat_min, lon_min, paso_m, odType) => {
    const viajes_por_celda = OD.map((row, i) => row[i] || 0);
    const max_viajes = Math.max(...viajes_por_celda);
    
    const celdasArray = Object.entries(celdas).map(([key, idx]) => {
      const [i, j] = key.split(',').map(Number);
      return { i, j, idx };
    });

    let rectangles = '';
    celdasArray.forEach(({ i, j, idx }) => {
      const paso_lat = paso_m / 111000;
      const paso_lon = paso_m / (111000 * Math.cos((lat_min * Math.PI) / 180));
      const lat_c = lat_min + (i + 0.5) * paso_lat;
      const lon_c = lon_min + (j + 0.5) * paso_lon;
      const radio_lat = (paso_m / 2) / 111000;
      const radio_lon = (paso_m / 2) / (111000 * Math.cos((lat_c * Math.PI) / 180));

      const intensidad = viajes_por_celda[idx] || 0;
      const normalizado = max_viajes > 0 ? intensidad / max_viajes : 0;
      
      // Plasma colormap
      const r = Math.floor(255 * (0.267 + normalizado * 0.733));
      const g = Math.floor(255 * (0.005 + normalizado * 0.567));
      const b = Math.floor(255 * (0.329 + normalizado * 0.573));
      const color = `rgb(${r},${g},${b})`;

      rectangles += `
        L.rectangle(
          [[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]],
          {
            color: '${color}',
            fillColor: '${color}',
            fillOpacity: 0.7,
            weight: 1
          }
        ).bindPopup('Zona: ${idx}<br>Viajes: ${intensidad}').addTo(map);
      `;
    });

    return rectangles;
  };

  const generateDestinations = (OD, celdas, lat_min, lon_min, paso_m) => {
    const viajes_por_celda = Array(OD.length).fill(0);
    for (let j = 0; j < OD[0].length; j++) {
      for (let i = 0; i < OD.length; i++) {
        viajes_por_celda[j] += OD[i][j] || 0;
      }
    }
    
    const max_viajes = Math.max(...viajes_por_celda);
    const celdasArray = Object.entries(celdas).map(([key, idx]) => {
      const [i, j] = key.split(',').map(Number);
      return { i, j, idx };
    });

    let rectangles = '';
    celdasArray.forEach(({ i, j, idx }) => {
      const paso_lat = paso_m / 111000;
      const paso_lon = paso_m / (111000 * Math.cos((lat_min * Math.PI) / 180));
      const lat_c = lat_min + (i + 0.5) * paso_lat;
      const lon_c = lon_min + (j + 0.5) * paso_lon;
      const radio_lat = (paso_m / 2) / 111000;
      const radio_lon = (paso_m / 2) / (111000 * Math.cos((lat_c * Math.PI) / 180));

      const intensidad = viajes_por_celda[idx] || 0;
      const normalizado = max_viajes > 0 ? intensidad / max_viajes : 0;
      
      const r = Math.floor(255 * (0.267 + normalizado * 0.733));
      const g = Math.floor(255 * (0.005 + normalizado * 0.567));
      const b = Math.floor(255 * (0.329 + normalizado * 0.573));
      const color = `rgb(${r},${g},${b})`;

      rectangles += `
        L.rectangle(
          [[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]],
          {
            color: '${color}',
            fillColor: '${color}',
            fillOpacity: 0.7,
            weight: 1
          }
        ).bindPopup('Zona destino: ${idx}<br>Viajes recibidos: ${intensidad}').addTo(map);
      `;
    });

    return rectangles;
  };

  const generateOrigins = (OD, celdas, lat_min, lon_min, paso_m) => {
    const viajes_por_celda = OD.map(row => row.reduce((a, b) => a + (b || 0), 0));
    const max_viajes = Math.max(...viajes_por_celda);
    
    const celdasArray = Object.entries(celdas).map(([key, idx]) => {
      const [i, j] = key.split(',').map(Number);
      return { i, j, idx };
    });

    let rectangles = '';
    celdasArray.forEach(({ i, j, idx }) => {
      const paso_lat = paso_m / 111000;
      const paso_lon = paso_m / (111000 * Math.cos((lat_min * Math.PI) / 180));
      const lat_c = lat_min + (i + 0.5) * paso_lat;
      const lon_c = lon_min + (j + 0.5) * paso_lon;
      const radio_lat = (paso_m / 2) / 111000;
      const radio_lon = (paso_m / 2) / (111000 * Math.cos((lat_c * Math.PI) / 180));

      const intensidad = viajes_por_celda[idx] || 0;
      const normalizado = max_viajes > 0 ? intensidad / max_viajes : 0;
      
      const r = Math.floor(255 * (0.267 + normalizado * 0.733));
      const g = Math.floor(255 * (0.005 + normalizado * 0.567));
      const b = Math.floor(255 * (0.329 + normalizado * 0.573));
      const color = `rgb(${r},${g},${b})`;

      rectangles += `
        L.rectangle(
          [[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]],
          {
            color: '${color}',
            fillColor: '${color}',
            fillOpacity: 0.7,
            weight: 1
          }
        ).bindPopup('Zona origen: ${idx}<br>Viajes enviados: ${intensidad}').addTo(map);
      `;
    });

    return rectangles;
  };

  const generateFlows = (OD, celdas, lat_min, lon_min, paso_m) => {
    const max_viajes = Math.max(...OD.flat());
    const celdasArray = Object.entries(celdas).map(([key, idx]) => {
      const [i, j] = key.split(',').map(Number);
      return { i, j, idx };
    });

    // Función auxiliar para obtener coordenadas
    const getCellCenter = (idx) => {
      const cell = celdasArray.find(c => c.idx === idx);
      if (!cell) return null;
      const paso_lat = paso_m / 111000;
      const paso_lon = paso_m / (111000 * Math.cos((lat_min * Math.PI) / 180));
      const lat_c = lat_min + (cell.i + 0.5) * paso_lat;
      const lon_c = lon_min + (cell.j + 0.5) * paso_lon;
      return [lat_c, lon_c];
    };

    let flows = '';
    for (let i = 0; i < OD.length; i++) {
      for (let j = 0; j < OD[i].length; j++) {
        if (OD[i][j] > 0) {
          const origin = getCellCenter(i);
          const dest = getCellCenter(j);
          if (!origin || !dest) continue;

          const weight = 2 + (OD[i][j] / max_viajes * 5);
          const normalizado = OD[i][j] / max_viajes;
          const r = Math.floor(255 * (1 - normalizado));
          const b = Math.floor(255 * normalizado);
          const color = `rgba(${r},0,${b},0.6)`;

          flows += `
            L.polyline(
              [[${origin[0]}, ${origin[1]}], [${dest[0]}, ${dest[1]}]],
              {
                color: '${color}',
                weight: ${weight},
                opacity: 0.6
              }
            ).bindPopup('Viajes desde celda ${i} a celda ${j}: ${OD[i][j]}').addTo(map);
          `;
        }
      }
    }

    return flows;
  };

  const generateMap = async () => {
    setLoading(true);
    
    try {
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

      const odType = showOriginal ? 'original' : 'perturbada';
      const { OD, celdas, lat_min, lon_min } = await loadCSVData(folder, paramStr, odType);

      let mapContent = '';
      if (selectedGraphType === 'heatmap') {
        mapContent = generateHeatmap(OD, celdas, lat_min, lon_min, selectedPaso, odType);
      } else if (selectedGraphType === 'destinations') {
        mapContent = generateDestinations(OD, celdas, lat_min, lon_min, selectedPaso);
      } else if (selectedGraphType === 'origins') {
        mapContent = generateOrigins(OD, celdas, lat_min, lon_min, selectedPaso);
      } else if (selectedGraphType === 'flows') {
        mapContent = generateFlows(OD, celdas, lat_min, lon_min, selectedPaso);
      }

      const algorithmName = algorithms.find(a => a.id === selectedAlgorithm)?.name;
      const graphName = graphTypes.find(g => g.id === selectedGraphType)?.name;
      
      const html = `
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
            var map = L.map('map').setView([${lat_min + 0.05}, ${lon_min + 0.05}], 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
              subdomains: 'abcd',
              maxZoom: 20
            }).addTo(map);

            ${mapContent}
          </script>
        </body>
        </html>
      `;
      
      setMapHTML(html);
    } catch (error) {
      console.error('Error generando mapa:', error);
      setMapHTML(`
        <div style="padding: 40px; text-align: center; color: #666;">
          <h3>Error al cargar los datos</h3>
          <p>${error.message}</p>
          <p style="font-size: 12px; margin-top: 20px;">Asegúrate de que los archivos CSV estén en la carpeta public/</p>
        </div>
      `);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    generateMap();
  }, [selectedAlgorithm, selectedGraphType, showOriginal, selectedK, selectedEpsilon, selectedPaso]);

  return (
    <div className="h-screen w-screen bg-slate-900 flex overflow-hidden">
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

      <div className="flex-1 flex flex-col">
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