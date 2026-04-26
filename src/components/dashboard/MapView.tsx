import { useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import { Map as MapLibre } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Facility, PointAggregate } from "@/lib/types";
import { trustToRGBA } from "@/lib/trust";

interface MapViewProps {
  points: PointAggregate[];
  facilities: Facility[];
  onFacilityClick: (f: Facility) => void;
  anomalyMode: boolean;
  highlightIds?: Set<string>;
}

// Above this zoom we hide the aggregated 3D hex layer and show individual points.
const HEX_HIDE_ZOOM = 7;

const INITIAL_VIEW_STATE = {
  longitude: 79.0,
  latitude: 22.5,
  zoom: 4.2,
  pitch: 45,
  bearing: 0,
  minZoom: 3,
  maxZoom: 14,
} as unknown as Record<string, never>;

// CARTO dark — free, no token
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function MapView({ points, facilities, onFacilityClick, anomalyMode, highlightIds }: MapViewProps) {
  const [zoom, setZoom] = useState<number>(INITIAL_VIEW_STATE.zoom as unknown as number);
  // In anomaly mode we always show individual points (no hex aggregation) so 148 anomalies
  // don't visually inflate into entire painted regions.
  const showHex = !anomalyMode && zoom < HEX_HIDE_ZOOM;
  // Scale point radius up as we zoom in for better visibility.
  const pointRadius = Math.max(3, Math.min(9, 3 + (zoom - 4) * 0.9));

  const layers = useMemo(() => {
    // Trust gradient (red → green) for normal mode
    const trustColorRange: [number, number, number][] = [
      [239, 68, 68],
      [245, 158, 11],
      [250, 204, 21],
      [163, 230, 53],
      [52, 211, 153],
      [16, 185, 129],
    ];
    // Density gradient (light → deep red) for anomaly mode — more anomalies = deeper red
    const anomalyColorRange: [number, number, number][] = [
      [254, 226, 226],
      [252, 165, 165],
      [248, 113, 113],
      [239, 68, 68],
      [220, 38, 38],
      [153, 27, 27],
    ];

    const hex = showHex
      ? new HexagonLayer({
          id: "facility-hex",
          data: points,
          getPosition: (d: PointAggregate) => [d.lon, d.lat],
          getElevationWeight: (d: PointAggregate) => (anomalyMode ? 1 : d.weight),
          getColorWeight: (d: PointAggregate) => (anomalyMode ? 1 : d.trust),
          colorAggregation: anomalyMode ? "SUM" : "MEAN",
          elevationAggregation: "SUM",
          radius: 18000,
          elevationScale: anomalyMode ? 600 : 220,
          extruded: true,
          coverage: 0.85,
          colorRange: anomalyMode ? anomalyColorRange : trustColorRange,
          pickable: false,
          opacity: 0.85,
          material: { ambient: 0.6, diffuse: 0.8, shininess: 32 },
        })
      : null;

    const scatter = new ScatterplotLayer({
      id: "facility-points",
      data: facilities,
      pickable: true,
      stroked: true,
      filled: true,
      radiusUnits: "pixels",
      getPosition: (f: Facility) => [f.lon, f.lat],
      getRadius: (f: Facility) => (f.is_suspicious ? pointRadius + 1.5 : pointRadius),
      getFillColor: (f: Facility) =>
        anomalyMode ? [220, 38, 38, 235] : trustToRGBA(f.trust_score, 230),
      getLineColor: anomalyMode ? [127, 29, 29, 240] : [10, 14, 26, 220],
      lineWidthMinPixels: 1,
      onClick: (info) => {
        if (info.object) onFacilityClick(info.object as Facility);
      },
      updateTriggers: {
        getRadius: [pointRadius],
        getFillColor: [anomalyMode],
        getLineColor: [anomalyMode],
      },
    });

    // AI-match highlight halo — sits on top of regular points.
    const highlightData = highlightIds && highlightIds.size > 0
      ? facilities.filter((f) => highlightIds.has(f.id))
      : [];
    const highlight = highlightData.length > 0
      ? new ScatterplotLayer({
          id: "ai-match-highlight",
          data: highlightData,
          pickable: true,
          stroked: true,
          filled: false,
          radiusUnits: "pixels",
          getPosition: (f: Facility) => [f.lon, f.lat],
          getRadius: pointRadius * 3.2,
          getLineColor: [56, 189, 248, 240],
          lineWidthMinPixels: 2.5,
          onClick: (info) => {
            if (info.object) onFacilityClick(info.object as Facility);
          },
          updateTriggers: { getRadius: [pointRadius] },
        })
      : null;

    return [hex, scatter, highlight].filter(Boolean) as NonNullable<typeof scatter>[];
  }, [points, facilities, onFacilityClick, showHex, pointRadius, anomalyMode, highlightIds]);

  return (
    <div className="relative h-full w-full">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
        onViewStateChange={({ viewState }) => {
          const z = (viewState as { zoom?: number }).zoom;
          if (typeof z === "number") setZoom(z);
        }}
      >
        <MapLibre mapStyle={MAP_STYLE} reuseMaps attributionControl={false} />
      </DeckGL>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-border bg-card/80 px-3 py-2 backdrop-blur">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {anomalyMode
            ? `Anomalies · ${facilities.length} facilities`
            : showHex ? "Trust Score · 3D Hex" : "Trust Score · Facilities"}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {anomalyMode ? (
            <>
              <div className="h-2 w-2 rounded-full" style={{ background: "rgb(220, 38, 38)" }} />
              <span className="font-mono text-[10px] text-muted-foreground">each dot = 1 anomaly</span>
            </>
          ) : (
            <>
              <div className="h-1.5 w-32 rounded-full bg-trust-gradient" />
              <span className="font-mono text-[10px] text-muted-foreground">low → high</span>
            </>
          )}
        </div>
        <div className="mt-1 font-mono text-[9px] text-muted-foreground/70">
          zoom {zoom.toFixed(1)} · {anomalyMode ? "individual anomalies" : showHex ? "aggregated" : "individual points"}
        </div>
      </div>
    </div>
  );
}
