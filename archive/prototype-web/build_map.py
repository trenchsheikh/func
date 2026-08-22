#!/usr/bin/env python3
"""Convert real OSM geometry for San Francisco into compact SVG path data
for the Func. prototype map. Output: JS module with tiered street paths,
water/park polygons, and named arterials for labelling."""
import json, math, os

SD = os.path.dirname(os.path.abspath(__file__))

# Render window (the "world" the camera pans over)
LAT0, LAT1 = 37.7560, 37.8040
LON0, LON1 = -122.4440, -122.3870
W = 4000.0   # output units across


def merc(lon, lat):
    x = (lon + 180.0) / 360.0
    s = math.sin(math.radians(lat))
    y = 0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)
    return x, y


X0, Y1 = merc(LON0, LAT0)
X1, Y0 = merc(LON1, LAT1)
SCALE = W / (X1 - X0)
H = (Y1 - Y0) * SCALE


def proj(lon, lat):
    x, y = merc(lon, lat)
    return ((x - X0) * SCALE, (y - Y0) * SCALE)


def rdp(pts, eps):
    """Ramer-Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    den = math.hypot(dx, dy)
    imax, dmax = 0, -1.0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        if den == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            d = abs(dy * px - dx * py + bx * ay - by * ax) / den
        if d > dmax:
            imax, dmax = i, d
    if dmax > eps:
        left = rdp(pts[:imax + 1], eps)
        right = rdp(pts[imax:], eps)
        return left[:-1] + right
    return [pts[0], pts[-1]]


def fmt(v):
    r = round(v, 1)
    return str(int(r)) if r == int(r) else str(r)


def path_of(pts):
    out = ["M", fmt(pts[0][0]), fmt(pts[0][1])]
    for x, y in pts[1:]:
        out += ["L", fmt(x), fmt(y)]
    return "".join(out[0] + out[1] + "," + out[2] if False else "") or (
        "M%s,%s" % (fmt(pts[0][0]), fmt(pts[0][1]))
        + "".join("L%s,%s" % (fmt(x), fmt(y)) for x, y in pts[1:])
    )


def load(name):
    with open(os.path.join(SD, name)) as f:
        return json.load(f)["elements"]


def clip_ok(pts):
    """Keep ways with at least one point inside a generous margin."""
    for x, y in pts:
        if -200 <= x <= W + 200 and -200 <= y <= H + 200:
            return True
    return False


TIER = {
    "motorway": "hw", "motorway_link": "hw", "trunk": "hw", "trunk_link": "hw",
    "primary": "pri", "primary_link": "pri",
    "secondary": "sec", "secondary_link": "sec",
    "tertiary": "ter", "tertiary_link": "ter",
}

tiers = {"hw": [], "pri": [], "sec": [], "ter": [], "res": []}
labels = {}

for el in load("sf_roads.json"):
    if el.get("type") != "way" or "geometry" not in el:
        continue
    tags = el.get("tags", {})
    t = TIER.get(tags.get("highway", ""))
    if not t:
        continue
    pts = [proj(g["lon"], g["lat"]) for g in el["geometry"]]
    if not clip_ok(pts):
        continue
    pts = rdp(pts, 1.2)
    if len(pts) < 2:
        continue
    tiers[t].append(pts)
    nm = tags.get("name")
    if nm and t in ("hw", "pri", "sec"):
        # longest segment wins as the label anchor
        L = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        prev = labels.get(nm)
        if not prev or L > prev[0]:
            mid = pts[len(pts) // 2]
            a = pts[0]
            b = pts[-1]
            ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
            if ang > 90:
                ang -= 180
            if ang < -90:
                ang += 180
            labels[nm] = (L, mid[0], mid[1], ang)

for el in load("sf_res.json"):
    if el.get("type") != "way" or "geometry" not in el:
        continue
    pts = [proj(g["lon"], g["lat"]) for g in el["geometry"]]
    if not clip_ok(pts):
        continue
    pts = rdp(pts, 1.6)
    if len(pts) < 2:
        continue
    L = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
    if L < 18:
        continue
    tiers["res"].append(pts)

water, parks = [], []
for el in load("sf_area.json"):
    tags = el.get("tags", {})
    geoms = []
    if el.get("type") == "way" and "geometry" in el:
        geoms = [el["geometry"]]
    elif el.get("type") == "relation":
        for m in el.get("members", []):
            if m.get("role") == "outer" and "geometry" in m:
                geoms.append(m["geometry"])
    for g in geoms:
        pts = [proj(p["lon"], p["lat"]) for p in g]
        if len(pts) < 4 or not clip_ok(pts):
            continue
        pts = rdp(pts, 2.5)
        if len(pts) < 4:
            continue
        area = abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1]
                       - pts[(i + 1) % len(pts)][0] * pts[i][1]
                       for i in range(len(pts)))) / 2
        if tags.get("natural") == "water":
            if area > 4000:
                water.append(pts)
        elif tags.get("leisure") == "park":
            if area > 2500:
                parks.append(pts)

joined = {k: " ".join(path_of(p) for p in v) for k, v in tiers.items()}
wpath = " ".join(path_of(p) + "Z" for p in water)
ppath = " ".join(path_of(p) + "Z" for p in parks)

# Keep only substantial named arterials for labelling
lab = sorted(labels.items(), key=lambda kv: -kv[1][0])[:26]
lab_out = [{"n": n, "x": round(v[1], 1), "y": round(v[2], 1), "a": round(v[3])}
           for n, v in lab]

out = {
    "w": round(W), "h": round(H),
    "bbox": [LON0, LAT0, LON1, LAT1],
    "water": wpath, "parks": ppath,
    "hw": joined["hw"], "pri": joined["pri"], "sec": joined["sec"],
    "ter": joined["ter"], "res": joined["res"],
    "labels": lab_out,
}

with open(os.path.join(SD, "sfmap.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"))

tot = sum(len(v) for v in [wpath, ppath] + list(joined.values()))
print("H =", round(H))
for k, v in joined.items():
    print("  %-4s %6d ways %8d chars" % (k, len(tiers[k]), len(v)))
print("  water %d polys %d chars" % (len(water), len(wpath)))
print("  parks %d polys %d chars" % (len(parks), len(ppath)))
print("TOTAL path chars:", tot)
print("labels:", [l["n"] for l in lab_out])
