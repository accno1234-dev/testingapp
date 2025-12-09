"use client"

import FeederPage from "@/components/feeder-page"

const setCDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  H: "",
  I: "",
  J: "",
  K: "",
  L: "",
  M: "",
  N: "",
  O: "",
  P: "",
}

const setCDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 10.7, y: 29.4 },
    B: { x: 14.4, y: 40.9 },
    C: { x: 13.5, y: 51.1 },
    D: { x: 24.9, y: 50.4 },
    E: { x: 28.5, y: 52.8 },
    F: { x: 14.1, y: 84.5 },
    G: { x: 39.7, y: 83.1 },
    H: { x: 14, y: 98.5 },
    I: { x: 43.2, y: 98.8 },
    J: { x: 42.4, y: 70.9 },
    K: { x: 31.8, y: 54.8 },
    L: { x: 59.2, y: 51.6 },
    M: { x: 29.8, y: 1.5 },
    N: { x: 31.8, y: 4 },
    O: { x: 40.6, y: 30 },
    P: { x: 45.4, y: 29 },
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [1.24, 0.40, 0.42],   
    B: [1.37, 0.34, 1.65],
    C: [1.15, 0.31, 2.35],
    D: [0.60, 0.39, 1.26],
    E: [-0.03, 0.51, -0.04],
    F: [1.22, -0.44, 2.48],
    G: [0.93, -0.29, 0.33],
    H: [0.90, -1.29, -1.20],
    I: [1.98, -1.35, -1.17],
    J: [0.95, 0.29, -2.59],
    K: [-0.03, 2.48, -2.59],
    L: [1.22, 0.89, -0.39],
    M: [-0.00, -1.26, 2.34],
    N: [-0.02, -1.24, -2.88],
    O: [1.92, -1.20, 0.45],
    P: [-1.02, -1.23, 1.25],
    // ... map all your dimensions
}

export default function setCPage() {
  return (
    <FeederPage
      title="Set C Configuration"
      feederType="set-c" //later will change
      imageSrc="/set-c.jpeg"
      dimensionDescriptions={setCDimensionDescriptions}
      dimensionPositions={setCDimensionPositions}
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
