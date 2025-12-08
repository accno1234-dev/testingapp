//sample page only, need to change later

"use client"

import FeederPage from "@/components/feeder-page"

const hopperDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
}

const hopperDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 67.5, y: 7.2 },
    B: { x: 76, y: 22 },
    C: { x: 26.4, y: 66.5 },
    D: { x: 76, y: 48.2 },
    E: { x: 52, y: 76.2 },
    F: { x: 60, y: 66.5 },
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [-1.10, 2.50, -0.03],   
    B: [0.01, 2.50, -0.02],
    C: [1.20, 0.27, -0.00],
    D: [0.01, 1.88, -1.09],
    E: [0.02, -0.59, 2.14],
    F: [0.03, 0.22, 1.23],
    // ... map all your dimensions
}

export default function hopperPage() {
  return (
    <FeederPage
      title="Hopper Configuration"
      feederType="hopper" //later will change
      imageSrc="/hopper.jpg"
      dimensionDescriptions={hopperDimensionDescriptions}
      dimensionPositions={hopperDimensionPositions}
      dimensionPositions3D={bowlFeederDimensionPositions3D}
      machineInfoFields={[
        { id: "partName", label: "Part Name / Project No.", type: "text" },
        { id: "hopperBinCapacity", label: "Hopper Bin Capacity", type: "number" },
        
      ]}
    />
  )
}
