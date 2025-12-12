// 🌍 INTERACTIVE WORLD MAP WITH USER ANALYTICS
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, MapPin, Maximize2, Minimize2 } from 'lucide-react';

const InteractiveWorldMap = ({ locationStats = [] }) => {
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const mapRef = useRef(null);

    // Enhanced mock data with more countries for better visualization
    const enhancedLocationStats = locationStats.length > 0 ? locationStats : [
        { country: 'United States', users: 1250, percentage: 25, code: 'US', coordinates: [39.8283, -98.5795] },
        { country: 'United Kingdom', users: 890, percentage: 18, code: 'GB', coordinates: [55.3781, -3.4360] },
        { country: 'Canada', users: 650, percentage: 13, code: 'CA', coordinates: [56.1304, -106.3468] },
        { country: 'Australia', users: 420, percentage: 8, code: 'AU', coordinates: [-25.2744, 133.7751] },
        { country: 'Germany', users: 380, percentage: 7.5, code: 'DE', coordinates: [51.1657, 10.4515] },
        { country: 'France', users: 320, percentage: 6.5, code: 'FR', coordinates: [46.2276, 2.2137] },
        { country: 'Japan', users: 280, percentage: 5.5, code: 'JP', coordinates: [36.2048, 138.2529] },
        { country: 'Brazil', users: 240, percentage: 4.8, code: 'BR', coordinates: [-14.2350, -51.9253] },
        { country: 'India', users: 200, percentage: 4, code: 'IN', coordinates: [20.5937, 78.9629] },
        { country: 'South Korea', users: 180, percentage: 3.6, code: 'KR', coordinates: [35.9078, 127.7669] },
        { country: 'Netherlands', users: 160, percentage: 3.2, code: 'NL', coordinates: [52.1326, 5.2913] },
        { country: 'Sweden', users: 140, percentage: 2.8, code: 'SE', coordinates: [60.1282, 18.6435] }
    ];

    // Country coordinates for positioning (longitude, latitude converted to SVG coordinates)
    const countryCoordinates = {
        'US': { x: 200, y: 180 },
        'GB': { x: 400, y: 130 },
        'CA': { x: 180, y: 120 },
        'AU': { x: 680, y: 300 },
        'DE': { x: 420, y: 140 },
        'FR': { x: 400, y: 160 },
        'JP': { x: 720, y: 170 },
        'BR': { x: 300, y: 260 },
        'IN': { x: 580, y: 200 },
        'KR': { x: 710, y: 160 },
        'NL': { x: 410, y: 130 },
        'SE': { x: 430, y: 110 }
    };

    // Get color intensity based on user count
    const getCountryColor = (users) => {
        const maxUsers = Math.max(...enhancedLocationStats.map(c => c.users));
        const intensity = users / maxUsers;
        
        if (intensity > 0.8) return '#1e40af'; // Dark blue
        if (intensity > 0.6) return '#3b82f6'; // Blue
        if (intensity > 0.4) return '#60a5fa'; // Light blue
        if (intensity > 0.2) return '#93c5fd'; // Very light blue
        return '#dbeafe'; // Lightest blue
    };

    // Handle mouse events for dragging
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - mapTransform.x,
            y: e.clientY - mapTransform.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        setMapTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle zoom
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(3, mapTransform.scale * delta));
        
        setMapTransform(prev => ({
            ...prev,
            scale: newScale
        }));
    };

    // Reset map position
    const resetMap = () => {
        setMapTransform({ x: 0, y: 0, scale: 1 });
        setSelectedCountry(null);
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart]);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-300 ${
            isFullscreen ? 'fixed inset-4 z-50' : 'relative'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Global User Distribution
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={resetMap}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Reset View
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Map Container */}
                <div 
                    ref={mapRef}
                    className="flex-1 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
                    style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px' }}
                    onMouseDown={handleMouseDown}
                    onWheel={handleWheel}
                >
                    {/* World Map SVG */}
                    <svg
                        className="absolute inset-0 w-full h-full cursor-move"
                        viewBox="0 0 800 400"
                        style={{
                            transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`,
                            transformOrigin: 'center'
                        }}
                    >
                        {/* Background */}
                        <rect width="800" height="400" fill="transparent" />
                        
                        {/* World Map Background */}
                        <g className="world-background">
                            {/* Continents as simplified shapes */}
                            <path d="M 100 100 Q 200 80 350 120 Q 400 100 450 130 Q 500 110 600 140 L 650 160 Q 700 150 750 170 L 780 180 L 780 250 Q 750 280 700 270 Q 650 290 600 280 Q 550 300 500 290 Q 450 310 400 300 Q 350 320 300 310 Q 250 330 200 320 Q 150 340 100 330 Z" 
                                  fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" opacity="0.3" />
                            <path d="M 200 200 Q 250 180 300 200 Q 350 180 400 200 L 450 220 Q 500 200 550 220 L 600 240 Q 650 220 700 240 L 750 260 L 750 350 Q 700 380 650 370 Q 600 390 550 380 Q 500 400 450 390 Q 400 410 350 400 Q 300 420 250 410 Q 200 430 150 420 L 100 400 Z" 
                                  fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" opacity="0.3" />
                        </g>
                        
                        {/* Country Markers */}
                        <g className="countries">
                            {enhancedLocationStats.map((country) => {
                                const coords = countryCoordinates[country.code];
                                if (!coords) return null;
                                
                                const bubbleSize = Math.max(12, Math.sqrt(country.users) / 2.5);
                                
                                return (
                                    <g key={country.code}>
                                        {/* Glow Effect */}
                                        <circle
                                            cx={coords.x}
                                            cy={coords.y}
                                            r={bubbleSize + 4}
                                            fill={getCountryColor(country.users)}
                                            opacity="0.3"
                                            className="animate-pulse"
                                        />
                                        
                                        {/* Main Country Bubble */}
                                        <circle
                                            cx={coords.x}
                                            cy={coords.y}
                                            r={bubbleSize}
                                            fill={getCountryColor(country.users)}
                                            stroke="#ffffff"
                                            strokeWidth="3"
                                            className="cursor-pointer transition-all duration-200 hover:stroke-yellow-400 hover:stroke-4"
                                            onClick={() => setSelectedCountry(country)}
                                        />
                                        
                                        {/* User Count Text */}
                                        <text
                                            x={coords.x}
                                            y={coords.y}
                                            textAnchor="middle"
                                            dy="0.3em"
                                            className="text-xs font-bold fill-white pointer-events-none"
                                            style={{ fontSize: Math.max(10, bubbleSize / 3) }}
                                        >
                                            {country.users > 999 ? `${(country.users / 1000).toFixed(1)}k` : country.users}
                                        </text>
                                        
                                        {/* Country Label */}
                                        <text
                                            x={coords.x}
                                            y={coords.y + bubbleSize + 15}
                                            textAnchor="middle"
                                            className="text-xs font-semibold fill-gray-700 dark:fill-gray-300 pointer-events-none"
                                        >
                                            {country.code}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                        
                        {/* Connection Lines to show data flow */}
                        <g className="connections opacity-40">
                            {enhancedLocationStats.slice(0, 6).map((country, index) => {
                                const coords = countryCoordinates[country.code];
                                if (!coords) return null;
                                
                                return (
                                    <line
                                        key={`connection-${index}`}
                                        x1="400"
                                        y1="200"
                                        x2={coords.x}
                                        y2={coords.y}
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        strokeDasharray="8,4"
                                        className="animate-pulse"
                                        style={{ 
                                            animationDelay: `${index * 0.5}s`,
                                            animationDuration: '3s'
                                        }}
                                    />
                                );
                            })}
                        </g>
                        
                        {/* Central Hub */}
                        <circle
                            cx="400"
                            cy="200"
                            r="8"
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth="3"
                            className="animate-pulse"
                        />
                        <text
                            x="400"
                            y="185"
                            textAnchor="middle"
                            className="text-xs font-bold fill-gray-700 dark:fill-gray-300"
                        >
                            HQ
                        </text>
                    </svg>

                    {/* Map Controls */}
                    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                        <button
                            onClick={() => setMapTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                            className="w-8 h-8 bg-white dark:bg-gray-800 rounded-md shadow-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            +
                        </button>
                        <button
                            onClick={() => setMapTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }))}
                            className="w-8 h-8 bg-white dark:bg-gray-800 rounded-md shadow-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            -
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
                        <p>🖱️ Drag to pan • 🔍 Scroll to zoom • 🖱️ Click countries for details</p>
                    </div>
                </div>

                {/* Country Details Panel */}
                <div className="w-80 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Country Details
                    </h4>
                    
                    {selectedCountry ? (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                                <h5 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                    {selectedCountry.country}
                                </h5>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Users:</span>
                                        <span className="font-semibold text-blue-600">{selectedCountry.users.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Percentage:</span>
                                        <span className="font-semibold text-green-600">{selectedCountry.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${selectedCountry.percentage * 4}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Stats */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                                <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Activity Metrics</h6>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Avg. Session:</span>
                                        <span>{Math.floor(Math.random() * 30 + 15)} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Peak Hours:</span>
                                        <span>{Math.floor(Math.random() * 12 + 6)}:00 - {Math.floor(Math.random() * 12 + 18)}:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Growth:</span>
                                        <span className="text-green-600">+{Math.floor(Math.random() * 20 + 5)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click on a country to view details</p>
                        </div>
                    )}

                    {/* Top Countries List */}
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Top Countries
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {enhancedLocationStats.slice(0, 8).map((country, index) => (
                                <div 
                                    key={country.code}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                                        selectedCountry?.code === country.code 
                                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => setSelectedCountry(country)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                                        <span className="text-sm font-medium">{country.country}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-blue-600">{country.users}</div>
                                        <div className="text-xs text-gray-500">{country.percentage}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveWorldMap;