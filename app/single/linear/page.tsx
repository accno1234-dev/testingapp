"use client"

import FeederPage from "@/components/feeder-page"

const linearDimensionDescriptions: Record<string, string> = {
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
    F: "",
}

const linearDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 48.5, y: 28 },
    B: { x: 64, y: 7 },
    C: { x: 34.4, y: 78 },
    D: { x: 65, y: 57 },
    E: { x: 46, y: 93 },
    F: { x: 86.2, y: 89.2 },
}

const bowlFeederDimensionPositions3D: Record<string, [number, number, number]> = {
    A: [1.66, -0.96, -0.20],   
    B: [0.08, -1.20, 2.32],
    C: [-2.27, 0.45, 0.68],
    D: [-0.05, 2.23, 0.69],
    E: [-1.92, -1.21, 0.69],
    F: [2.01, -1.23, 0.69],
    // ... map all your dimensions
}

const dimensionConfigs = {

    "bowl-feeder": {
    title: "Bowl Feeder Configuration",
    imageSrc: "/dimension-drawing.jpeg",
    dimensionDescriptions: {
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
    },
    dimensionPositions: {
        A: { x: 15.7, y: 29.4 },
        B: { x: 19.8, y: 42 },
        C: { x: 19.1, y: 51.4 },
        D: { x: 28.6, y: 50.2 },
        E: { x: 33.9, y: 52.5 },
        F: { x: 19.6, y: 85.2 },
        G: { x: 41.5, y: 83.1 },
        H: { x: 18.4, y: 98.7 },
        I: { x: 43.2, y: 98.8 },
        J: { x: 43.5, y: 67.2 },
        K: { x: 31.8, y: 55.5 },
        L: { x: 59.2, y: 51.6 },
        M: { x: 29.8, y: 1.5 },
        N: { x: 31.8, y: 4.3 },
        O: { x: 42, y: 33.5 },
        P: { x: 45.4, y: 29 },
    },
  },
  conveyor: {
    title: "Linear Configuration",
    imageSrc: "/linear-feeder.jpg", 
    dimensionDescriptions: linearDimensionDescriptions,
    dimensionPositions: linearDimensionPositions,
  },
}

export default function LinearPage() {
  return (
    
      <FeederPage
        title="Linear Configuration"
        feederType="linear"
        imageSrc="/linear.jpg" 
        dimensionDescriptions={linearDimensionDescriptions}
        dimensionPositions={linearDimensionPositions}
        dimensionPositions3D={bowlFeederDimensionPositions3D}
        machineInfoFields={[
          { id: "partName", label: "Part Name / Project No.", type: "text" },
          { id: "linearNo", label: "Linear No.", type: "text" },
         
        ]}
      />

  )
}
