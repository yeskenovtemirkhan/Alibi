// Coarse continent outlines (lon, lat). Rendered as dot-matrix, so precision is unnecessary.
type P = [number, number];
const POLYS: P[][] = [
  // North America
  [[-168,66],[-141,70],[-110,72],[-85,70],[-65,60],[-55,50],[-67,44],[-75,38],[-81,31],[-80,25],[-88,30],[-97,27],[-97,20],[-88,17],[-83,10],[-78,8],[-86,13],[-95,16],[-105,22],[-112,30],[-118,34],[-124,42],[-125,50],[-135,58],[-150,60],[-165,60]],
  // Greenland
  [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-70,76]],
  // South America
  [[-80,10],[-62,10],[-50,0],[-35,-6],[-40,-22],[-48,-28],[-58,-38],[-66,-46],[-70,-55],[-75,-48],[-73,-30],[-70,-18],[-81,-5]],
  // Eurasia (incl. Arabia, India)
  [[-10,36],[-9,43],[-2,47],[-4,48.5],[2,51],[8,54],[8,57],[5,60],[10,64],[15,69],[25,71],[40,68],[60,69],[75,73],[100,77],[140,73],[170,69],[178,65],[165,60],[156,51],[143,52],[140,46],[130,42],[126,37],[122,40],[120,35],[122,30],[118,24],[108,21],[106,10],[100,13],[103,1.5],[98,8],[94,17],[88,22],[80,15],[77,8],[73,17],[68,23],[62,25],[57,26],[56,24],[59,22],[52,16],[43,12],[39,21],[35,28],[34,31],[36,36],[27,37],[26,40],[20,40],[12,44],[3,43],[-1,37]],
  // Africa
  [[-17,21],[-10,30],[-6,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-2],[40,-15],[35,-25],[20,-35],[15,-28],[12,-12],[9,4],[-8,4],[-17,14]],
  // Australia
  [[114,-22],[122,-18],[136,-12],[142,-11],[153,-26],[150,-37],[140,-38],[130,-32],[115,-34]],
  // British Isles
  [[-5,50],[1,51],[2,53],[-2,57],[-5,58],[-6,55],[-3,54]],
  // Indonesia / Borneo
  [[95,5],[106,-6],[103,-5],[98,2]],
  [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
  // Japan
  [[130,31],[136,34],[141,38],[142,44],[139,40],[132,34]],
];

function inPoly(x: number, y: number, poly: P[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const isLand = (lon: number, lat: number) => POLYS.some((p) => inPoly(lon, lat, p));

const rad = (d: number) => (d * Math.PI) / 180;

export function project(lon: number, lat: number, lon0: number, lat0: number, R: number, cx: number, cy: number) {
  const l = rad(lon - lon0), p = rad(lat), p0 = rad(lat0);
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  const x = cx + R * Math.cos(p) * Math.sin(l);
  const y = cy - R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  return { x, y, visible: cosc > 0.02, depth: cosc };
}

/** Land as one dot-matrix path on an orthographic globe. */
export function globeLandPath(lon0: number, lat0: number, R: number, cx: number, cy: number, step = 2.6) {
  let d = "";
  for (let lat = -80; lat <= 84; lat += step) {
    const stepLon = step / Math.max(0.35, Math.cos(rad(lat)));
    for (let lon = -180; lon < 180; lon += stepLon) {
      if (!isLand(lon, lat)) continue;
      const q = project(lon, lat, lon0, lat0, R, cx, cy);
      if (!q.visible) continue;
      d += `M${q.x.toFixed(1)} ${q.y.toFixed(1)}h.01`;
    }
  }
  return d;
}

/** Land as dot-matrix on a flat equirectangular map (0..w, 0..h). */
export function flatLandPath(w: number, h: number, step = 3) {
  let d = "";
  for (let lat = 78; lat >= -56; lat -= step) {
    for (let lon = -170; lon <= 178; lon += step) {
      if (!isLand(lon, lat)) continue;
      const x = ((lon + 180) / 360) * w, y = ((90 - lat) / 146) * h;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}h.01`;
    }
  }
  return d;
}
