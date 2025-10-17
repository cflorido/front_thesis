import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, TrendingUp, Navigation, Grid, BarChart3, ArrowRightLeft, HeatLamp } from 'lucide-react';
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
    { id: 'matrix', name: 'Matriz OD', icon: HeatLamp },
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

      const OD = odData.map(row => Object.values(row).filter(v => typeof v === 'number'));
      
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

  const generateMatrixHeatmap = (OD) => {
    const maxValue = Math.max(...OD.flat());
    const size = OD.length;
    const cellSize = Math.max(20, 500 / size);

    let svg = `<svg width="${cellSize * size + 60}" height="${cellSize * size + 100}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family: Arial, sans-serif; font-size: 11px; }
        .axis-label { fill: #333; text-anchor: middle; }
        .value-text { fill: #fff; text-anchor: middle; dominant-baseline: middle; font-weight: bold; font-size: 10px; }
      </style>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffcc;stop-opacity:1" />
          <stop offset="25%" style="stop-color:#a1dab4;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#41b6c4;stop-opacity:1" />
          <stop offset="75%" style="stop-color:#225ea8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0c2c84;stop-opacity:1" />
        </linearGradient>
      </defs>
      <text x="${cellSize * size / 2 + 30}" y="20" class="axis-label" font-weight="bold" font-size="14">Matriz OD</text>
      <text x="${cellSize * size / 2 + 30}" y="${cellSize * size + 75}" class="axis-label">Destino →</text>
      <text x="15" y="${cellSize * size / 2 + 50}" class="axis-label" transform="rotate(-90 15 ${cellSize * size / 2 + 50})">Origen</text>`;

    OD.forEach((row, i) => {
      row.forEach((value, j) => {
        const normalizado = maxValue > 0 ? value / maxValue : 0;
        
        // YlGnBu colormap (Yellow-Green-Blue)
        let r, g, b;
        if (normalizado < 0.25) {
          const t = normalizado / 0.25;
          r = 255;
          g = 255;
          b = Math.floor(204 + (52 - 204) * t);
        } else if (normalizado < 0.5) {
          const t = (normalizado - 0.25) / 0.25;
          r = Math.floor(255 - (161 - 255) * t);
          g = Math.floor(255 - (212 - 255) * t);
          b = Math.floor(52 + (18 - 52) * t);
        } else if (normalizado < 0.75) {
          const t = (normalizado - 0.5) / 0.25;
          r = Math.floor(161 - (65 - 161) * t);
          g = Math.floor(212 - (131 - 212) * t);
          b = Math.floor(18 + (68 - 18) * t);
        } else {
          const t = (normalizado - 0.75) / 0.25;
          r = Math.floor(65 - (12 - 65) * t);
          g = Math.floor(131 - (44 - 131) * t);
          b = Math.floor(68 + (132 - 68) * t);
        }

        const color = `rgb(${r},${g},${b})`;
        const x = 50 + j * cellSize;
        const y = 40 + i * cellSize;

        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="#ccc" stroke-width="0.5"/>`;
        
        if (cellSize > 25 && value > 0) {
          svg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2}" class="value-text">${value}</text>`;
        }
      });
    });

    // Leyenda
    const legendY = cellSize * size + 60;
    svg += `<text x="50" y="${legendY}" class="axis-label" font-size="10">Valor mín: 0</text>`;
    svg += `<text x="${cellSize * size - 50}" y="${legendY}" class="axis-label" font-size="10">Máx: ${Math.round(maxValue)}</text>`;
    
    svg += '</svg>';
    return svg;
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

      let content = '';
      if (selectedGraphType === 'matrix') {
        content = generateMatrixHeatmap(OD);
      } else if (selectedGraphType === 'heatmap') {
        content = generateHeatmap(OD, celdas, lat_min, lon_min, selectedPaso, odType);
      } else if (selectedGraphType === 'destinations') {
        content = generateDestinations(OD, celdas, lat_min, lon_min, selectedPaso);
      } else if (selectedGraphType === 'origins') {
        content = generateOrigins(OD, celdas, lat_min, lon_min, selectedPaso);
      } else if (selectedGraphType === 'flows') {
        content = generateFlows(OD, celdas, lat_min, lon_min, selectedPaso);
      }

      const algorithmName = algorithms.find(a => a.id === selectedAlgorithm)?.name;
      const graphName = graphTypes.find(g => g.id === selectedGraphType)?.name;
      
      if (selectedGraphType === 'matrix') {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; font-family: system-ui; }
              .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              h1 { color: #333; margin-bottom: 10px; }
              .info { color: #666; font-size: 14px; margin-bottom: 20px; }
              .svg-container { overflow-x: auto; display: flex; justify-content: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${algorithmName} - ${graphName}</h1>
              <div class="info">
                <p><strong>Tipo:</strong> ${showOriginal ? 'Original' : 'Perturbada'} | <strong>Paso:</strong> ${selectedPaso}m ${selectedAlgorithm === 'laplace' ? `| <strong>ε:</strong> ${selectedEpsilon}` : `| <strong>k:</strong> ${selectedK}`}</p>
              </div>
              <div class="svg-container">
                ${content}
              </div>
            </div>
          </body>
          </html>
        `;
        setMapHTML(html);
      } else {
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

              ${content}
            </script>
          </body>
          </html>
        `;
        setMapHTML(html);
      }
    } catch (error) {
      console.error('Error generando visualización:', error);
      setMapHTML(`
        <div style="padding: 40px; text-align: center; color: #666; font-family: system-ui;">
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