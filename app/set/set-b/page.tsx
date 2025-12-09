"use client"

import FeederPage from "@/components/feeder-page"

const setBDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  
}

const setBDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 45.2, y: 26.9 },
    B: { x: 27.2, y: 43.8 },
    C: { x: 16, y: 45.2},
    D: { x: 35, y: 48 },
    E: { x: 86, y: 70.7 },
    F: { x: 47.6, y: 81.5 },
    G: { x: 19.2, y: 86.7 },
   
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [1.53, -1.29, 0.14],   
    B: [0.52, 0.55, 0.86],
    C: [1.33, 0.46, 1.14],
    D: [-0.06, -1.38, 2.02],
    E: [-0.06, 0.61, -2.86],
    F: [-0.08, -0.05, 1.82],
    G: [1.20, -0.16, 1.47],
    // ... map all your dimensions
}

export default function setBPage() {
  return (
    <FeederPage
      title="Set B Configuration"
      feederType="set-b" //later will change
      imageSrc="/set-b.jpeg"
      dimensionDescriptions={setBDimensionDescriptions}
      dimensionPositions={setBDimensionPositions}
      dimensionPositions3D={bowlFeederDimensionPositions3D}
      machineInfoFields={[
        { id: "partName", label: "Part Name / Project No.", type: "text" },
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
