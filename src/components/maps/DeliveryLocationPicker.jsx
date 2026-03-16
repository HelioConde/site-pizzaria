import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, map.getZoom(), {
      animate: true,
    });
  }, [map, position]);

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

export default function DeliveryLocationPicker({
  latitude,
  longitude,
  onChange,
  zoom = 18,
  height = 320,
}) {
  const [position, setPosition] = useState(null);

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
      return;
    }

    setPosition([lat, lng]);
  }, [latitude, longitude]);

  const center = useMemo(() => {
    if (position) return position;
    return null;
  }, [position]);

  function handlePick(lat, lng) {
    const nextPosition = [lat, lng];
    setPosition(nextPosition);
    onChange?.(lat, lng);
  }

  if (!center) {
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: "16px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap position={position} />
      <ClickToMoveMarker onPick={handlePick} />

      {position ? (
        <Marker
          position={position}
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
  );
}