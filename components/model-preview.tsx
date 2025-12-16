"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, PerspectiveCamera, Html, ContactShadows } from "@react-three/drei"
import { X, Loader2 } from "lucide-react"
import * as THREE from "three"

// ==========================================
// CONFIGURATION AREA
// ==========================================

const GLOBAL_SCALE = 0.001

type SizeRule = {
  dimension: string | string[]
  min: number       
  max: number       
  file: string      
}

const MODEL_SIZE_RULES: Record<string, SizeRule[]> = {
  bowl: [
    { dimension: ["A", "B"], min: 120, max: 149, file: "bowl-90.glb" }, 
    { dimension: ["A", "B"], min: 150, max: 249, file: "bowl-120.glb" }, 
    { dimension: ["A", "B"], min: 250, max: 309, file: "bowl-150.glb" },
    { dimension: ["A", "B"], min: 310, max: 369, file: "bowl-190.glb" }, 
    { dimension: ["A", "B"], min: 370, max: 499, file: "bowl-230.glb" }, 
    { dimension: ["A", "B"], min: 500, max: 619, file: "bowl-300.glb" },
    { dimension: ["A", "B"], min: 620, max: 759, file: "bowl-390.glb" },
    { dimension: ["A", "B"], min: 760, max: 800, file: "bowl-460.glb" }
  ],
  linear: [],
  hopper: [],
  "set-a": [],
  "set-b": [],
  "set-c": [],
}

const getBaseFolder = (type: string) => {
  if (type.includes("bowl")) return "/models/bowlsizes/"
  if (type.includes("linear")) return "/models/linearsizes/" 
  if (type.includes("hopper")) return "/models/hoppersizes/" 
  if (type.includes("set-a")) return "/models/setasizes/"
  if (type.includes("set-b")) return "/models/setbsizes/"
  if (type.includes("set-c")) return "/models/setcsizes/"
  return "/models/"
}

const getDefaultModel = (type: string) => `/models/${type}.glb`

// ==========================================
// REFERENCE OBJECT (Soda Can)
// ==========================================
type ReferenceObjectProps = {
  feederType: string
  dimensions: Record<string, string>
}

function ReferenceObject({ feederType, dimensions }: ReferenceObjectProps) {
  const canHeight = 115 * GLOBAL_SCALE
  const canRadius = 33 * GLOBAL_SCALE

  // --- DYNAMIC POSITION CALCULATION ---
  const xOffset = useMemo(() => {
    // UPDATED: Default closer to center (10cm instead of 15cm)
    let offset = -0.1 

    if (feederType === "bowl" && dimensions["A"]) {
      const dimA = parseFloat(dimensions["A"])
      if (!isNaN(dimA)) {
        const worldRadius = (dimA * GLOBAL_SCALE) / 2
        // Set distance with soda can and the model
        offset = -(worldRadius + 0.08)
      }
    }
    
    // Safety check: Don't let it be closer than 8cm (-0.08)
    return Math.min(offset, -0.08)
  }, [feederType, dimensions])

  return (
    <group position={[xOffset, canHeight / 2, 0]}> 
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[canRadius, canRadius, canHeight, 32]} />
        <meshStandardMaterial color="#ff4444" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, canHeight/2 + 0.001, 0]}>
        <cylinderGeometry args={[canRadius * 0.9, canRadius * 0.9, 0.001, 32]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>
      <Html position={[0, canHeight / 2 + 0.05, 0]} center zIndexRange={[100, 0]}>
        <div className="bg-black/75 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap font-sans border border-white/20">
          Reference Object, (H: 115mm)
        </div>
      </Html>
    </group>
  )
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function useIsPortraitMobile() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false)
  const checkOrientation = () => {
    const isMobile = window.innerWidth < 768
    const isPortrait = window.innerHeight > window.innerWidth
    setIsPortraitMobile(isMobile && isPortrait)
  }
  useEffect(() => {
    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    return () => window.removeEventListener("resize", checkOrientation)
  }, [])
  return isPortraitMobile
}

// CAMERA POSITIONS
const focusMap: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  bowl: { position: [0.01, 0.28, 0.60], target: [-0.02, -0.08, 0] },
  linear: { position: [0.5, 0.3, 0.5], target: [0, 0, 0] },
  hopper: { position: [-0.4, 0.3, 0.5], target: [0, 0, 0] },
  "set-a": { position: [0, 0.4, 1.0], target: [0, 0, 0] },
  "set-b": { position: [-0.5, 0.4, 1.0], target: [0, 0, 0] },
  "set-c": { position: [-0.5, 0.5, 1.4], target: [0, 0, 0] },
}

type CameraControllerProps = {
  modelType: string
  dimensions: Record<string, string>
  controlsRef: any
}

