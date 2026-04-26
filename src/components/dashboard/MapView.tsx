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
  showDeserts: boolean;
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

export function MapView({ points, facilities, onFacilityClick, showDeserts }: MapViewProps) {
  const [zoom, setZoom] = useState<number>(INITIAL_VIEW_STATE.zoom as unknown as number);
  const showHex = zoom < HEX_HIDE_ZOOM;
  // Scale point radius up as we zoom in for better visibility.
  const pointRadius = Math.max(3, Math.min(9, 3 + (zoom - 4) * 0.9));

  const layers = useMemo(() => {
    const colorRange: [number, number, number][] = [
      [239, 68, 68],
      [245, 158, 11],
      [250, 204, 21],
      [163, 230, 53],
      [52, 211, 153],
      [16, 185, 129],
    ];

    const hex = showHex
      ? new HexagonLayer({
          id: "facility-hex",
          data: points,
          getPosition: (d: PointAggregate) => [d.lon, d.lat],
          getElevationWeight: (d: PointAggregate) => d.weight,
          getColorWeight: (d: PointAggregate) => d.trust,
          colorAggregation: "MEAN",
          elevationAggregation: "SUM",
          radius: 18000,
          elevationScale: 220,
          extruded: true,
          coverage: 0.85,
          colorRange,
          pickable: false,
          opacity: showDeserts ? 0.35 : 0.85,
          material: { ambient: 0.6, diffuse: 0.8, shininess: 32 },
        })
      : null;

    const desert =
      showHex && showDeserts
        ? new HexagonLayer({
            id: "facility-desert",
            data: points,
            getPosition: (d: PointAggregate) => [d.lon, d.lat],
            getElevationWeight: () => 1,
            radius: 35000,
            extruded: false,
            opacity: 0.25,
            colorRange: [
              [127, 29, 29],
              [185, 28, 28],
              [220, 38, 38],
              [239, 68, 68],
              [248, 113, 113],
              [254, 202, 202],
            ],
            getColorWeight: () => 1,
            colorAggregation: "SUM",
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
      getFillColor: (f: Facility) => trustToRGBA(f.trust_score, 230),
      getLineColor: [10, 14, 26, 220],
      lineWidthMinPixels: 1,
      onClick: (info) => {
        if (info.object) onFacilityClick(info.object as Facility);
      },
      updateTriggers: {
        getRadius: [pointRadius],
      },
    });

    return [hex, desert, scatter].filter(Boolean) as NonNullable<typeof scatter>[];
  }, [points, facilities, showDeserts, onFacilityClick, showHex, pointRadius]);

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
          {showHex ? "Trust Score · 3D Hex" : "Trust Score · Facilities"}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-32 rounded-full bg-trust-gradient" />
          <span className="font-mono text-[10px] text-muted-foreground">low → high</span>
        </div>
        <div className="mt-1 font-mono text-[9px] text-muted-foreground/70">
          zoom {zoom.toFixed(1)} · {showHex ? "aggregated" : "individual points"}
        </div>
      </div>
    </div>
  );
}
