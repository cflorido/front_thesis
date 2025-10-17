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
    { id: 'odmatrix', name: 'Matriz Origen-Destino', icon: Grid },
    { id: 'destinations', name: 'Mapa de Calor Celdas Destino', icon: MapPin },
    { id: 'origins', name: 'Mapa de Calor Celdas Origen', icon: Navigation },
    { id: 'flows', name: 'Flujos Oriden-Destino', icon: ArrowRightLeft },
    { id: 'difference', name: 'Diferencia Absoluta O-D', icon: BarChart3 }, // ← AGREGAR ESTA LÍNEA

  ];

  const epsilonValues = ['0.01264', '0.02148', '0.03032', '0.03916', '0.04358'];
  const kValues = [1, 2, 3, 4, 5];
  const pasoValues = [1000, 1500, 2000, 2500, 3000];

  // Función auxiliar para colormap plasma (idéntica a matplotlib)
  const getPlasmaColor = (normalizado) => {
    const plasma = [
      [0.050383, 0.029803, 0.527975], [0.063536, 0.028426, 0.533124], [0.075353, 0.027206, 0.538007],
      [0.086222, 0.026125, 0.542658], [0.096379, 0.025165, 0.547103], [0.105980, 0.024309, 0.551368],
      [0.115124, 0.023556, 0.555468], [0.123903, 0.022878, 0.559423], [0.132381, 0.022258, 0.563250],
      [0.140603, 0.021687, 0.566959], [0.148607, 0.021154, 0.570562], [0.156421, 0.020651, 0.574065],
      [0.164070, 0.020171, 0.577478], [0.171574, 0.019706, 0.580806], [0.178950, 0.019252, 0.584054],
      [0.186213, 0.018803, 0.587228], [0.193374, 0.018354, 0.590330], [0.200445, 0.017902, 0.593364],
      [0.207435, 0.017442, 0.596333], [0.214350, 0.016973, 0.599239], [0.221197, 0.016497, 0.602083],
      [0.227983, 0.016007, 0.604867], [0.234715, 0.015502, 0.607592], [0.241396, 0.014979, 0.610259],
      [0.248032, 0.014439, 0.612868], [0.254627, 0.013882, 0.615419], [0.261183, 0.013308, 0.617911],
      [0.267703, 0.012716, 0.620346], [0.274191, 0.012109, 0.622722], [0.280648, 0.011488, 0.625038],
      [0.287076, 0.010855, 0.627295], [0.293478, 0.010213, 0.629490], [0.299855, 0.009561, 0.631624],
      [0.306210, 0.008902, 0.633694], [0.312543, 0.008239, 0.635700], [0.318856, 0.007576, 0.637640],
      [0.325150, 0.006915, 0.639512], [0.331426, 0.006261, 0.641316], [0.337683, 0.005618, 0.643049],
      [0.343925, 0.004991, 0.644710], [0.350150, 0.004382, 0.646298], [0.356359, 0.003798, 0.647810],
      [0.362553, 0.003243, 0.649245], [0.368733, 0.002724, 0.650601], [0.374897, 0.002245, 0.651876],
      [0.381047, 0.001814, 0.653068], [0.387183, 0.001434, 0.654177], [0.393304, 0.001114, 0.655199],
      [0.399411, 0.000859, 0.656133], [0.405503, 0.000678, 0.656977], [0.411580, 0.000577, 0.657730],
      [0.417642, 0.000564, 0.658390], [0.423689, 0.000646, 0.658956], [0.429719, 0.000831, 0.659425],
      [0.435734, 0.001127, 0.659797], [0.441732, 0.001540, 0.660069], [0.447714, 0.002080, 0.660240],
      [0.453677, 0.002755, 0.660310], [0.459623, 0.003574, 0.660277], [0.465550, 0.004545, 0.660139],
      [0.471457, 0.005678, 0.659897], [0.477344, 0.006980, 0.659549], [0.483210, 0.008460, 0.659095],
      [0.489055, 0.010127, 0.658534], [0.494877, 0.011990, 0.657865], [0.500678, 0.014055, 0.657088],
      [0.506454, 0.016333, 0.656202], [0.512206, 0.018833, 0.655209], [0.517933, 0.021563, 0.654109],
      [0.523633, 0.024532, 0.652901], [0.529306, 0.027747, 0.651586], [0.534952, 0.031217, 0.650165],
      [0.540570, 0.034950, 0.648640], [0.546157, 0.038954, 0.647010], [0.551715, 0.043136, 0.645277],
      [0.557243, 0.047331, 0.643443], [0.562738, 0.051545, 0.641509], [0.568201, 0.055778, 0.639477],
      [0.573632, 0.060028, 0.637349], [0.579029, 0.064296, 0.635126], [0.584391, 0.068579, 0.632812],
      [0.589719, 0.072878, 0.630408], [0.595011, 0.077190, 0.627917], [0.600266, 0.081516, 0.625342],
      [0.605485, 0.085854, 0.622686], [0.610667, 0.090204, 0.619951], [0.615812, 0.094564, 0.617140],
      [0.620919, 0.098934, 0.614257], [0.625987, 0.103312, 0.611305], [0.631017, 0.107699, 0.608287],
      [0.636008, 0.112092, 0.605205], [0.640959, 0.116492, 0.602065], [0.645872, 0.120898, 0.598867],
      [0.650746, 0.125309, 0.595617], [0.655580, 0.129725, 0.592317], [0.660374, 0.134144, 0.588971],
      [0.665129, 0.138566, 0.585582], [0.669845, 0.142992, 0.582154], [0.674522, 0.147419, 0.578688],
      [0.679160, 0.151848, 0.575189], [0.683758, 0.156278, 0.571660], [0.688318, 0.160709, 0.568103],
      [0.692840, 0.165141, 0.564522], [0.697324, 0.169573, 0.560919], [0.701769, 0.174005, 0.557296],
      [0.706178, 0.178437, 0.553657], [0.710549, 0.182868, 0.550004], [0.714883, 0.187299, 0.546338],
      [0.719181, 0.191729, 0.542663], [0.723444, 0.196158, 0.538981], [0.727670, 0.200586, 0.535293],
      [0.731862, 0.205013, 0.531601], [0.736019, 0.209439, 0.527908], [0.740143, 0.213864, 0.524216],
      [0.744232, 0.218288, 0.520524], [0.748289, 0.222711, 0.516834], [0.752312, 0.227133, 0.513149],
      [0.756304, 0.231555, 0.509468], [0.760264, 0.235976, 0.505794], [0.764193, 0.240396, 0.502126],
      [0.768090, 0.244817, 0.498465], [0.771958, 0.249237, 0.494813], [0.775796, 0.253658, 0.491171],
      [0.779604, 0.258078, 0.487539], [0.783383, 0.262500, 0.483918], [0.787133, 0.266922, 0.480307],
      [0.790855, 0.271345, 0.476706], [0.794549, 0.275770, 0.473117], [0.798216, 0.280197, 0.469538],
      [0.801855, 0.284626, 0.465971], [0.805467, 0.289057, 0.462415], [0.809052, 0.293491, 0.458870],
      [0.812612, 0.297928, 0.455338], [0.816144, 0.302368, 0.451816], [0.819651, 0.306812, 0.448306],
      [0.823132, 0.311261, 0.444806], [0.826588, 0.315714, 0.441316], [0.830018, 0.320172, 0.437836],
      [0.833422, 0.324635, 0.434366], [0.836801, 0.329105, 0.430905], [0.840155, 0.333580, 0.427455],
      [0.843484, 0.338062, 0.424013], [0.846788, 0.342551, 0.420579], [0.850066, 0.347048, 0.417153],
      [0.853319, 0.351553, 0.413734], [0.856547, 0.356066, 0.410322], [0.859750, 0.360588, 0.406917],
      [0.862927, 0.365119, 0.403519], [0.866078, 0.369660, 0.400126], [0.869203, 0.374212, 0.396738],
      [0.872303, 0.378774, 0.393355], [0.875376, 0.383347, 0.389976], [0.878423, 0.387932, 0.386600],
      [0.881443, 0.392529, 0.383229], [0.884436, 0.397139, 0.379860], [0.887402, 0.401762, 0.376494],
      [0.890340, 0.406398, 0.373130], [0.893250, 0.411048, 0.369768], [0.896131, 0.415712, 0.366407],
      [0.898984, 0.420392, 0.363047], [0.901807, 0.425087, 0.359688], [0.904601, 0.429797, 0.356329],
      [0.907365, 0.434524, 0.352970], [0.910098, 0.439268, 0.349610], [0.912800, 0.444029, 0.346251],
      [0.915471, 0.448807, 0.342890], [0.918109, 0.453603, 0.339529], [0.920714, 0.458417, 0.336166],
      [0.923287, 0.463251, 0.332801], [0.925825, 0.468103, 0.329435], [0.928329, 0.472975, 0.326067],
      [0.930798, 0.477867, 0.322697], [0.933232, 0.482780, 0.319325], [0.935630, 0.487712, 0.315952],
      [0.937990, 0.492667, 0.312575], [0.940313, 0.497642, 0.309197], [0.942598, 0.502639, 0.305816],
      [0.944844, 0.507658, 0.302433], [0.947051, 0.512699, 0.299049], [0.949217, 0.517763, 0.295662],
      [0.951344, 0.522850, 0.292275], [0.953428, 0.527960, 0.288883], [0.955470, 0.533093, 0.285490],
      [0.957469, 0.538250, 0.282096], [0.959424, 0.543431, 0.278701], [0.961336, 0.548636, 0.275305],
      [0.963203, 0.553865, 0.271909], [0.965024, 0.559118, 0.268513], [0.966798, 0.564396, 0.265118],
      [0.968526, 0.569700, 0.261721], [0.970205, 0.575028, 0.258325], [0.971835, 0.580382, 0.254931],
      [0.973416, 0.585761, 0.251540], [0.974947, 0.591165, 0.248151], [0.976428, 0.596595, 0.244767],
      [0.977856, 0.602051, 0.241387], [0.979233, 0.607532, 0.238013], [0.980556, 0.613039, 0.234646],
      [0.981826, 0.618572, 0.231287], [0.983041, 0.624131, 0.227937], [0.984199, 0.629718, 0.224595],
      [0.985301, 0.635330, 0.221265], [0.986345, 0.640969, 0.217948], [0.987332, 0.646633, 0.214648],
      [0.988260, 0.652325, 0.211364], [0.989128, 0.658043, 0.208100], [0.989935, 0.663787, 0.204859],
      [0.990681, 0.669558, 0.201642], [0.991365, 0.675355, 0.198453], [0.991985, 0.681179, 0.195295],
      [0.992541, 0.687030, 0.192170], [0.993032, 0.692907, 0.189084], [0.993456, 0.698810, 0.186041],
      [0.993814, 0.704741, 0.183043], [0.994103, 0.710698, 0.180097], [0.994324, 0.716681, 0.177208],
      [0.994474, 0.722691, 0.174381], [0.994553, 0.728728, 0.171622], [0.994561, 0.734791, 0.168938],
      [0.994495, 0.740880, 0.166335], [0.994355, 0.746995, 0.163821], [0.994141, 0.753137, 0.161404],
      [0.993851, 0.759304, 0.159092], [0.993482, 0.765499, 0.156891], [0.993033, 0.771720, 0.154808],
      [0.992505, 0.777967, 0.152855], [0.991897, 0.784239, 0.151042], [0.991206, 0.790537, 0.149377],
      [0.990434, 0.796859, 0.147870], [0.989580, 0.803205, 0.146529], [0.988648, 0.809579, 0.145357],
      [0.987621, 0.815975, 0.144363], [0.986509, 0.822396, 0.143557], [0.985314, 0.828840, 0.142945],
      [0.984031, 0.835308, 0.142528], [0.982653, 0.841797, 0.142303], [0.981190, 0.848308, 0.142279],
      [0.979644, 0.854842, 0.142453], [0.977995, 0.861396, 0.142808], [0.976265, 0.867971, 0.143351],
      [0.974443, 0.874565, 0.144061], [0.972530, 0.881180, 0.144923], [0.970533, 0.887814, 0.145919],
      [0.968443, 0.894467, 0.147014], [0.966271, 0.901138, 0.148180], [0.964021, 0.907828, 0.149370],
      [0.961681, 0.914536, 0.150520], [0.959276, 0.921262, 0.151566], [0.956808, 0.928005, 0.152409],
      [0.954287, 0.934766, 0.152921], [0.951726, 0.941544, 0.152925], [0.949151, 0.948340, 0.152178],
      [0.946602, 0.955153, 0.150328], [0.944152, 0.961982, 0.146861], [0.943257, 0.968659, 0.140956],
      [0.944141, 0.975158, 0.131326]
    ];
    const idx = Math.min(Math.floor(normalizado * (plasma.length - 1)), plasma.length - 1);
    const color = plasma[idx];
    return `rgb(${Math.round(color[0] * 255)},${Math.round(color[1] * 255)},${Math.round(color[2] * 255)})`;
  };
