'use client'

import { useEffect, useState, useRef } from 'react'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import type { LatLngExpression, Map as LeafletMap } from 'leaflet'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}

type MapPickerProps = {
  latitude?: number
  longitude?: number
  onLocationChange?: (lat: number, lng: number) => void
  containerId?: string
}

type SearchResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export default function MapPicker({ latitude, longitude, onLocationChange, containerId = 'map-container' }: MapPickerProps) {
  const [map, setMap] = useState<LeafletMap | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Default center: Indonesia (Jakarta)
  const defaultCenter: LatLngExpression = [-6.2088, 106.8456]
  const defaultZoom = 13

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Create map
    const mapContainer = document.getElementById(containerId)

    if (!mapContainer) return

    // Check if map already exists
    if (mapContainer.querySelector('.leaflet-container')) {
      return
    }

    const newMap = L.map(containerId).setView(
      latitude && longitude ? [latitude, longitude] : defaultCenter,
      defaultZoom
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap)

    // Add click handler only if onLocationChange is provided
    if (onLocationChange) {
      newMap.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng

        updateMarker(lat, lng, newMap)
      })
    }

    setMap(newMap)

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }

      if (newMap) {
        newMap.remove()
      }
    }
  }, [mounted])

  // Update marker position when props change
  useEffect(() => {
    if (!map) return

    if (latitude && longitude) {
      updateMarker(latitude, longitude, map)
      map.setView([latitude, longitude], defaultZoom)
    }
  }, [latitude, longitude, map])

  const updateMarker = (lat: number, lng: number, mapInstance: LeafletMap) => {
    if (onLocationChange) {
      onLocationChange(lat, lng)
    }

    // Remove existing marker if any
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Create new marker
    // Draggable only if onLocationChange is provided
    const newMarker = L.marker([lat, lng], { draggable: !!onLocationChange }).addTo(mapInstance)

    if (onLocationChange) {
      newMarker.on('dragend', () => {
        const pos = newMarker.getLatLng()

        onLocationChange(pos.lat, pos.lng)
      })
    }

    markerRef.current = newMarker
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=id&limit=5`,
        {
          headers: {
            'User-Agent': 'BantuSewa/1.0'
          }
        }
      )

      const data = await response.json()

      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    if (map) {
      map.setView([lat, lng], 15)
      updateMarker(lat, lng, map)
    }

    setSearchResults([])
    setSearchQuery('')
  }

  // Don't render on server side
  if (!mounted) {
    return (
      <div
        style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}
      >
        Loading map...
      </div>
    )
  }

  return (
    <Box>
      {/* Search Box - Only show if interactive */}
      {onLocationChange && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, position: 'relative' }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Cari alamat atau lokasi...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <Button variant='contained' onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
            {searching ? <CircularProgress size={20} /> : <i className='tabler-search' />}
          </Button>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 0.5,
                maxHeight: 300,
                overflow: 'auto',
                zIndex: 1000
              }}
            >
              <List dense>
                {searchResults.map(result => (
                  <ListItem key={result.place_id} disablePadding>
                    <ListItemButton onClick={() => handleSelectResult(result)}>
                      <ListItemText
                        primary={result.display_name}
                        primaryTypographyProps={{
                          sx: { fontSize: '0.875rem' }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Map Container */}
      <div
        id={containerId}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 0
        }}
      />
    </Box>
  )
}
