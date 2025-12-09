//sample page

"use client"

import FeederPage from "@/components/feeder-page"

const bowlFeederDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
}

const bowlFeederDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 53.5, y: 5.4 },
    B: { x: 70.6, y: 26.9 },
    C: { x: 35.7, y: 40.4 },
    D: { x: 49.5, y: 49.7 },
    E: { x: 30.2, y: 72.4 },
    F: { x: 37.8, y:76.9}
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [-1.55, 1.39, 0.05],   
    B: [-0.66, 1.39, -0.90],
    C: [1.66, 1.50, 0.52],
    D: [0.42, 1.39, 2.36],
    E: [-0.25, 0.31, 1.66],
    F: [1.67, 0.01, 1.16],
    // ... map all your dimensions
}


export default function BowlFeederPage() {
  return (
    <FeederPage
      title="Bowl Feeder Configuration"
      feederType="bowl" //later will change
      imageSrc="/bowl.jpeg"
      dimensionDescriptions={bowlFeederDimensionDescriptions}
      dimensionPositions={bowlFeederDimensionPositions}
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