const getYlGnBuColor = (t) => {
  // Paleta YlGnBu de Matplotlib (256 colores reducidos)
  const colors = [
    [255,255,217],[237,248,177],[199,233,180],[127,205,187],[65,182,196],
    [29,145,192],[34,94,168],[12,44,132]
  ];
  const n = colors.length - 1;
  const i = Math.floor(t * n);
  const frac = t * n - i;
  const c0 = colors[i];
  const c1 = colors[Math.min(i + 1, n)];
  const r = Math.round(c0[0] + frac * (c1[0] - c0[0]));
  const g = Math.round(c0[1] + frac * (c1[1] - c0[1]));
  const b = Math.round(c0[2] + frac * (c1[2] - c0[2]));
  return `rgb(${r},${g},${b})`;
};
const generateODMatrix = (OD) => {
  const maxVal = Math.max(...OD.flat());
  const rows = OD.length;
  const cols = OD[0].length;

  const marginLeft = 80;
  const marginBottom = 80;
  const marginTop = 60;
  const marginRight = 180;

  const maxVisibleWidth = 800;
  const maxVisibleHeight = 800;

  const availableWidth = maxVisibleWidth - marginLeft - marginRight;
  const availableHeight = maxVisibleHeight - marginTop - marginBottom;

  let cellSize = Math.min(availableWidth / cols, availableHeight / rows);
  const minCell = 2;
  if (cellSize < minCell) cellSize = minCell;

  const svgWidth = marginLeft + cols * cellSize + marginRight;
  const svgHeight = marginTop + rows * cellSize + marginBottom;

  const scale = Math.min(maxVisibleWidth / svgWidth, maxVisibleHeight / svgHeight, 1);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100vh;
          background: white;
          font-family: Arial, sans-serif;
          overflow: hidden;
        }
