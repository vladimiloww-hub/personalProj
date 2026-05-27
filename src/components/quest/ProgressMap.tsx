'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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

const goldIcon = L.divIcon({
  html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="#c4a35a"/>
    <circle cx="12" cy="12" r="5" fill="#0f0d0a"/>
  </svg>`,
  className: '',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
})

interface MapLocation {
  id: string
  name: string
  lat: number
  lng: number
}

export default function ProgressMap({ locations }: { locations: MapLocation[] }) {
  // Center on Budapest if no locations
  const center: [number, number] =
    locations.length > 0
      ? [
          locations.reduce((s, l) => s + l.lat, 0) / locations.length,
          locations.reduce((s, l) => s + l.lng, 0) / locations.length,
        ]
      : [47.4979, 19.0402]

  useEffect(() => {
    // Override Leaflet tile layer attribution color to match gothic theme
    const style = document.createElement('style')
    style.textContent = `.leaflet-control-attribution { background: #1a1510cc !important; color: #8a7a64 !important; } .leaflet-control-attribution a { color: #c4a35a !important; }`
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  return (
    <div className="w-full rounded-sm overflow-hidden border border-[#3d2e1a]" style={{ height: '300px' }}>
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
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={goldIcon}>
            <Popup>
              <span style={{ fontFamily: 'serif', fontSize: '13px' }}>{loc.name}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
