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
    B: { x: 67, y: 25 },
    C: { x: 36.9, y: 40.4 },
    D: { x: 49.5, y: 49.7 },
    E: { x: 33.1, y: 73.5 },
    F: { x: 39.5, y:77}
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [1.5, 0.5, 0],   
    B: [0, 1.2, 0],
    C: [-1.2, 0.5, 0.5],
    D: [0, 0.5, 0.5],
    E: [2, 0.5, 0.5],
    F: [3, 0.5, 0.5],
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
