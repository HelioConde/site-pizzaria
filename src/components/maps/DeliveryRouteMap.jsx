import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabase";
import styles from "./DeliveryRouteMap.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const bounds = L.latLngBounds(points);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        animate: true,
      });
    }
  }, [map, JSON.stringify(points)]);

  return null;
}

function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return "—";

  const value = Number(meters);

  if (value < 1000) return `${Math.round(value)} m`;

  return `${(value / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return "—";

  const totalMinutes = Math.round(Number(seconds) / 60);

  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

export default function MotoboyDeliveryMap({
  courierLatitude,
  courierLongitude,
  customerLatitude,
  customerLongitude,
}) {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState({
    distance: null,
    duration: null,
  });
  const [routeError, setRouteError] = useState("");

  const courierPosition = useMemo(() => {
    const lat = Number(courierLatitude);
    const lng = Number(courierLongitude);

    if (
      courierLatitude == null ||
      courierLongitude == null ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }

    return [lat, lng];
  }, [courierLatitude, courierLongitude]);

  const customerPosition = useMemo(() => {
    const lat = Number(customerLatitude);
    const lng = Number(customerLongitude);

    if (
      customerLatitude == null ||
      customerLongitude == null ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }

    return [lat, lng];
  }, [customerLatitude, customerLongitude]);

  const fallbackCenter = useMemo(() => {
    if (courierPosition) return courierPosition;
    if (customerPosition) return customerPosition;
    return null;
  }, [courierPosition, customerPosition]);

  useEffect(() => {
    async function loadRoute() {
      if (!courierPosition || !customerPosition) {
        setRoutePoints([]);
        setRouteInfo({
          distance: null,
          duration: null,
        });
        setRouteError("");
        return;
      }

      try {
        setRouteError("");

        const { data, error } = await supabase.functions.invoke("get-delivery-route", {
          body: {
            originLat: courierPosition[0],
            originLng: courierPosition[1],
            destLat: customerPosition[0],
            destLng: customerPosition[1],
          },
        });

        if (error) throw error;

        const coordinates = data?.geometry?.coordinates ?? [];

        if (!Array.isArray(coordinates) || !coordinates.length) {
          throw new Error("Rota sem geometria.");
        }

        const points = coordinates.map(([lng, lat]) => [lat, lng]);

        setRoutePoints(points);
        setRouteInfo({
          distance: data?.distance ?? null,
          duration: data?.duration ?? null,
        });
      } catch (error) {
        console.error("Erro ao carregar rota:", error);
        setRoutePoints([]);
        setRouteInfo({
          distance: null,
          duration: null,
        });
        setRouteError("Não foi possível calcular a rota.");
      }
    }

    loadRoute();
  }, [courierPosition, customerPosition]);

  const boundsPoints = useMemo(() => {
    if (routePoints.length > 0) return routePoints;
    return [courierPosition, customerPosition].filter(Boolean);
  }, [routePoints, courierPosition, customerPosition]);

  if (!fallbackCenter) {
    return (
      <div className={styles.mapEmptyState}>
        Sem coordenadas suficientes para mostrar o mapa.
      </div>
    );
  }

  return (
    <div className={styles.deliveryMapWrap}>
      <div className={styles.deliveryMapMeta}>
        <span className={styles.mapMetaBadge}>
          Distância: <strong>{formatDistance(routeInfo.distance)}</strong>
        </span>
        <span className={styles.mapMetaBadge}>
          Tempo estimado: <strong>{formatDuration(routeInfo.duration)}</strong>
        </span>
      </div>

      {routeError ? <p className={styles.mapError}>{routeError}</p> : null}

      <MapContainer
        center={fallbackCenter}
        zoom={15}
        scrollWheelZoom
        style={{ width: "100%", height: "320px", borderRadius: "18px", zIndex: 0 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={boundsPoints} />

        {courierPosition ? (
          <Marker position={courierPosition}>
            <Popup>Motoboy</Popup>
          </Marker>
        ) : null}

        {customerPosition ? (
          <Marker position={customerPosition}>
            <Popup>Destino do cliente</Popup>
          </Marker>
        ) : null}

        {routePoints.length > 0 ? <Polyline positions={routePoints} /> : null}
      </MapContainer>
    </div>
  );
}