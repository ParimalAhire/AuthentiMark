import { useState, useRef, useEffect } from 'react'

export default function ImageUploader({ file, onFileSelected, isDark }) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [file])

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      onFileSelected(selectedFile)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
        dragActive 
          ? isDark ? 'border-[#7f9778] bg-[#273430]' : 'border-[#6f8368] bg-[#eceee5]'
          : isDark ? 'border-[#7f9778]/30 hover:border-[#7f9778]/60 bg-[#212c29]' : 'border-[#6f8368]/30 hover:border-[#6f8368]/60 bg-[#f5f6f0]'
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      {preview ? (
        <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={preview}
            alt="Preview"
            className={`max-h-64 rounded-lg object-contain mb-6 shadow-md border ${
              isDark ? 'border-[#7f9778]/15' : 'border-[#6f8368]/15'
            }`}
          />
          <button
            type="button"
            onClick={onButtonClick}
            className={`px-5 py-2 text-xs uppercase tracking-wider font-bold border rounded-xl transition-colors ${
              isDark 
                ? 'text-[#7f9778] border-[#7f9778]/30 hover:bg-[#7f9778]/5' 
                : 'text-[#6f8368] border-[#6f8368]/30 hover:bg-[#6f8368]/5'
            }`}
          >
            Change Image
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6">
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-5 ${
            isDark ? 'bg-[#273430] border-[#7f9778]/20 text-[#7f9778]' : 'bg-[#eceee5] border-[#6f8368]/20 text-[#6f8368]'
          }`}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className={`text-sm font-light mb-1 ${
            isDark ? 'text-[#f0f2f0]' : 'text-[#1b1e1b]'
          }`}>
            Drag & drop your image here, or
            <span className={`font-medium ml-1 ${
              isDark ? 'text-[#7f9778]' : 'text-[#6f8368]'
            }`}>browse</span>
          </p>
          <p className={`text-xs mt-1 font-mono ${
            isDark ? 'text-[#a3aca4]/60' : 'text-[#5a6258]/60'
          }`}>PNG, JPG, JPEG • MAX 10MB</p>
        </div>
      )}
    </div>
  )
}
