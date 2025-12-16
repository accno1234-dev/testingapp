"use client"

import { useState, Suspense, useEffect } from "react"
import Image from "next/image"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Environment} from "@react-three/drei"
import { RefreshCw, Box, Image as ImageIcon, RotateCcw } from "lucide-react"

type InteractiveModelProps = {
  modelPath: string
  dimensions: Record<string, string>
  positions3D?: Record<string, [number, number, number]>
  onDimensionClick: (key: string) => void
  hideMarkers?: boolean 
}

type FeederVisualizationProps = {
  imageSrc: string
  modelPath: string
  dimensions: Record<string, string>
  positions2D: Record<string, { x: number; y: number }>
  positions3D?: Record<string, [number, number, number]>
  onDimensionClick: (key: string) => void
  onClearData: () => void
  isReadOnly?: boolean
  hideMarkers?: boolean
}

// Helper to reset camera
function ResetCamera({ trigger }: { trigger: number }) {
  const controls = useThree((state) => state.controls) as any
  useEffect(() => {
    if (trigger > 0 && controls) controls.reset()
  }, [trigger, controls])
  return null
}

function InteractiveModel({ 
  modelPath, 
  dimensions, 
  positions3D, 
  onDimensionClick,
  hideMarkers
}: InteractiveModelProps) {
  const { scene } = useGLTF(modelPath)

  return (
    <group>
      <primitive object={scene} scale={0.01} position={[0, -2.5, 0]} />
      
      {!hideMarkers && positions3D && Object.entries(positions3D).map(([key, position]) => {
        const hasValue = !!dimensions[key]
        return (
          <Html key={key} position={position} center zIndexRange={[50, 0]}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDimensionClick(key)
              }}
              className={`flex items-center justify-center w-6 h-6 text-xs font-bold border rounded shadow-md transition-transform hover:scale-110 ${
                hasValue ? "bg-white text-black border-white" : "bg-white text-red-500 border-red-500 animate-pulse"
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
  isReadOnly = false,
  hideMarkers = false
}: FeederVisualizationProps) {
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D")
  const [resetTrigger, setResetTrigger] = useState(0)

  // --- REUSABLE 2D VIEW COMPONENT ---
  const TwoDView = () => (
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
  )

  return (
    <div className="relative w-full h-full min-h-[700px] bg-gray-50 rounded-lg overflow-hidden border">
      
      {/* ============================================== */}
      {/* 1. INTERACTIVE SCREEN VIEW (Hidden on Print)   */}
      {/* ============================================== */}
      {/* CHANGED: Used 'absolute inset-0' instead of 'relative h-full' to prevent collapse */}
      <div className="absolute inset-0 w-full h-full print:hidden">
        
        {/* View Buttons */}
        {!isReadOnly && (
          <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/80 p-1 rounded-lg border shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setViewMode("3D")}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "3D" ? "bg-black text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Box className="w-4 h-4 mr-2" />
              3D View
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "2D" ? "bg-black text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              2D View
            </button>
          </div>
        )}

        {/* Reset Button */}
        {!isReadOnly && viewMode === "3D" && (
          <button
            onClick={() => setResetTrigger((prev) => prev + 1)}
            className="absolute top-4 right-4 z-10 flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white/80 border shadow-sm backdrop-blur-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset View
          </button>
        )}

        {/* View Logic */}
        <div className="w-full h-full absolute inset-0">
          {viewMode === "2D" ? (
            <TwoDView />
          ) : (
            <Canvas camera={{ position: [5, 5, 5], fov: 45 }} className="w-full h-full bg-[#f0f0f0]">
              <Suspense fallback={null}>
                <InteractiveModel 
                  modelPath={modelPath} 
                  dimensions={dimensions} 
                  positions3D={positions3D}
                  onDimensionClick={onDimensionClick}
                  hideMarkers={hideMarkers}
                />
                <ResetCamera trigger={resetTrigger} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
          )}
        </div>

        {/* Instructions */}
        {viewMode === "3D" && !isReadOnly && (
          <div className="absolute bottom-4 right-4 z-0 text-xs text-gray-400 pointer-events-none select-none">
              Hold Left Click: Rotate  • Hold Right Click: Pan  • Scroll: Zoom
          </div>
        )}
      </div>

      {/* ============================================== */}
      {/* 2. PRINT VIEW (Visible ONLY on Print)          */}
      {/* ============================================== */}
      <div className="hidden print:block absolute inset-0 w-full h-full bg-white z-50">
        <TwoDView />
      </div>

    </div>
  )
}