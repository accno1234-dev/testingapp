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

const HIDE_REFERENCE_FOR = ["hopper", "set-a", "set-b", "set-c"] //Hide reference object

// New Type Definitions for Flexible Scaling
type AxisRule = {
  axis: "x" | "y" | "z"  // Which axis to scale on the 3D part
  input: string          // Which User Input dimension controls this? (e.g. "A", "B")
  base: number           // The native size of this part's axis in the GLB file (mm)
  offset?: number        // Fixed mm to add
  overlapInput?: string  // Input controlling the container (e.g. "D")
  overlapBase?: number   // Base size of the container
  overlapSize?: number   // Hidden length at base size
}

type PartScalingRule = {
  targetPart: string     // Name of the object in Blender (e.g. "A", "C")
  rules: AxisRule[]      // List of scaling rules for this part
}

type SizeRule = {
  dimension: string | string[] // Input used to SELECT the file (e.g. "C")
  min: number
  max: number
  file: string
  baseSize?: number            // Simple Mode: Native size for uniform scaling (Bowl)
  scaling?: PartScalingRule[]  // Advanced Mode: Specific part scaling (Linear)
}

const MODEL_SIZE_RULES: Record<string, SizeRule[]> = {

  bowl: [
    { 
      dimension: "A", min: 0, max: 900, file: "bowl-d.glb",
      scaling: [{targetPart: "A", rules: [{axis: "x", input: "A", base: 115}, {axis: "z", input: "B", base: 115}, {axis: "y", input: "E", base: 90}]},
                {targetPart: "B", rules: [{axis: "x", input: "A", base: 115}, {axis: "z", input: "C", base: 25}, {axis: "y", input: "E", base: 90}]}]
    }
  ],

  linear: [
    {
      dimension: "C", min: 0, max: 300, file: "linear-d.glb",
      scaling: [{targetPart: "A", rules: [{axis: "x", input: "B", base: 90}, {axis: "z", input: "A", base: 90}, {axis: "y", input: "C", base: 90}]},
                {targetPart: "B", rules: [{axis: "x", input: "B", base: 90}, {axis: "z", input: "A", base: 90}, {axis: "y", input: "C", base: 90}]},
                {targetPart: "C", rules: [{axis: "z", input: "D", base: 200}, {axis: "x", input: "A", base: 90}, {axis: "y", input: "C", base: 90}]}]
    }
  ],

  hopper: [
    {
      dimension:"C", min: 100, max: 2000, file: "hopper-d.glb", 
      scaling: [{targetPart: "B", rules: [{ axis: "x", input: "B", base: 33 }, { axis: "z", input: "A", base: 37 }, { axis: "y", input: "C", base: 89 }]},
                {targetPart: "A", rules: [{ axis: "x", input: "B", base: 33 }, { axis: "z", input: "F", base: 47, overlapBase: 47, overlapSize: 37 }, { axis: "y", input: "C", base: 89 }]}]
    }
  ],

  "set-a": [
    {
      dimension:"H", min: 0, max: 10000, file:"set-a-d.glb", 
      scaling: [{targetPart: "A", rules:[{axis: "x", input: "F", base: 129}, {axis: "z", input: "F", base: 129}, {axis: "y", input: "H", base: 108}]},
                {targetPart: "B", rules:[{axis: "x", input: "A", base: 154}, {axis: "z", input: "E", base: 168}, {axis: "y", input: "H", base: 108}]},
                {targetPart: "C", rules:[{axis: "z", input: "C", base: 40, overlapInput: "D", overlapBase: 1, overlapSize: 1}, {axis: "x", input: "F", base: 129}, {axis: "y", input: "H", base: 108}]},
                {targetPart: "D", rules:[{axis: "y", input: "G", base: 96}, {axis: "x", input: "F", base: 129}, {axis: "z", input: "F", base: 129}, {axis: "y", input: "H", base: 108}]}]
    }
  ],

  "set-b": [
    {
      dimension:"E", min: 0, max: 10000, file:"set-b-d.glb", 
      scaling: [{targetPart: "B", rules:[{axis: "x", input: "D", base: 150}, {axis: "z", input: "A", base: 178 }]},
                {targetPart: "C", rules:[{axis: "x", input: "B", base: 64}, {axis: "z", input: "B", base: 64}, {axis: "y", input: "F", base: 100}]},
                {targetPart: "A", rules:[{axis: "x", input: "E", base: 167}, {axis: "z", input: "E", base: 167}, {axis: "y", input: "E", base: 167}]}]
    }
  ],

  "set-c": [
    {
      dimension: "G", min: 0, max: 10000, file: "set-c-d.glb",
      scaling: [{targetPart: "A", rules:[{axis: "x", input: "K", base: 55}, {axis: "z", input: "N", base: 86}, {axis: "y", input: "J", base: 118}, {axis: "x", input: "D", base: 43}, {axis: "z", input: "E", base: 86}]},
                {targetPart: "B", rules:[{axis: "x", input: "M", base: 120}, {axis: "z", input: "O", base: 120}, {axis: "y", input: "G", base: 64}]},
                {targetPart: "C", rules:[{axis: "x", input: "D", base: 43}, {axis: "z", input: "B", base: 47, overlapInput: "C", overlapBase: 1, overlapSize: 1}, {axis: "y", input: "E", base: 86}, {axis: "y", input: "G", base: 64}]},
                {targetPart: "D", rules:[{axis: "x", input: "D", base: 43}, {axis: "z", input: "E", base: 86}, {axis: "y", input: "G", base: 64}]},
                {targetPart: "E", rules:[{axis: "x", input: "D", base: 43}, {axis: "z", input: "E", base: 86}, {axis: "y", input: "F", base: 54}, {axis: "y", input: "G", base: 64}]}]
    }
  ]
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
// CAMERA POSITIONS
// ==========================================
const focusMap: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  bowl: { position: [0.01, 0.28, 0.60], target: [-0.02, -0.08, 0] },
  linear: { position: [0.5, 0.3, 0.5], target: [0, 0, 0] },
  hopper: { position: [-0.4, 0.3, 0.5], target: [0, 0, 0] },
  "set-a": { position: [0, 0.4, 1.0], target: [0, 0, 0] },
  "set-b": { position: [-0.5, 0.4, 1.0], target: [0, 0, 0] },
  "set-c": { position: [-0.5, 0.5, 1.4], target: [0, 0, 0] },
}