.container {
  display: flex;
  flex-direction: row; /* ya está correcto, fila principal */
  align-items: flex-start;
  justify-content: center;
  gap: 60px;
  padding: 10px;
  overflow: auto;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .matrix-title {
          font-size: 22px;
          font-weight: bold;
          color: #222;
          text-align: center;
          margin-bottom: 15px;
        }
        svg {
          border: 1px solid #ddd;
          background: white;
          transform: scale(${scale});
          transform-origin: top left;
        }
        /* Leyenda */
     /* Leyenda */
.legend-box {
  display: flex;
  flex-direction: column; /* título arriba */
  align-items: center;
  gap: 10px;
}

.legend-title {
  font-weight: bold;
  font-size: 13px;
  text-align: center;
  color: #333;
}

/* contenedor de barra + números */
.legend-scale {
  display: flex;
  flex-direction: row; /* barra a la izquierda, números a la derecha */
  align-items: center; /* centrar verticalmente */
  gap: 5px;
}

.legend-gradient {
  width: 40px;
  height: 300px; /* ajustable según tamaño de la matriz */
  border: 1px solid #ccc;
  border-radius: 4px;
  background: linear-gradient(
    to top,
    rgb(12, 44, 132),
    rgb(29, 145, 192),
    rgb(65, 182, 196),
    rgb(127, 205, 187),
    rgb(199, 233, 180),
    rgb(237, 248, 177),
    rgb(255, 255, 217)
  );
}

.legend-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* distribuye los números a lo largo de la barra */
  height: 300px; /* misma altura que la barra */
  font-size: 11px;
  color: #555;
  text-align: left;
}


      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="matrix-title">Matriz Origen–Destino</div>
          <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  `;

  // Fondo
  html += `<rect width="${svgWidth}" height="${svgHeight}" fill="white"/>`;

  // Celdas
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const val = OD[i][j] || 0;
      const norm = maxVal > 0 ? val / maxVal : 0;
      const color = getYlGnBuColor(norm);
      const x = marginLeft + j * cellSize;
      const y = marginTop + i * cellSize;
      html += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="#f0f0f0" stroke-width="0.5"/>`;
    }
  }

  // Ejes
  html += `<line x1="${marginLeft}" y1="${marginTop + rows * cellSize}" x2="${marginLeft + cols * cellSize}" y2="${marginTop + rows * cellSize}" stroke="#333" stroke-width="1"/>`;
  html += `<text x="${marginLeft + cols * cellSize / 2}" y="${marginTop + rows * cellSize + 35}" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">Destino</text>`;

  const xStep = Math.max(1, Math.floor(cols / 12));
  for (let j = 0; j < cols; j += xStep) {
    const x = marginLeft + j * cellSize + cellSize / 2;
    const y = marginTop + rows * cellSize + 18;
    html += `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" fill="#666">${j}</text>`;
  }

  html += `<line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + rows * cellSize}" stroke="#333" stroke-width="1"/>`;
  html += `<text x="20" y="${marginTop + rows * cellSize / 2}" text-anchor="middle" font-size="12" fill="#333" font-weight="bold" transform="rotate(-90 20 ${marginTop + rows * cellSize / 2})">Origen</text>`;
  
