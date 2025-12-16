"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import NavigationMenu from "./navigation-menu"
import { Printer, RefreshCw, Send, Check, ExternalLink } from "lucide-react"
import { Howl } from "howler"
import { motion, AnimatePresence } from "framer-motion"
import html2canvas from "html2canvas"
import FeederVisualization from "./feeder-visualization"
import ModelPreview from "./model-preview"

// ==========================================
// CONFIGURATION: INPUT LIMITS
// ==========================================
const DEFAULT_LIMITS = { min: 0, max: 10000 }

const FEEDER_LIMITS: Record<string, Record<string, { min?: number; max?: number }>> = {
  "bowl": {
    "A": { min: 120, max: 800 },
    "B": { min: 120, max: 800 },
    "C": { min: 10, max: 150 }
  },
  "linear": {
    "C": { min: 68, max: 200 },
    "D": { min: 50, max: 500 }
  },
  "hopper": { 
    "C": { min:100, max: 2000 }
  },
  "set-a": { "B": { max: 150 } },
  "set-b": { "C": { max: 150 } },
  "set-c": { "A": { max: 150 } },
}

const getLimits = (feederType: string, dimension: string) => {
  const specific = FEEDER_LIMITS[feederType]?.[dimension]
  return {
    min: specific?.min ?? DEFAULT_LIMITS.min,
    max: specific?.max ?? DEFAULT_LIMITS.max,
  }
}

// ==========================================
// COMPONENT
// ==========================================

export type FeederPageProps = {
  title: string
  feederType: string
  imageSrc: string
  modelPath?: string
  dimensionDescriptions: Record<string, string>
  dimensionPositions: Record<string, { x: number; y: number }>
  nextPageRoute?: string
  previousPageRoute?: string
  machineInfoFields?: Array<{
    id: string
    label: string
    type: "text" | "select" | "number"
    options?: string[]
  }>
  dimensionPositions3D?: Record<string, [number, number, number]>
}