// ==========================================
// REFERENCE OBJECT
// ==========================================
type ReferenceObjectProps = {
  feederType: string
  dimensions: Record<string, string>
}

function ReferenceObject({ feederType, dimensions }: ReferenceObjectProps) {
  const canHeight = 115 * GLOBAL_SCALE
  const canRadius = 33 * GLOBAL_SCALE

  const xOffset = useMemo(() => {
    let offset = -0.1 

    if (feederType === "bowl") {
      const dimA = parseFloat(dimensions["A"])
      if (!isNaN(dimA)) {
        const worldRadius = (dimA * GLOBAL_SCALE) / 2
        offset = -(worldRadius + 0.08)
      }
    } else if (feederType === "linear") {
       // Just using A as a rough estimate for gap
       const dimA = parseFloat(dimensions["A"])
       if (!isNaN(dimA)) {
         offset = -((dimA * GLOBAL_SCALE) / 2 + 0.08)
       }
    }
    
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
          Reference Object (H: 115mm)
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
  useEffect(() => {
    const check = () => setIsPortraitMobile(window.innerWidth < 768 && window.innerHeight > window.innerWidth)
    check(); window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isPortraitMobile
}

type CameraControllerProps = {
  modelType: string
  dimensions: Record<string, string>
  controlsRef: any
}

function CameraController({ modelType, dimensions, controlsRef }: CameraControllerProps) {
  const camera = useRef<THREE.PerspectiveCamera | null>(null)
  const { camera: defaultCamera } = useThree()

  const { zoomMultiplier, targetHeight } = useMemo(() => {
    const multiplier = 1.7
    let tHeight = 0.12 

    if (modelType === "bowl" && dimensions["A"]) {
      const size = parseFloat(dimensions["A"])
      if (!isNaN(size)) tHeight = (size * GLOBAL_SCALE) / 2
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

// ------------------------------------------
// UPDATED MODEL COMPONENT
// Handles both Root Scaling and Multi-Part Scaling
// ------------------------------------------
type ModelProps = {
  path: string
  rootScale: number | [number, number, number]
  partConfigs?: { name: string; scale: [number, number, number] }[]
  onLoaded: () => void
}

function Model({ path, rootScale, partConfigs, onLoaded }: ModelProps) {
  const { scene } = useGLTF(path, true) 
  useEffect(() => {
    onLoaded()
  }, [onLoaded])

  const clonedScene = useMemo(() => scene.clone(), [scene])
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    // 1. Center the model
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current)
      const center = box.getCenter(new THREE.Vector3())
      modelRef.current.position.x = -center.x
      modelRef.current.position.z = -center.z
      modelRef.current.position.y = -box.min.y
    }

    // 2. APPLY PART SCALING (Loop through config)
    if (partConfigs && partConfigs.length > 0 && clonedScene) {
      partConfigs.forEach(config => {
        const targetObject = clonedScene.getObjectByName(config.name)
        if (targetObject) {
          targetObject.scale.set(config.scale[0], config.scale[1], config.scale[2])
          // console.log(`Scaled ${config.name}:`, config.scale)
        }
      })
    }
  }, [path, partConfigs, clonedScene])

  return (
    <group ref={modelRef}>
      <primitive object={clonedScene} scale={rootScale} />
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

  // --- MATCHING & SCALING LOGIC ---
  const { modelPath, rootScale, partConfigs } = useMemo(() => {
    const rules = MODEL_SIZE_RULES[feederType] || []
    
    let selectedFile = getDefaultModel(feederType)
    let computedRootScale: number | [number, number, number] = GLOBAL_SCALE
    let computedPartConfigs: { name: string; scale: [number, number, number] }[] = []

    const matchedRule = rules.find((rule) => {
      const dimKeys = Array.isArray(rule.dimension) ? rule.dimension : [rule.dimension]
      return dimKeys.some(key => {
        const userValue = parseFloat(dimensions[key])
        if (isNaN(userValue)) return false
        return userValue >= rule.min && userValue <= rule.max
      })
    })

    if (matchedRule) {
      selectedFile = `${getBaseFolder(feederType)}${matchedRule.file}`
      
      // === ADVANCED SCALING (Specific Parts) ===
      if (matchedRule.scaling) {
        computedRootScale = GLOBAL_SCALE // Keep main object fixed
        
        computedPartConfigs = matchedRule.scaling.map(partRule => {
          let sx = 1, sy = 1, sz = 1
          
          // Calculate scale for each axis defined in config
          partRule.rules.forEach(r => {
            const val = parseFloat(dimensions[r.input])
            if (!isNaN(val) && r.base > 0) {
              let currentOffset = r.offset || 0
              // Calculate Dynamic Overlap
              if (r.overlapInput && r.overlapBase && r.overlapSize) {
                const containerVal = parseFloat(dimensions[r.overlapInput])
                if (!isNaN(containerVal)) {
                  // How much did the container grow?
                  const containerScale = containerVal / r.overlapBase
                  // Add proportional overlap
                  currentOffset += r.overlapSize * containerScale
                } else {
                  currentOffset += r.overlapSize // Fallback
                }
              }
                // Calculate final scale ratio
                const targetSize = val + currentOffset
                const ratio = targetSize / r.base
                // === END OF NEW LOGIC ===

                if (r.axis === "x") sx = ratio
                if (r.axis === "y") sy = ratio
                if (r.axis === "z") sz = ratio
            }
          })
          return { name: partRule.targetPart, scale: [sx, sy, sz] }
        })
      } 
      
      // === SIMPLE SCALING ===
      else if (matchedRule.baseSize) {
        const dimKeys = Array.isArray(matchedRule.dimension) ? matchedRule.dimension : [matchedRule.dimension]
        const inputValues = dimKeys
          .map(k => parseFloat(dimensions[k]))
          .filter(v => !isNaN(v))
        
        if (inputValues.length > 0) {
          const size = Math.max(...inputValues)
          computedRootScale = (size / matchedRule.baseSize) * GLOBAL_SCALE
        }
      }
    }
    
    return { modelPath: selectedFile, rootScale: computedRootScale, partConfigs: computedPartConfigs }
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
            </div>
            <button onClick={onClose} className="bg-white/90 p-2 rounded-full hover:bg-white text-black pointer-events-auto shadow-lg transition-transform hover:scale-110">
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
                <Model 
                  path={modelPath} 
                  rootScale={rootScale} 
                  partConfigs={partConfigs} 
                  onLoaded={() => setIsLoading(false)} 
                />
                {!HIDE_REFERENCE_FOR.includes(feederType) && (
                  <ReferenceObject feederType={feederType} dimensions={dimensions} />
                )}
                <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={1} color="#000000" />
              </Suspense>

              <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
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