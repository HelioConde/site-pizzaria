import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerHtml = `
  <div style="
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ff6b63 0%, #ef4444 100%);
    border: 3px solid #ffffff;
    box-shadow: 0 10px 24px rgba(239, 68, 68, 0.28);
  ">
    <div style="
      position: absolute;
      left: 50%;
      top: 50%;
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #ffffff;
      transform: translate(-50%, -50%);
    "></div>
  </div>
  <div style="
    width: 0;
    height: 0;
    margin: -1px auto 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 12px solid #ef4444;
    filter: drop-shadow(0 6px 10px rgba(239, 68, 68, 0.2));
  "></div>
`;

const deliveryMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      background:#ef4444;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 6px 18px rgba(239,68,68,0.35);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function RecenterMap({ position, shouldRecenter }) {
  const map = useMap();

  useEffect(() => {
    if (!position || !shouldRecenter) return;

    map.setView(position, map.getZoom(), {
      animate: true,
    });
  }, [map, position, shouldRecenter]);

  return null;
}

function ClickToMoveMarker({ onPick }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onPick(lat, lng);
    },
  });

  return null;
}

function MapUiOverlay({ position }) {
  const map = useMap();

  function handleCenter() {
    if (!position) return;

    map.setView(position, map.getZoom(), {
      animate: true,
    });
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 500,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            maxWidth: "100%",
            background: "rgba(255,255,255,0.96)",
            color: "#0f172a",
            border: "1px solid rgba(226,232,240,0.95)",
            borderRadius: 999,
            padding: "10px 14px",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
            fontSize: "0.9rem",
            fontWeight: 700,
            lineHeight: 1.4,
            pointerEvents: "auto",
          }}
        >
          <span aria-hidden="true">📍</span>
          <span>Toque no mapa ou arraste o marcador</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCenter}
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          zIndex: 500,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 44,
          height: 44,
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 999,
          background: "rgba(255,255,255,0.96)",
          color: "#0f172a",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: 700,
          backdropFilter: "blur(6px)",
        }}
        aria-label="Centralizar marcador"
        title="Centralizar marcador"
      >
        ⊕
      </button>
    </>
  );
}

export default function DeliveryLocationPicker({
  latitude,
  longitude,
  onChange,
  zoom = 18,
  height = 320,
}) {
  const [position, setPosition] = useState(null);
  const [shouldRecenter, setShouldRecenter] = useState(true);

  const hasUserInteractedRef = useRef(false);
  const lastExternalPositionRef = useRef(null);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      latitude == null ||
      longitude == null ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      setPosition(null);
      setShouldRecenter(false);
      hasUserInteractedRef.current = false;
      lastExternalPositionRef.current = null;
      return;
    }

    const nextExternalPosition = [lat, lng];
    const lastExternal = lastExternalPositionRef.current;

    const externalPositionChanged =
      !lastExternal ||
      lastExternal[0] !== nextExternalPosition[0] ||
      lastExternal[1] !== nextExternalPosition[1];

    if (!position) {
      setPosition(nextExternalPosition);
      setShouldRecenter(true);
      lastExternalPositionRef.current = nextExternalPosition;
      return;
    }

    if (!hasUserInteractedRef.current && externalPositionChanged) {
      setPosition(nextExternalPosition);
      setShouldRecenter(true);
      lastExternalPositionRef.current = nextExternalPosition;
      return;
    }

    lastExternalPositionRef.current = nextExternalPosition;
    setShouldRecenter(false);
  }, [latitude, longitude, position]);

  const center = useMemo(() => {
    if (position) return position;
    return null;
  }, [position]);

  function handlePick(lat, lng) {
    const nextPosition = [lat, lng];
    hasUserInteractedRef.current = true;
    setShouldRecenter(false);
    setPosition(nextPosition);
    onChange?.(lat, lng);
  }

  function CustomZoomControl() {
    const map = useMap();

    return (
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          onClick={() => map.zoomIn()}
          style={zoomButtonStyle}
        >
          +
        </button>

        <button
          onClick={() => map.zoomOut()}
          style={zoomButtonStyle}
        >
          −
        </button>
      </div>
    );
  }

  const zoomButtonStyle = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
    cursor: "pointer",
    fontWeight: 700,
  };

  if (!center) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        border: "1px solid #dbe3ef",
        background:
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
        boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        style={{
          width: "100%",
          height: `${height}px`,
          zIndex: 0,
        }}
      >
        <CustomZoomControl />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <RecenterMap position={position} shouldRecenter={shouldRecenter} />
        <ClickToMoveMarker onPick={handlePick} />
        <MapUiOverlay position={position} />

        {position ? (
          <Marker
            position={position}
            icon={deliveryMarkerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const nextLatLng = marker.getLatLng();
                handlePick(nextLatLng.lat, nextLatLng.lng);
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}