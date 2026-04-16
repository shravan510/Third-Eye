import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

export default function Heatmap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Initialize map only once
    if (!mapInstance.current) {
      // Coordinates for Vishrambagh, Sangli
      const center = [16.8441, 74.6015];
      
      // Dark Mode Map theme via CartoDB
      const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      });

      mapInstance.current = L.map(mapRef.current, {
        center: center,
        zoom: 15,
        layers: [darkTile]
      });

      // Generate random mock heat points around Vishrambagh
      const heatPoints = Array.from({ length: 500 }).map(() => {
        // Randomly offset from center
        const lat = 16.8441 + (Math.random() - 0.5) * 0.02;
        const lng = 74.6015 + (Math.random() - 0.5) * 0.02;
        const intensity = Math.random(); // 0 to 1
        return [lat, lng, intensity];
      });

      // Add heatmap layer
      L.heatLayer(heatPoints, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Traffic Heatmap</h1>
        <p>Real-time geospatial hotspot analysis of violations in Vishrambagh, Sangli.</p>
      </div>

      <div style={{ 
        flex: 1, 
        minHeight: '400px', 
        borderRadius: '12px', 
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        
        {/* Floating Legend */}
        <div className="glass-panel" style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '15px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Violation Intensity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '15px', height: '15px', background: 'red', borderRadius: '50%' }}></div>
             <span style={{ fontSize: '0.8rem', color: '#ccc' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '15px', height: '15px', background: 'yellow', borderRadius: '50%' }}></div>
             <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '15px', height: '15px', background: 'blue', borderRadius: '50%' }}></div>
             <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
