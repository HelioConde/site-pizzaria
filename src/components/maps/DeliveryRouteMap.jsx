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

const courierIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: styles.customerMarker,
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
      return;
    }

    if (points[0]) {
      map.setView(points[0], 15, { animate: true });
    }
  }, [map, points]);

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

function hasValidCoordinatePair(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  );
}

export default function DeliveryRouteMap({
  courierLatitude,
  courierLongitude,
  customerLatitude,
  customerLongitude,
  courierLabel = "Motoboy",
  customerLabel = "Destino do cliente",
  height = 320,
  className = "",
  metaClassName = "",
  metaBadgeClassName = "",
  errorClassName = "",
  zoom = 15,
  scrollWheelZoom = true,
  preferCanvas = true,
  style = {},
}) {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState({
    distance: null,
    duration: null,
  });
  const [routeError, setRouteError] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  const courierPosition = useMemo(() => {
    if (!hasValidCoordinatePair(courierLatitude, courierLongitude)) {
      return null;
    }

    return [Number(courierLatitude), Number(courierLongitude)];
  }, [courierLatitude, courierLongitude]);

  const customerPosition = useMemo(() => {
    if (!hasValidCoordinatePair(customerLatitude, customerLongitude)) {
      return null;
    }

    return [Number(customerLatitude), Number(customerLongitude)];
  }, [customerLatitude, customerLongitude]);

  const fallbackCenter = useMemo(() => {
    if (courierPosition) return courierPosition;
    if (customerPosition) return customerPosition;
    return null;
  }, [courierPosition, customerPosition]);

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      if (!courierPosition || !customerPosition) {
        if (!active) return;

        setRoutePoints([]);
        setRouteInfo({
          distance: null,
          duration: null,
        });
        setRouteError("");
        setRouteLoading(false);
        return;
      }

      try {
        setRouteLoading(true);
        setRouteError("");

        const { data, error } = await supabase.functions.invoke(
          "get-delivery-route",
          {
            body: {
              originLat: courierPosition[0],
              originLng: courierPosition[1],
              destLat: customerPosition[0],
              destLng: customerPosition[1],
            },
          }
        );

        if (error) throw error;

        const coordinates = data?.geometry?.coordinates ?? [];

        if (!Array.isArray(coordinates) || !coordinates.length) {
          throw new Error("Rota sem geometria.");
        }

        const points = coordinates
          .map(([lng, lat]) => [lat, lng])
          .filter(
            (point) =>
              Array.isArray(point) &&
              point.length === 2 &&
              !Number.isNaN(Number(point[0])) &&
              !Number.isNaN(Number(point[1]))
          );

        if (!active) return;

        setRoutePoints(points);
        setRouteInfo({
          distance: data?.distance ?? null,
          duration: data?.duration ?? null,
        });
      } catch (error) {
        console.error("Erro ao carregar rota:", error);

        if (!active) return;

        setRoutePoints([]);
        setRouteInfo({
          distance: null,
          duration: null,
        });
        setRouteError("Não foi possível calcular a rota neste momento.");
      } finally {
        if (active) {
          setRouteLoading(false);
        }
      }
    }

    loadRoute();

    return () => {
      active = false;
    };
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
    <div className={`${styles.deliveryMapCard} ${className}`}>
      <div className={`${styles.deliveryMapMeta} ${metaClassName}`}>
        <span className={`${styles.mapMetaBadge} ${metaBadgeClassName}`}>
          Distância: <strong>{formatDistance(routeInfo.distance)}</strong>
        </span>

        <span className={`${styles.mapMetaBadge} ${metaBadgeClassName}`}>
          Tempo estimado: <strong>{formatDuration(routeInfo.duration)}</strong>
        </span>

        <span className={`${styles.mapMetaBadge} ${metaBadgeClassName}`}>
          Status: <strong>{routeLoading ? "Calculando rota..." : "Mapa ativo"}</strong>
        </span>
      </div>

      {routeError ? (
        <p className={`${styles.mapError} ${errorClassName}`}>{routeError}</p>
      ) : null}

      <div className={styles.mapFrame}>
        <MapContainer
          center={fallbackCenter}
          zoom={zoom}
          scrollWheelZoom={scrollWheelZoom}
          preferCanvas={preferCanvas}
          style={{
            width: "100%",
            height: `${height}px`,
            borderRadius: "18px",
            zIndex: 0,
            ...style,
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds points={boundsPoints} />

          {courierPosition ? (
            <Marker position={courierPosition} icon={courierIcon}>
              <Popup>{courierLabel}</Popup>
            </Marker>
          ) : null}

          {customerPosition ? (
            <Marker position={customerPosition} icon={customerIcon}>
              <Popup>{customerLabel}</Popup>
            </Marker>
          ) : null}

          {routePoints.length > 0 ? (
            <Polyline
              positions={routePoints}
              pathOptions={{
                weight: 5,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}