export default function FeederPage({
  title,
  feederType,
  imageSrc,
  modelPath = `/models/${feederType}.glb`,
  dimensionDescriptions,
  dimensionPositions,
  dimensionPositions3D,
  nextPageRoute,
  previousPageRoute,
  machineInfoFields = [
    { id: "machineNo", label: "Machine no.", type: "text" },
    { id: "rotation", label: "Rotation", type: "select", options: ["Clockwise", "Anti-clockwise"] },
    { id: "uph", label: "UPH", type: "number" },
    { id: "remark", label: "Remark", type: "text" },
  ],
}: FeederPageProps) {
  const { getFeederData, updateFeederData } = useFormContext()
  const feederData = getFeederData(feederType)
  
  // State
  const [currentDimension, setCurrentDimension] = useState<string | null>(null)
  const [dimensionValue, setDimensionValue] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showBackToMain, setShowBackToMain] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ cname: "", name: "", email: "", phone: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsedData, setParsedData] = useState<{
    machineInfo: Record<string, string>
    dimensions: Record<string, string>
  } | null>(null)
  const [showParsePreview, setShowParsePreview] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showSuccessPoster, setShowSuccessPoster] = useState(false)
  const [emptyMachineFields, setEmptyMachineFields] = useState<string[]>([])
  const [showCharacter, setShowCharacter] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Refs
  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const soundRef = useRef<Howl | null>(null)

  // Audio cleanup
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
      }
    }
  }, [])

  // Helpers
  const allDimensionsFilled = () => {
    return Object.keys(dimensionDescriptions).every((key) => feederData.dimensions[key])
  }

  const clearCurrentPageData = () => {
    updateFeederData(feederType, {
      dimensions: {},
      machineInfo: {},
    })
  }

  const playErrorSound = (message: string) => {
    setShowCharacter(true)
    setIsSpeaking(true)
    setErrorMessage(message)

    let audioFile = "/dimension-not-complete.mp3"
    // Keep generic for now to save space, or re-add specific checks if needed
    if (message.includes("Dimension A")) audioFile = "/sounds/dimensionA.mp3"

    soundRef.current = new Howl({
      src: [audioFile],
      html5: true,
      onend: () => {
        setIsSpeaking(false)
      },
    })

    soundRef.current.play()
    
    // Fallback timer
    setTimeout(() => {
      setIsSpeaking(false)
    }, 5000)
  }

  const showTempError = (message: string) => {
    setShowCharacter(true)
    setIsSpeaking(true)
    setErrorMessage(message)
    setTimeout(() => {
      setIsSpeaking(false)
    }, 5000)
  }

  const handleDimensionClick = (dimension: string) => {
    setCurrentDimension(dimension)
    setDimensionValue(feederData.dimensions[dimension] || "")
  }

  const handleSend = () => {
    setShowContactForm(true)
  }

  const handleSaveAsPDF = () => {
    window.print()
  }

  // --- FILE HANDLING (Restored) ---
  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // --- SCREENSHOT LOGIC (Restored Full Version) ---
  const captureFeederInfoScreenshot = async (): Promise<Blob> => {
    const feederInfoElement = document.querySelector(".feeder-info-container") as HTMLElement
    if (!feederInfoElement) throw new Error("Feeder Info section not found")

    try {
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "fixed"
      tempContainer.style.top = "-9999px"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = "800px"
      tempContainer.style.height = "600px"
      tempContainer.style.backgroundColor = "#ffffff"
      tempContainer.style.padding = "16px"
      tempContainer.style.fontFamily = "system-ui, -apple-system, sans-serif"
      document.body.appendChild(tempContainer)

      const content = `
        <div style="width: 100%; height: 100%; position: relative; background: white;">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #000;">Feeder Info</h2>
          <p style="font-size: 14px; font-style: italic; color: #ef4444; margin-bottom: 8px;">* Set value as 0 if there is no dimension</p>
          
          <div style="position: relative; width: 100%; height: 400px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            <img src="${imageSrc}" alt="Dimension Drawing" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            
            ${Object.entries(dimensionPositions)
              .map(([dim, { x, y }]) => {
                const value = feederData.dimensions[dim] || dim
                const hasValue = feederData.dimensions[dim]
                return `
                <div style="
                  position: absolute; left: ${x}%; top: ${y}%; transform: translate(-2%, -70%); width: 18px; height: 18px;
                  background: white; border: 1px solid ${hasValue ? "transparent" : "#ef4444"}; border-radius: 2px;
                  display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 500;
                  color: ${hasValue ? "#000" : "#ef4444"}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ">
                  ${value}
                </div>`
              })
              .join("")}
          </div>
          
          <div style="position: absolute; bottom: 16px; left: 16px;">
            <div style="background: white; border: 1px solid white; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px;">↻</span> Clear Data
            </div>
          </div>
          
          <div style="position: absolute; bottom: 16px; right: 16px;">
            <div style="background: white; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px;">OK</div>
          </div>
        </div>
      `
      tempContainer.innerHTML = content

      const img = tempContainer.querySelector("img") as HTMLImageElement
      if (img && !img.complete) {
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve })
      }
      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(tempContainer, {
        useCORS: true, allowTaint: true, scale: 2, width: 800, height: 600, backgroundColor: "#ffffff", logging: false, removeContainer: false, foreignObjectRendering: false, imageTimeout: 15000,
      })
      document.body.removeChild(tempContainer)
      return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0))
    } catch (error) {
      console.error("Screenshot capture failed:", error)
      throw error
    }
  }

  const handleSendEmail = async () => {
    if (!contactForm.cname) { showTempError("Please fill in your company name"); return }
    if (!contactForm.name) { showTempError("Please fill in your name"); return }
    if (!contactForm.email) { showTempError("Please fill in your email"); return }

    try {
      setIsSubmitting(true)
      setShowContactForm(false)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const screenshotBlob = await captureFeederInfoScreenshot()
      const screenshotFile = new File([screenshotBlob], `${feederType}-configuration-screenshot.png`, { type: "image/png" })

      const formData = new FormData()
      formData.append("cname", contactForm.cname)
      formData.append("name", contactForm.name)
      formData.append("email", contactForm.email)
      formData.append("phone", contactForm.phone || "Not provided")
      formData.append("message", contactForm.message)
      formData.append("feederType", feederType)
      formData.append("title", title)
      formData.append("formData", formatDataForEmail(feederData))

      selectedFiles.forEach((file) => formData.append("files", file))
      formData.append("files", screenshotFile)

      const response = await fetch("/api/send-email", { method: "POST", body: formData })

      if (response.ok) {
        setShowSuccessPoster(true)
        setTimeout(() => setShowSuccessPoster(false), 3000)
        showTempError("Email sent successfully!")
        setShowBackToMain(true)
      } else {
        showTempError("Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      showTempError("Error sending email")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDataForEmail = (data: any) => {
    let result = `${title}\nGenerated on: ${getCurrentDate()}\n\nMACHINE INFORMATION\n------------------\n`
    machineInfoFields.forEach((field) => {
      result += `${field.label}: ${data.machineInfo[field.id] || "Not specified"}\n`
    })
    result += "\nDIMENSIONS\n------------------\n"
    Object.entries(dimensionDescriptions).forEach(([key, _]) => {
      result += `${key} ${data.dimensions[key] || "Not specified"} mm\n`
    })
    return result
  }

  const handleClearData = () => {
    clearCurrentPageData()
    playErrorSound("Data cleared successfully!")
  }

  const handlePreviewClick = () => {
    if (!allDimensionsFilled()) {
      const missing = Object.keys(dimensionDescriptions).find(k => !feederData.dimensions[k])
      if (missing) {
        playErrorSound(`Dimension ${missing} is missing!`)
        const btn = document.querySelector(`button[style*="left: ${dimensionPositions[missing].x}%"]`) as HTMLElement
        btn?.click()
      } else {
        playErrorSound("Please fill in all dimensions first.")
      }
      return 
    }
    setShowPreview(true)
  }

  const handleOkClick = () => {
    if (!allDimensionsFilled()) {
      const firstEmpty = Object.keys(dimensionDescriptions).find((key) => !feederData.dimensions[key])
      if (firstEmpty) {
        playErrorSound(`Dimension ${firstEmpty} is missing!`)
        const btn = document.querySelector(`button[style*="left: ${dimensionPositions[firstEmpty].x}%"]`) as HTMLElement
        btn?.click()
      }
      return
    }

    const emptyFields = machineInfoFields
      .filter((field) => field.id !== "remark")
      .filter((field) => !feederData.machineInfo[field.id] || feederData.machineInfo[field.id].trim() === "")

    setEmptyMachineFields(emptyFields.map((f) => f.id))

    if (emptyFields.length > 0) {
      playErrorSound(`${emptyFields[0].label} is missing!`)
      const el = document.getElementById(emptyFields[0].id)
      el?.focus()
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setShowSuccessModal(true)
  }

  const getCurrentDate = () => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} at ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

  const updateMachineInfo = (id: string, value: string) => {
    updateFeederData(feederType, {
      ...feederData,
      machineInfo: { ...feederData.machineInfo, [id]: value },
    })
  }

  const updateDimension = (dimension: string, value: string) => {
    updateFeederData(feederType, {
      ...feederData,
      dimensions: { ...feederData.dimensions, [dimension]: value },
    })
  }

  // Paste Data Logic
  const handleAnalyzeData = () => parseData()

  const parseData = () => {
    try {
      const lines = pasteText.split("\n").filter((line) => line.trim() !== "")
      const newMachineInfo: Record<string, string> = {}
      const newDimensions: Record<string, string> = {}

      lines.forEach((line) => {
        machineInfoFields.forEach((field) => {
          const match = line.match(new RegExp(`${field.label}\\s*[:\\s]\\s*([^:]+)`, "i"))
          if (match && match[1]) newMachineInfo[field.id] = match[1].trim()
        })
        Object.keys(dimensionDescriptions).forEach((key) => {
          const match = line.match(new RegExp(`\\b${key}\\b[^:]*?\\b(\\d+)\\b`, "i"))
          if (match && match[1]) newDimensions[key] = match[1].trim()
        })
      })

      setParsedData({ machineInfo: newMachineInfo, dimensions: newDimensions })
      setShowParsePreview(true)
      return { machineInfo: newMachineInfo, dimensions: newDimensions }
    } catch (error) {
      showTempError("Failed to parse data.")
      return null
    }
  }

  const applyParsedData = () => {
    const result = parsedData || parseData()
    if (!result) return
    
    updateFeederData(feederType, {
      machineInfo: { ...feederData.machineInfo, ...result.machineInfo },
      dimensions: { ...feederData.dimensions, ...result.dimensions },
    })
    setShowPasteModal(false)
    setPasteText("")
    setParsedData(null)
    showTempError("Data imported successfully!")
  }

  const useDragConstraints = (visibleArea = 100) => {
    const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 })
    useEffect(() => {
      const update = () => {
        const vw = document.documentElement.clientWidth
        const vh = document.documentElement.clientHeight
        setConstraints({ top: -vh + visibleArea, left: -vw + visibleArea, right: 0, bottom: 0 })
      }
      update(); window.addEventListener("resize", update)
      return () => window.removeEventListener("resize", update)
    }, [visibleArea])
    return constraints
  }
  const dragConstraints = useDragConstraints(100)

  return (
    <>
      <NavigationMenu />
      <div className="bg-[#f2f4f4] min-h-screen w-[1050px] overflow-auto mx-auto p-4 print:p-0 light">
        <div ref={printRef} className="print-container flex flex-col h-[297mm] p-4 print:p-0 relative">
          <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

          {/* Machine Info */}
          <div className="border bg-white rounded-md p-3 mb-3">
            <h2 className="text-lg font-medium mb-2">Machine Information</h2>
            <div className="grid grid-cols-3 gap-4">
              {machineInfoFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block mb-1 font-medium">{field.label}</label>
                  {field.id === "remark" ? (
                    <div className="relative">
                      <textarea
                        id={field.id}
                        value={feederData.machineInfo[field.id] || ""}
                        onChange={(e) => e.target.value.length <= 60 && updateMachineInfo(field.id, e.target.value)}
                        maxLength={60} rows={1}
                        className="w-full border rounded-md px-3 py-2 resize-none overflow-hidden"
                        placeholder="Enter up to 60 characters"
                      />
                      <div className="text-right text-sm text-gray-500 mt-1 print:hidden">
                        {feederData.machineInfo[field.id]?.length || 0} / 60 chars
                      </div>
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      id={field.id}
                      value={feederData.machineInfo[field.id] || ""}
                      onChange={(e) => updateMachineInfo(field.id, e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 ${emptyMachineFields.includes(field.id) ? "border-red-700 animate-pulse" : ""}`}
                    >
                      <option value="">Select</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type}
                      value={feederData.machineInfo[field.id] || ""}
                      onChange={(e) => updateMachineInfo(field.id, e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 ${emptyMachineFields.includes(field.id) ? "border-red-700 animate-pulse" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feeder Info */}
          <div className="feeder-info-container border bg-white rounded-md p-4 flex-grow mb-3 relative">
            <h2 className="text-lg font-medium mb-2">Feeder Info</h2>
            <p className="text-sm italic text-red-500 mb-2">* Set value as 0 if there is no dimension</p>

            <div className="flex-grow relative min-h-[600px]">
              <FeederVisualization
                imageSrc={imageSrc}
                modelPath={modelPath}
                dimensions={feederData.dimensions}
                positions2D={dimensionPositions}
                positions3D={dimensionPositions3D}
                onDimensionClick={handleDimensionClick}
                onClearData={handleClearData}
                hideMarkers={!!currentDimension || showSuccessModal || showContactForm || showPasteModal}
              />
            </div>

            <div className="absolute bottom-6 left-6 flex print:hidden gap-2">
              <button onClick={handleClearData} className="bg-white border border-black text-black px-4 py-2 rounded-md flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Clear Data
              </button>
            </div>
            
            <div className="absolute bottom-6 right-6 flex print:hidden gap-2">
              <button onClick={handlePreviewClick} className="bg-white text-black border border-black px-4 py-2 rounded-md shadow-lg hover:bg-gray-100 transition-colors">
                Preview Model
              </button>
              <button onClick={handleOkClick} className="bg-black text-white px-4 py-2 rounded-md">
                OK
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-auto">Generated on {getCurrentDate()}</div>
        </div>

        {/* INPUT DIALOG */}
        {currentDimension && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 print:hidden">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h3 className="text-lg font-bold mb-4">
                Enter dimension {currentDimension}: {dimensionDescriptions[currentDimension]}
              </h3>
              <input
                type="number"
                value={dimensionValue}
                onChange={(e) => setDimensionValue(e.target.value)}
                placeholder="Enter value in mm"
                autoFocus
                className="w-full border rounded-md px-3 py-2 mb-4"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const trimmedValue = dimensionValue.trim()
                    const numValue = parseFloat(trimmedValue)
                    const limits = getLimits(feederType, currentDimension!)
                    
                    if (trimmedValue !== "") {
                      if (numValue < limits.min) {
                        playErrorSound(`Dimension ${currentDimension} is too small!`)
                        return
                      }
                      if (numValue > limits.max) {
                        playErrorSound(`Dimension ${currentDimension} is too large!`)
                        return
                      }
                    }

                    updateDimension(currentDimension!, trimmedValue)
                    setCurrentDimension(null)
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 z-200 flex items-center justify-center print:hidden">
            <div className="relative bg-white p-6 rounded-lg w-[500px] shadow-lg text-center">
              <button onClick={() => setShowSuccessModal(false)} className="absolute top-2 right-2 text-xl">&times;</button>
              <h2 className="text-2xl font-bold mb-4">Congratulations, your dimension is completed!🎉🎉🎉</h2>
              <div className="w-full rounded-md mb-4 border-2 border-black bg-white overflow-hidden">
                <video src="/hopper.mp4" autoPlay loop muted playsInline className="w-full h-auto block" />
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <button onClick={() => { setShowSuccessModal(false); handleSend() }} className="bg-black text-white px-6 py-2 rounded-md flex items-center">
                  <Send className="mr-2 h-4 w-4" /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT FORM (Restored Full Version) */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/60 z-200 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-6 shadow-md w-[500px] max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowContactForm(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Send Your Configuration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please provide your contact information to send the feeder configuration.
              </p>
              
              <div className="mb-4">
                <label htmlFor="cname" className="block text-sm font-medium mb-1">Company Name <span className="text-red-500">*</span></label>
                <input type="text" id="cname" className="border w-full p-2 rounded" value={contactForm.cname} onChange={(e) => setContactForm({ ...contactForm, cname: e.target.value })} required />
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" id="name" className="border w-full p-2 rounded" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" id="email" className="border w-full p-2 rounded" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone <span className="text-gray-500">(optional)</span></label>
                <input type="tel" id="phone" className="border w-full p-2 rounded" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium mb-1">Message <span className="text-gray-500">(optional)</span></label>
                <textarea id="message" rows={3} className="border w-full p-2 rounded" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
              </div>

              {/* ATTACHMENT SECTION */}
              <div className="mb-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">📎 Attachments <span className="text-gray-500">(optional)</span></label>
                  <label htmlFor="file-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add File
                  </label>
                  <input
                    type="file" multiple id="file-upload" className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (selectedFiles.length + files.length > 5) { showTempError("Maximum 5 files allowed"); return }
                      const oversized = files.filter((f) => f.size > 10 * 1024 * 1024)
                      if (oversized.length > 0) { showTempError(`Files exceed 10MB limit: ${oversized.map((f) => f.name).join(", ")}`); return }
                      setSelectedFiles((prev) => [...prev, ...files])
                    }}
                  />
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{selectedFiles.length} of 5 files</span>
                    <span>{(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB of 50 MB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (selectedFiles.length / 5) * 100)}%` }}></div>
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"}`}
                  onDrop={handleFileDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                >
                  {selectedFiles.length === 0 ? (
                    <div className="text-center py-8">
                       <p className="text-sm text-gray-600 font-medium">Drag and drop files here</p>
                       <p className="text-xs text-gray-500 mt-1">PDF, DOC, TXT, Images, Videos (Max 10MB each)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-2 bg-white">
                          <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700">&times;</button>
                          <div className="flex flex-col items-center pt-4">
                            <p className="text-xs text-gray-700 truncate w-full text-center">{file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center" onClick={handleSaveAsPDF}>
                  <Printer className="mr-2 h-4 w-4" /> Save as PDF
                </button>
                <button className="bg-black text-white px-4 py-2 rounded flex items-center" onClick={handleSendEmail} disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ModelPreview isOpen={showPreview} onClose={() => setShowPreview(false)} feederType={feederType} dimensions={feederData.dimensions} />

        {/* Animated Bot */}
        <motion.div className="fixed bottom-40 sm:bottom-6 right-6 z-40 cursor-grab active:cursor-grabbing" drag dragConstraints={dragConstraints} whileHover={{ scale: 1.05 }}>
          <motion.div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-transparent shadow-lg" animate={{ scale: isSpeaking ? 1.15 : 1 }}>
            <img src="/bot.gif" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          </motion.div>
          <AnimatePresence>
            {isSpeaking && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-24 right-1/2 transform translate-x-12 bg-white px-4 py-3 rounded-2xl shadow-lg max-w-xs">
                <p className="text-sm font-medium">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {showBackToMain && (
           <div className="fixed inset-0 bg-black/60 z-200 flex items-center justify-center print:hidden">
             <div className="relative bg-white p-6 rounded-lg w-[500px] shadow-lg text-center">
               <h2 className="text-2xl font-bold mb-4">Back to main page?</h2>
               <div className="flex justify-center gap-4">
                 <button onClick={() => {setShowBackToMain(false); router.push("/")}} className="bg-white border border-black px-6 py-2 rounded-md">Continue</button>
                 <a href="https://www.tnctech.com.my" className="bg-black text-white px-6 py-2 rounded-md">Back To Main</a>
               </div>
             </div>
           </div>
        )}

        {showSuccessPoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <img src="/thank-you.jpeg" className="h-[90vh] w-auto mx-auto mb-4 shadow-xl" />
          </div>
        )}
        
        {/* Paste Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black/60 z-200 flex items-center justify-center print:hidden">
             <div className="bg-white rounded-lg p-6 w-[600px] h-[80vh] overflow-auto">
               <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} className="border w-full h-64 p-2" placeholder="Paste Data Here" />
               <div className="flex justify-end gap-2 mt-4">
                 <button onClick={() => setShowPasteModal(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                 <button onClick={handleAnalyzeData} className="bg-black text-white px-4 py-2 rounded">Analyze</button>
               </div>
             </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse { 0%, 100% { border-color: rgb(230, 36, 36); } 50% { border-color: rgb(252, 252, 252); } }
        .animate-pulse { animation: pulse 1s infinite; }
      `}</style>
    </>
  )
}