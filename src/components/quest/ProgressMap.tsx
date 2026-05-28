'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const markerIcon = L.divIcon({
  html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="#c53030"/>
    <circle cx="12" cy="12" r="5" fill="#7f1d1d"/>
  </svg>`,
  className: '',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
})

// Clockwise from bottom tip: Great Market Hall → Buda Castle → Fisherman's → Parliament
// → St. Stephen's Basilica (right lobe) → House of Terror → Róth → close
const HEART_ORDER = [2, 1, 0, 3, 4, 5, 6]

interface MapLocation {
  id: string
  name: string
  lat: number
  lng: number
  order: number
}

export default function ProgressMap({
  locations,
  totalCount,
}: {
  locations: MapLocation[]
  totalCount: number
}) {
  const center: [number, number] =
    locations.length > 0
      ? [
          locations.reduce((s, l) => s + l.lat, 0) / locations.length,
          locations.reduce((s, l) => s + l.lng, 0) / locations.length,
        ]
      : [47.4979, 19.0402]

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `.leaflet-control-attribution { background: #2a251acc !important; color: #868174 !important; } .leaflet-control-attribution a { color: #d4cdbc !important; }`
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const allComplete = totalCount > 0 && locations.length >= totalCount

  const heartPositions: [number, number][] = (() => {
    if (!allComplete) return []
    const byOrder = new Map(locations.map((l) => [l.order, l]))
    const path = HEART_ORDER.map((o) => byOrder.get(o)).filter((l): l is MapLocation => l != null)
    if (path.length === 0) return []
    path.push(path[0])
    return path.map((l) => [l.lat, l.lng] as [number, number])
  })()

  return (
    <div className="w-full rounded-sm overflow-hidden border border-[#433f37]" style={{ height: '300px' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={markerIcon}>
            <Popup>
              <span style={{ fontFamily: 'serif', fontSize: '13px' }}>{loc.name}</span>
            </Popup>
          </Marker>
        ))}
        {allComplete && heartPositions.length > 0 && (
          <Polyline
            positions={heartPositions}
            pathOptions={{ color: '#c53030', weight: 2, opacity: 0.85 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