const yStep = Math.max(1, Math.floor(rows / 12));
  for (let i = 0; i < rows; i += yStep) {
    const x = marginLeft - 8;
    const y = marginTop + i * cellSize + cellSize / 2 + 3;
    html += `<text x="${x}" y="${y}" text-anchor="end" font-size="9" fill="#666">${i}</text>`;
  }

  // PRIMERO cerrar el SVG y el div.content
  html += `</svg>
        </div>`;

  // AHORA calcular la leyenda
  const legendHeight = Math.min(300, rows * cellSize);

  // AHORA agregar la leyenda como hermano
  html += `
        <div class="legend-box">
    <div class="legend-title">Viajes<br>0 a ${Math.round(maxVal)}</div>
    <div class="legend-scale">
      <div class="legend-gradient" style="
        height: ${legendHeight}px;
        background: linear-gradient(
          to bottom,
          rgb(12, 44, 132),
          rgb(29, 145, 192),
          rgb(65, 182, 196),
          rgb(127, 205, 187),
          rgb(199, 233, 180),
          rgb(237, 248, 177),
          rgb(255, 255, 217)
        );
      "></div>
      <div class="legend-labels" style="height: ${legendHeight}px;">
        <span><strong>${Math.round(maxVal)}</strong></span>
        <span>${Math.round(maxVal * 0.75)}</span>
        <span>${Math.round(maxVal * 0.5)}</span>
        <span>${Math.round(maxVal * 0.25)}</span>
        <span><strong>0</strong></span>
      </div>
    </div>
  </div>
`;

  return html;
};


  const loadCSVData = async (folder, paramStr, odType) => {
    try {
      const odFile = `/${folder}/OD_${odType}_${paramStr}.csv`;
      const celdasFile = `/${folder}/celdas_${paramStr}.csv`;
      const minimosFile = `/${folder}/minimos_${paramStr}.csv`;

      const [odResponse, celdasResponse, minimosResponse] = await Promise.all([
        fetch(odFile), fetch(celdasFile), fetch(minimosFile)
      ]);

      if (!odResponse.ok || !celdasResponse.ok || !minimosResponse.ok) {
        throw new Error('Error cargando archivos CSV');
      }

      const [odText, celdasText, minimosText] = await Promise.all([
        odResponse.text(), celdasResponse.text(), minimosResponse.text()
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

      return { OD, celdas, lat_min: minimosData[0].lat_min, lon_min: minimosData[0].lon_min };
    } catch (error) {
      console.error('Error cargando datos:', error);
      throw error;
    }
  };

  const generateHeatmap = (OD, celdas, lat_min, lon_min, paso_m) => {
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
      const color = getPlasmaColor(normalizado);

      rectangles += `L.rectangle([[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]], {color: '${color}', fillColor: '${color}', fillOpacity: 0.7, weight: 1}).bindPopup('Zona: ${idx}<br>Viajes: ${intensidad}').addTo(map);`;
    });
    return rectangles;
  };

  const generateDestinations = (OD, celdas, lat_min, lon_min, paso_m) => {
    const viajes_por_celda = Array(OD[0].length).fill(0);
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
      const color = getPlasmaColor(normalizado);

      rectangles += `L.rectangle([[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]], {color: '${color}', fillColor: '${color}', fillOpacity: 0.7, weight: 1}).bindPopup('Zona destino: ${idx}<br>Viajes recibidos: ${intensidad}').addTo(map);`;
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
      const color = getPlasmaColor(normalizado);

      rectangles += `L.rectangle([[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]], {color: '${color}', fillColor: '${color}', fillOpacity: 0.7, weight: 1}).bindPopup('Zona origen: ${idx}<br>Viajes enviados: ${intensidad}').addTo(map);`;
    });
    return rectangles;
  };
