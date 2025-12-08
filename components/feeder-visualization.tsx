"use client"

import { useState, Suspense } from "react"
import Image from "next/image"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Environment, ContactShadows } from "@react-three/drei"
import { RefreshCw, Box, Image as ImageIcon } from "lucide-react"

type FeederVisualizationProps = {
  imageSrc: string
  modelPath: string
  dimensions: Record<string, string>
  positions2D: Record<string, { x: number; y: number }>
  positions3D?: Record<string, [number, number, number]> // [x, y, z]
  onDimensionClick: (key: string) => void
  onClearData: () => void
  isReadOnly?: boolean // For print view
}

function InteractiveModel({ 
  modelPath, 
  dimensions, 
  positions3D, 
  onDimensionClick 
}: { 
  modelPath: string
  dimensions: Record<string, string>
  positions3D?: Record<string, [number, number, number]>
  onDimensionClick: (key: string) => void
}) {
  const { scene } = useGLTF(modelPath)

  return (
    <group>
      <primitive object={scene} scale={0.01} position={[0, -2.5, 0]} /* x=0, y=-0.5 (Down), z=0 */
      onClick={(e: any) => {
          e.stopPropagation()
          const { x, y, z } = e.point
          console.log(`[${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`)
          alert(`3D Coordinates copied to console!\n[${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`)
        }}
      /> {/* Adjust scale based on your Blender export */}
      
      {/* 3D Input Markers */}
      {positions3D && Object.entries(positions3D).map(([key, position]) => {
        const hasValue = !!dimensions[key]
        return (
          <Html key={key} position={position} center zIndexRange={[100, 0]}>
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent rotating when clicking button
                onDimensionClick(key)
              }}
              className={`flex items-center justify-center w-6 h-6 text-xs font-bold border rounded shadow-md transition-transform hover:scale-110 ${
                hasValue
                  ? "bg-white text-black border-white"
                  : "bg-white text-red-500 border-red-500 animate-pulse"
              }`}
            >
              {dimensions[key] || key}
            </button>
          </Html>
        )
      })}
    </group>
  )
}

export default function FeederVisualization({
  imageSrc,
  modelPath,
  dimensions,
  positions2D,
  positions3D,
  onDimensionClick,
  onClearData,
  isReadOnly = false
}: FeederVisualizationProps) {
  // Default to 3D as requested
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D")

  return (
    <div className="relative w-full h-full min-h-[700px] bg-gray-50 rounded-lg overflow-hidden border">
      
      {/* View Toggle Buttons */}
      {!isReadOnly && (
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/80 p-1 rounded-lg border shadow-sm backdrop-blur-sm">
          <button
            onClick={() => setViewMode("3D")}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "3D" 
                ? "bg-black text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Box className="w-4 h-4 mr-2" />
            3D View
          </button>
          <button
            onClick={() => setViewMode("2D")}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "2D" 
                ? "bg-black text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            2D View
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full h-full absolute inset-0">
        {viewMode === "2D" ? (
          // --- 2D VIEW ---
          <div className="relative w-full h-full flex items-center justify-center bg-white px-8 pb-8 pt-20">
            <div className="relative w-full h-full max-w-4xl mx-auto p-8">
                <Image
                    src={imageSrc}
                    alt="Feeder 2D View"
                    fill
                    className="object-contain"
                    priority
                />
                {Object.entries(positions2D).map(([dim, { x, y }]) => (
                    <button
                    key={dim}
                    onClick={() => onDimensionClick(dim)}
                    className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center text-[10px] font-bold border rounded shadow-sm ${
                        dimensions[dim]
                        ? "bg-white text-black border-black"
                        : "bg-white text-red-500 border-red-500"
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    >
                    {dimensions[dim] || dim}
                    </button>
                ))}
            </div>
          </div>
        ) : (
          // --- 3D VIEW ---
          <Canvas camera={{ position: [5, 5, 5], fov: 45 }} className="w-full h-full bg-[#f0f0f0]">
            <Suspense fallback={null}>
              <InteractiveModel 
                modelPath={modelPath} 
                dimensions={dimensions} 
                positions3D={positions3D}
                onDimensionClick={onDimensionClick}
              />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
          </Canvas>
        )}
      </div>
  
      {/* 3D Instructions Overlay */}
      {viewMode === "3D" && !isReadOnly && (
         <div className="absolute bottom-4 right-4 z-0 text-xs text-gray-400 pointer-events-none select-none">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom
         </div>
      )}
    </div>
  )
}