function CameraController({ modelType, dimensions, controlsRef }: CameraControllerProps) {
  const camera = useRef<THREE.PerspectiveCamera | null>(null)
  const { camera: defaultCamera } = useThree()

  // --- DYNAMIC ZOOM & TARGET CALCULATION ---
    const { zoomMultiplier, targetHeight } = useMemo(() => {
        // 1. SET ALL ZOOM TO BE THE SAME
        const multiplier = 1.7

        // 2. Keep Target Height Logic (To look at center of machine)
        let tHeight = 0.12 

        if (modelType === "bowl" && dimensions["A"]) {
        const size = parseFloat(dimensions["A"])
        if (!isNaN(size)) {
            tHeight = (size * GLOBAL_SCALE) / 2
        }
        } else {
        if (modelType.includes("set")) tHeight = 0.3
        }
        
        return { zoomMultiplier: multiplier, targetHeight: tHeight }
    }, [modelType, dimensions])

    useEffect(() => {
    if (camera.current && controlsRef.current) {
      const focus = Object.entries(focusMap).find(([key]) => modelType.includes(key))?.[1]
      if (focus) {
        const newPos = new THREE.Vector3(...focus.position).multiplyScalar(zoomMultiplier)
        const newTarget = new THREE.Vector3(focus.target[0], targetHeight + focus.target[1], focus.target[2])

        camera.current.position.copy(newPos)
        camera.current.lookAt(newTarget)
        
        controlsRef.current.target.copy(newTarget)
        controlsRef.current.update()

        defaultCamera.position.copy(camera.current.position)
        defaultCamera.rotation.copy(camera.current.rotation)
      }
    }
  }, [modelType, defaultCamera, zoomMultiplier, targetHeight, controlsRef])

  return <PerspectiveCamera ref={camera} makeDefault fov={50} near={0.01} far={100} />
}

function Model({ path, onLoaded }: { path: string; onLoaded: () => void }) {
  const { scene } = useGLTF(path, true, undefined, () => onLoaded())
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current)
      const center = box.getCenter(new THREE.Vector3())
      modelRef.current.position.x = -center.x
      modelRef.current.position.z = -center.z
      modelRef.current.position.y = -box.min.y // Sit on floor
    }
  }, [path])

  return (
    <group ref={modelRef}>
      <primitive object={clonedScene} scale={GLOBAL_SCALE} />
    </group>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export type ModelPreviewProps = {
  isOpen: boolean
  onClose: () => void
  feederType: string
  dimensions: Record<string, string>
}

export default function ModelPreview({ isOpen, onClose, feederType, dimensions }: ModelPreviewProps) {
  const isPortraitMobile = useIsPortraitMobile()
  const [isLoading, setIsLoading] = useState(true)
  const controlsRef = useRef<any>(null)

  const modelPath = useMemo(() => {
    const rules = MODEL_SIZE_RULES[feederType] || []
    const matchedRule = rules.find((rule) => {
      const dimKeys = Array.isArray(rule.dimension) ? rule.dimension : [rule.dimension]
      return dimKeys.some(key => {
        const userValue = parseFloat(dimensions[key])
        if (isNaN(userValue)) return false
        return userValue >= rule.min && userValue <= rule.max
      })
    })
    if (matchedRule) {
      return `${getBaseFolder(feederType)}${matchedRule.file}`
    }
    return getDefaultModel(feederType)
  }, [feederType, dimensions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 print:hidden backdrop-blur-sm">
      {isPortraitMobile ? (
        <div className="text-white text-lg text-center px-6">
          <p>Please rotate your phone to landscape mode to view the model properly.</p>
        </div>
      ) : (
        <div className="relative w-[800px] h-[600px] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col">
          
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 pointer-events-none">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg pointer-events-auto shadow-lg backdrop-blur-md">
              <h3 className="font-bold text-sm">Visual Preview</h3>
              <p className="text-xs text-gray-300 font-mono mt-0.5">
                Compare the height.
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="bg-white/90 p-2 rounded-full hover:bg-white text-black pointer-events-auto shadow-lg transition-transform hover:scale-110"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-black mb-2" />
                <p className="text-sm text-gray-500 font-medium">Loading 3D Model...</p>
              </div>
            </div>
          )}

          <div className="flex-1 w-full h-full bg-[#f5f5f5]">
            <Canvas shadows>
              <CameraController modelType={feederType} dimensions={dimensions} controlsRef={controlsRef} />
              
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
              <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
              <spotLight position={[-10, 0, 10]} angle={0.5} penumbra={1} intensity={1} />

              <Suspense fallback={null}>
                <Model path={modelPath} onLoaded={() => setIsLoading(false)} />
                <ReferenceObject feederType={feederType} dimensions={dimensions} />
                <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={1} color="#000000" />
              </Suspense>

              <OrbitControls 
                ref={controlsRef}
                enablePan 
                enableZoom 
                enableRotate 
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2.1}
              />
            </Canvas>
          </div>

          <div className="bg-white border-t p-3 text-center text-sm text-gray-500">
            Hold Left Click to rotate • Scroll to zoom • Hold Right Click to pan
          </div>
        </div>
      )}
    </div>
  )
}