const generateDifference = async (celdas, lat_min, lon_min, paso_m, folder, paramStr) => {
  // Cargar ambas matrices
  const { OD: OD_original } = await loadCSVData(folder, paramStr, 'original');
  const { OD: OD_perturbada } = await loadCSVData(folder, paramStr, 'perturbada');
  
  // Calcular diferencia TOTAL por celda (suma de filas + columnas)
  const diferencias = OD_original.map((row, i) => {
    let diff_total = 0;
    
    // Diferencia de viajes DESDE esta celda (fila i completa)
    for (let j = 0; j < row.length; j++) {
      diff_total += Math.abs((OD_original[i][j] || 0) - (OD_perturbada[i][j] || 0));
    }
    
    // Diferencia de viajes HACIA esta celda (columna i completa)
    for (let j = 0; j < OD_original.length; j++) {
      if (j !== i) { // Evitar contar dos veces la diagonal
        diff_total += Math.abs((OD_original[j][i] || 0) - (OD_perturbada[j][i] || 0));
      }
    }
    
    return diff_total;
  });
  
  const max_diferencia = Math.max(...diferencias);
  
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

    const diferencia = diferencias[idx] || 0;
    const normalizado = max_diferencia > 0 ? diferencia / max_diferencia : 0;
    const color = getPlasmaColor(normalizado);

    rectangles += `L.rectangle([[${lat_c - radio_lat}, ${lon_c - radio_lon}], [${lat_c + radio_lat}, ${lon_c + radio_lon}]], {color: '${color}', fillColor: '${color}', fillOpacity: 0.7, weight: 1}).bindPopup('Zona: ${idx}<br>Diferencia Total: ${diferencia.toFixed(2)} viajes<br>(Origen + Destino)').addTo(map);`;
  });
  
  return rectangles;
};

