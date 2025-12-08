"use client"

import FeederPage from "@/components/feeder-page"

const setADimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  H: "",
  I: "",
 
}

const setADimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 31.2, y: 8 },
    B: { x: 19.2, y: 20 },
    C: { x: 22, y: 40 },
    D: { x: 23.6, y: 55.2 },
    E: { x: 45.4, y: 29.5 },
    F: { x: 30.1, y: 52 },
    G: { x: 21, y: 75.1 },
    H: { x: 46, y: 72 },
    I: { x: 22.6, y: 93.5 },
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [0.26, -0.61, -2.75],   
    B: [-2.12, 2.01, 0.74],
    C: [-2.05, 2.12, 2.30],
    D: [-1.90, 2.07, 2.81],
    E: [2.25, -0.61, 0.41],
    F: [-1.05, 2.07, 2.93],
    G: [-1.77, 0.80, 2.92],
    H: [2.59, 1.27, 0.04],
    I: [-2.50, -0.78, 2.77],
    // ... map all your dimensions
}

export default function setAPage() {
  return (
    <FeederPage
      title="Set A Configuration"
      feederType="set-a" //later will change
      imageSrc="/set-a.jpeg"
      dimensionDescriptions={setADimensionDescriptions}
      dimensionPositions={setADimensionPositions}
      dimensionPositions3D={bowlFeederDimensionPositions3D}
      machineInfoFields={[
        { id: "Part Name", label: "Part Name / Project No.", type: "text" },
        {
          id: "rotation",
          label: "Rotation",
          type: "select",
          options: ["Clockwise", "Anti-clockwise"],
        },
        { id: "uph", label: "UPH", type: "number" },
        
      ]}
    />
  )
}