const generateFlows = (OD, celdas, lat_min, lon_min, paso_m) => {
    // Calcular viajes por celda origen y destino
    const viajes_por_celda_origen = OD.map(row => row.reduce((a, b) => a + (b || 0), 0));
    const viajes_por_celda_destino = Array(OD[0].length).fill(0);
    for (let j = 0; j < OD[0].length; j++) {
      for (let i = 0; i < OD.length; i++) {
        viajes_por_celda_destino[j] += OD[i][j] || 0;
      }
    }

    const max_origen = Math.max(...viajes_por_celda_origen);
    const max_destino = Math.max(...viajes_por_celda_destino);
    const max_viajes = Math.max(...OD.flat());
      window.maxOrigen = max_origen;
  window.maxDestino = max_destino;
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

    const getCellBounds = (i, j) => {
      const paso_lat = paso_m / 111000;
      const paso_lon = paso_m / (111000 * Math.cos((lat_min * Math.PI) / 180));
      const lat_c = lat_min + (i + 0.5) * paso_lat;
      const lon_c = lon_min + (j + 0.5) * paso_lon;
      const radio_lat = (paso_m / 2) / 111000;
      const radio_lon = (paso_m / 2) / (111000 * Math.cos((lat_c * Math.PI) / 180));
      return [[lat_c - radio_lat, lon_c - radio_lon], [lat_c + radio_lat, lon_c + radio_lon]];
    };

    // Colormap para azul (origen)
    const getBlueColor = (normalizado) => {
      const intensity = Math.floor(normalizado * 255);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    };

    // Colormap para rojo (destino)
    const getRedColor = (normalizado) => {
      const intensity = Math.floor(normalizado * 255);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    };

    let content = '';

    // Dibujar celdas con colores combinados y tooltips detallados
    celdasArray.forEach(({ i, j, idx }) => {
      const bounds = getCellBounds(i, j);
      const intensidad_origen = viajes_por_celda_origen[idx] || 0;
      const intensidad_destino = viajes_por_celda_destino[idx] || 0;

      const norm_origen = max_origen > 0 ? intensidad_origen / max_origen : 0;
      const norm_destino = max_destino > 0 ? intensidad_destino / max_destino : 0;

      const color_origen = getBlueColor(norm_origen);
      const color_destino = getRedColor(norm_destino);

      // Extraer valores RGB y combinar
      const rgb_origen = color_origen.match(/\d+/g).map(Number);
      const rgb_destino = color_destino.match(/\d+/g).map(Number);
      const color_combinado = `rgb(${Math.floor((rgb_origen[0] + rgb_destino[0]) / 2)}, ${Math.floor((rgb_origen[1] + rgb_destino[1]) / 2)}, ${Math.floor((rgb_origen[2] + rgb_destino[2]) / 2)})`;

      // Crear detalle de viajes recibidos
      let detalle_origenes = '';
      for (let origen = 0; origen < OD.length; origen++) {
        if (OD[origen][idx] > 0) {
          if (origen === idx) {
            detalle_origenes += ` → Desde esta misma celda: ${OD[origen][idx]} viaje(s)<br>`;
          } else {
            detalle_origenes += ` → Desde celda ${origen}: ${OD[origen][idx]} viaje(s)<br>`;
          }
        }
      }

      const tooltip = `<b>Celda ${idx}</b><br>Total viajes enviados desde esta celda: ${intensidad_origen}<br>Total viajes recibidos en esta celda: ${intensidad_destino}<br><b>Detalle viajes recibidos:</b><br>${detalle_origenes}`;

      content += `L.rectangle([${JSON.stringify(bounds[0])}, ${JSON.stringify(bounds[1])}], {
        color: 'black',
        weight: 1,
        fillColor: '${color_combinado}',
        fillOpacity: 0.5
      }).bindPopup(\`${tooltip}\`).addTo(map);`;
    });

    // Dibujar líneas animadas (usando polyline decorada con animación CSS)
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
      const color = `rgb(${r},0,${b})`;
      
      // Color rojo claro para la línea base
      const baseLineColor = `rgba(220, 100, 100, 0.4)`;

      content += `
        // Línea base roja clara y sólida
        L.polyline([${JSON.stringify(origin)}, ${JSON.stringify(dest)}], {
          color: '#DC6464',
          weight: ${weight + 1},
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Línea con dots animados (línea punteada)
        var line${i}_${j} = L.polyline([${JSON.stringify(origin)}, ${JSON.stringify(dest)}], {
          color: '${color}',
          weight: ${weight},
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-dots-line',
          dashArray: '2, 8'
        }).bindPopup('<b>Flujo:</b> Celda ${i} → ${j}<br><b>Viajes:</b> ${OD[i][j]}').addTo(map);
      `;
    }
  }
}

    return content;
  };

  const generateMap = async () => {
    setLoading(true);
    
    try {
      let maxViajesForLegend = 0;

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
 
if (selectedGraphType === 'destinations') {
  const viajesPorCelda = Array(OD[0].length).fill(0);
  for (let j = 0; j < OD[0].length; j++) {
    for (let i = 0; i < OD.length; i++) {
      viajesPorCelda[j] += OD[i][j] || 0;
    }
  }
  maxViajesForLegend = Math.max(...viajesPorCelda);
} else if (selectedGraphType === 'heatmap') {
  const viajesPorCelda = OD.map((row, i) => row[i] || 0);
  maxViajesForLegend = Math.max(...viajesPorCelda);
} else if (selectedGraphType === 'origins') {
  const viajesPorCelda = OD.map(row => row.reduce((a, b) => a + (b || 0), 0));
  maxViajesForLegend = Math.max(...viajesPorCelda);
} else if (selectedGraphType === 'flows') {
  const viajesPorCelda_origen = OD.map(row => row.reduce((a, b) => a + (b || 0), 0));
  const viajesPorCelda_destino = Array(OD[0].length).fill(0);
  for (let j = 0; j < OD[0].length; j++) {
    for (let i = 0; i < OD.length; i++) {
      viajesPorCelda_destino[j] += OD[i][j] || 0;
    }
  }
  window.maxOrigen = Math.max(...viajesPorCelda_origen);
  window.maxDestino = Math.max(...viajesPorCelda_destino);
} else if (selectedGraphType === 'difference') {  // ← AGREGAR DESDE AQUÍ
  const { OD: OD_original } = await loadCSVData(folder, paramStr, 'original');
  const { OD: OD_perturbada } = await loadCSVData(folder, paramStr, 'perturbada');
  const diferencias = OD_original.map((row, i) => 
    Math.abs((OD_original[i][i] || 0) - (OD_perturbada[i][i] || 0))
  );
  maxViajesForLegend = Math.max(...diferencias);
}
      let mapContent = '';
      if (selectedGraphType === 'heatmap') {
        mapContent = generateHeatmap(OD, celdas, lat_min, lon_min, selectedPaso, odType);
      } else if (selectedGraphType === 'destinations') {
        mapContent = generateDestinations(OD, celdas, lat_min, lon_min, selectedPaso);
      } else if (selectedGraphType === 'origins') {
  mapContent = generateOrigins(OD, celdas, lat_min, lon_min, selectedPaso);
} else if (selectedGraphType === 'difference') {  // ← AGREGAR ESTAS 3 LÍNEAS
  mapContent = await generateDifference(celdas, lat_min, lon_min, selectedPaso, folder, paramStr);
} else if (selectedGraphType === 'flows') {
        mapContent = generateFlows(OD, celdas, lat_min, lon_min, selectedPaso);
      }else if (selectedGraphType === 'odmatrix') {
        const svg = generateODMatrix(OD);
        setMapHTML(svg);
        setLoading(false);
        return;
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
              .legend {
              position: absolute;
              bottom: 10px;
              right: 10px;
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              z-index: 999;
              font-family: system-ui;
            }
            .legend h4 { margin: 0 0 10px 0; font-size: 12px; color: #333; }
            .legend-item { display: flex; align-items: center; gap: 8px; margin: 5px 0; font-size: 11px; }
            .legend-color { width: 20px; height: 20px; border: 1px solid #ccc; }

            .info-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #333; }
            .info-box p { margin: 5px 0; font-size: 12px; color: #666; }
            @keyframes flowAnimation {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -30; }
}

.animated-flow-line {
  animation: flowAnimation 2s linear infinite !important;
}
   @keyframes dotsFlow {
    0% { 
      stroke-dashoffset: 0;
    }
    100% { 
      stroke-dashoffset: -20;
    }
  }

  .animated-dots-line {
    animation: dotsFlow 1.5s linear infinite;
    filter: drop-shadow(0 0 1px rgba(255,255,255,0.5));
  }
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
          <div class="legend">
            ${selectedGraphType === 'flows' ? `
              <h4>Flujos O-D</h4>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #333;">Origen (Azul)</p>
                <div style="width: 150px; height: 15px; background: linear-gradient(to right, rgb(255,255,255), rgb(0,0,255)); border: 1px solid #ccc; border-radius: 3px;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; color: #666;">
                  <span>0</span>
                  <span>${window.maxOrigen}</span>
                </div>
              </div>
              <div>
                <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #333;">Destino (Rojo)</p>
                <div style="width: 150px; height: 15px; background: linear-gradient(to right, rgb(255,255,255), rgb(255,0,0)); border: 1px solid #ccc; border-radius: 3px;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; color: #666;">
                  <span>0</span>
                  <span>${window.maxDestino}</span>
                </div>
              </div>
            ` : `
              <h4>${selectedGraphType === 'difference' ? 'Diferencia Absoluta' : 'Viajes'} (0 a ${Math.round(maxViajesForLegend)})</h4>
              <div style="width: 150px; height: 15px; background: linear-gradient(to right, ${Array.from({length: 10}, (_, i) => getPlasmaColor(i / 9)).join(', ')}); border: 1px solid #ccc; border-radius: 3px;"></div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 5px; color: #666;">
                <span>Mín</span>
                <span>Máx</span>
              </div>
            `}
          </div>
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