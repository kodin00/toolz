import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'

type RGB = { r: number; g: number; b: number }
type Point = { x: number; y: number }
type RemovalTarget = { id: number; color: RGB; seed: Point | null }
type ViewMode = 'result' | 'original'
type RemovalMode = 'connected' | 'everywhere'

const DEFAULT_COLOR: RGB = { r: 238, g: 232, b: 218 }
const MAX_COLORS = 8

function rgbToHex({ r, g, b }: RGB) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function hexToRgb(hex: string): RGB {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function colorDistance(data: Uint8ClampedArray, offset: number, color: RGB) {
  const red = data[offset] - color.r
  const green = data[offset + 1] - color.g
  const blue = data[offset + 2] - color.b
  return Math.sqrt(red * red + green * green + blue * blue)
}

function processImage(
  source: ImageData,
  targets: RemovalTarget[],
  tolerance: number,
  feather: number,
  mode: RemovalMode,
) {
  const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height)
  const data = output.data
  const pixelCount = source.width * source.height
  const maxDistance = tolerance + Math.max(feather, 1)

  for (const target of targets) {
    let removalMask: Uint8Array | null = null

    if (mode === 'connected') {
      removalMask = new Uint8Array(pixelCount)
      const queued = new Uint8Array(pixelCount)
      const queue = new Int32Array(pixelCount)
      let head = 0
      let tail = 0

      const enqueue = (index: number) => {
        if (index < 0 || index >= pixelCount || queued[index]) return
        if (colorDistance(data, index * 4, target.color) > maxDistance) return
        queued[index] = 1
        queue[tail] = index
        tail += 1
      }

      if (target.seed) {
        enqueue(target.seed.y * source.width + target.seed.x)
      } else {
        for (let x = 0; x < source.width; x += 1) {
          enqueue(x)
          enqueue((source.height - 1) * source.width + x)
        }
        for (let y = 0; y < source.height; y += 1) {
          enqueue(y * source.width)
          enqueue(y * source.width + source.width - 1)
        }
      }

      while (head < tail) {
        const index = queue[head]
        head += 1
        removalMask[index] = 1
        const x = index % source.width
        if (x > 0) enqueue(index - 1)
        if (x < source.width - 1) enqueue(index + 1)
        if (index >= source.width) enqueue(index - source.width)
        if (index < pixelCount - source.width) enqueue(index + source.width)
      }
    }

    for (let index = 0; index < pixelCount; index += 1) {
      if (removalMask && !removalMask[index]) continue
      const offset = index * 4
      const distance = colorDistance(data, offset, target.color)
      if (distance <= tolerance) {
        data[offset + 3] = 0
      } else if (distance < maxDistance) {
        const edgeAlpha = (distance - tolerance) / Math.max(feather, 1)
        data[offset + 3] = Math.round(data[offset + 3] * edgeAlpha)
      }
    }
  }

  return output
}

export function BackgroundRemover() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const processedDataRef = useRef<ImageData | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const nextTargetIdRef = useRef(1)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [draftColor, setDraftColor] = useState<RGB>(DEFAULT_COLOR)
  const [targets, setTargets] = useState<RemovalTarget[]>([])
  const [tolerance, setTolerance] = useState(42)
  const [feather, setFeather] = useState(14)
  const [viewMode, setViewMode] = useState<ViewMode>('result')
  const [removalMode, setRemovalMode] = useState<RemovalMode>('connected')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file to continue.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('That image is over 25 MB. Choose a smaller file.')
      return
    }
    releaseObjectUrl()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setFileName(file.name)
    setImageUrl(url)
    setError('')
    setTargets([])
    setViewMode('result')
  }, [releaseObjectUrl])

  const loadSample = useCallback(async () => {
    try {
      const response = await fetch('/sample-image.svg')
      const blob = await response.blob()
      loadFile(new File([blob], 'toolroom-sample.svg', { type: 'image/svg+xml' }))
    } catch {
      setError('The sample could not be loaded.')
    }
  }, [loadFile])

  useEffect(() => () => releaseObjectUrl(), [releaseObjectUrl])

  useEffect(() => {
    if (!imageUrl) return
    let cancelled = false
    setIsLoading(true)
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const maxSide = 1800
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      const imageData = context.getImageData(0, 0, width, height)
      originalDataRef.current = imageData
      const cornerColor = { r: imageData.data[0], g: imageData.data[1], b: imageData.data[2] }
      setDraftColor(cornerColor)
      setTargets([{ id: nextTargetIdRef.current++, color: cornerColor, seed: { x: 0, y: 0 } }])
      setDimensions({ width, height })
      setIsLoading(false)
    }
    image.onerror = () => {
      if (!cancelled) {
        setError('This image could not be read. Try a PNG, JPG, WEBP, or SVG.')
        setIsLoading(false)
      }
    }
    image.src = imageUrl
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  useEffect(() => {
    const source = originalDataRef.current
    const canvas = canvasRef.current
    if (!source || !canvas || dimensions.width === 0) return
    const processed = processImage(source, targets, tolerance, feather, removalMode)
    processedDataRef.current = processed
    const context = canvas.getContext('2d')
    context?.putImageData(viewMode === 'result' ? processed : source, 0, 0)
  }, [targets, tolerance, feather, removalMode, viewMode, dimensions])

  const addTarget = (color: RGB, seed: Point | null) => {
    setTargets((current) => {
      if (current.length >= MAX_COLORS) return current
      const duplicate = current.some((target) => (
        rgbToHex(target.color) === rgbToHex(color)
        && (
          seed === null
          || (target.seed?.x === seed.x && target.seed?.y === seed.y)
        )
      ))
      if (duplicate) return current
      return [...current, { id: nextTargetIdRef.current++, color, seed }]
    })
  }

  const pickColor = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const source = originalDataRef.current
    const canvas = canvasRef.current
    if (!source || !canvas) return
    const bounds = canvas.getBoundingClientRect()
    const x = Math.min(source.width - 1, Math.max(0, Math.floor((event.clientX - bounds.left) * source.width / bounds.width)))
    const y = Math.min(source.height - 1, Math.max(0, Math.floor((event.clientY - bounds.top) * source.height / bounds.height)))
    const offset = (y * source.width + x) * 4
    const color = { r: source.data[offset], g: source.data[offset + 1], b: source.data[offset + 2] }
    setDraftColor(color)
    addTarget(color, { x, y })
    setViewMode('result')
  }

  const resetImage = () => {
    releaseObjectUrl()
    setImageUrl(null)
    setFileName('')
    setDimensions({ width: 0, height: 0 })
    originalDataRef.current = null
    processedDataRef.current = null
    setTargets([])
    setError('')
  }

  const download = () => {
    const data = processedDataRef.current
    if (!data) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = data.width
    exportCanvas.height = data.height
    exportCanvas.getContext('2d')?.putImageData(data, 0, 0)
    const link = document.createElement('a')
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'background-removed'
    link.href = exportCanvas.toDataURL('image/png')
    link.download = `${baseName}-transparent.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="tool-workspace">
      <section className="tool-intro">
        <div>
          <span className="eyebrow"><i /> IMAGE UTILITY</span>
          <h1>Background<br /><em>Remover.</em></h1>
        </div>
        <p>Choose an image, sample the colors you want gone, and export a clean transparent PNG. Everything happens right here in your browser.</p>
      </section>

      <section className="remover-panel">
        <div className="preview-column">
          {!imageUrl ? (
            <div
              className={isDragging ? 'upload-zone dragging' : 'upload-zone'}
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                const file = event.dataTransfer.files[0]
                if (file) loadFile(file)
              }}
            >
              <div className="upload-art">
                <span className="upload-ring ring-a" />
                <span className="upload-ring ring-b" />
                <span className="upload-icon"><Icon name="upload" size={28} /></span>
              </div>
              <span className="upload-kicker">START HERE</span>
              <h2>Drop your image</h2>
              <p>PNG, JPG, WEBP, or SVG up to 25 MB</p>
              <div className="upload-actions">
                <button className="primary-button" onClick={() => fileInputRef.current?.click()} type="button">
                  <Icon name="image" size={18} /> Choose image
                </button>
                <button className="text-button" onClick={loadSample} type="button">Try a sample <Icon name="arrow" size={16} /></button>
              </div>
              {error && <span className="form-error">{error}</span>}
            </div>
          ) : (
            <div className="image-stage-shell">
              <div className="stage-toolbar">
                <div className="view-switch">
                  <button className={viewMode === 'result' ? 'active' : ''} onClick={() => setViewMode('result')} type="button">Result</button>
                  <button className={viewMode === 'original' ? 'active' : ''} onClick={() => setViewMode('original')} type="button">Original</button>
                </div>
                <button className="replace-button" onClick={() => fileInputRef.current?.click()} type="button">
                  <Icon name="image" size={16} /> Replace
                </button>
              </div>
              <div className="image-stage">
                {isLoading && <span className="loading-pill">Preparing image…</span>}
                <canvas
                  aria-label="Image preview. Click to sample a background color."
                  className="image-canvas"
                  onClick={pickColor}
                  ref={canvasRef}
                />
              </div>
              <div className="stage-meta">
                <span>{fileName}</span>
                <span>{dimensions.width} × {dimensions.height} px</span>
              </div>
            </div>
          )}
          {!imageUrl && <canvas className="hidden-canvas" ref={canvasRef} />}
          <input
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="visually-hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) loadFile(file)
              event.target.value = ''
            }}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <aside className="controls-column">
          <div className="control-head">
            <span className="step-number">01</span>
            <div>
              <span className="control-label">TARGET COLOR</span>
              <h3>What should disappear?</h3>
            </div>
          </div>

          <button
            className={imageUrl ? 'picker-tip active' : 'picker-tip'}
            disabled={!imageUrl}
            onClick={() => setViewMode('original')}
            type="button"
          >
            <span><Icon name="palette" size={19} /></span>
            <div>
              <strong>Pick colors from the image</strong>
              <small>Click repeatedly to add up to {MAX_COLORS} colors.</small>
            </div>
            <Icon name="chevron" size={15} />
          </button>

          <div className="color-field">
            <label className="color-swatch" style={{ backgroundColor: rgbToHex(draftColor) }}>
              <input
                aria-label="Choose a color to remove"
                onChange={(event) => setDraftColor(hexToRgb(event.target.value))}
                type="color"
                value={rgbToHex(draftColor)}
              />
            </label>
            <span>
              <small>New color</small>
              <strong>{rgbToHex(draftColor)}</strong>
            </span>
            <button
              className="add-color-button"
              disabled={targets.length >= MAX_COLORS}
              onClick={() => addTarget(draftColor, null)}
              type="button"
            >
              <Icon name="plus" size={14} /> Add
            </button>
          </div>

          <div className="color-list-head">
            <span>Colors to remove</span>
            <b>{targets.length}/{MAX_COLORS}</b>
          </div>
          <div className="color-chips">
            {targets.length === 0 ? (
              <span className="no-colors">Pick a color to begin.</span>
            ) : targets.map((target, index) => (
              <span className="color-chip" key={target.id}>
                <i style={{ backgroundColor: rgbToHex(target.color) }} />
                <small>{rgbToHex(target.color)}</small>
                <button
                  aria-label={`Remove color ${index + 1}, ${rgbToHex(target.color)}`}
                  onClick={() => setTargets((current) => current.filter((item) => item.id !== target.id))}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="control-divider" />

          <div className="control-head compact">
            <span className="step-number">02</span>
            <div>
              <span className="control-label">REFINE</span>
              <h3>Fine-tune the edges</h3>
            </div>
          </div>

          <label className="range-control">
            <span><strong>Color range</strong><output>{tolerance}</output></span>
            <input max="140" min="0" onChange={(event) => setTolerance(Number(event.target.value))} type="range" value={tolerance} />
            <small>Higher values include more shades around your color.</small>
          </label>

          <label className="range-control">
            <span><strong>Edge softness</strong><output>{feather}</output></span>
            <input max="60" min="0" onChange={(event) => setFeather(Number(event.target.value))} type="range" value={feather} />
            <small>Softens color spill around the subject’s edge.</small>
          </label>

          <div className="mode-control">
            <span><strong>Remove from</strong><Icon name="info" size={15} /></span>
            <div>
              <button className={removalMode === 'connected' ? 'active' : ''} onClick={() => setRemovalMode('connected')} type="button">Connected area</button>
              <button className={removalMode === 'everywhere' ? 'active' : ''} onClick={() => setRemovalMode('everywhere')} type="button">Everywhere</button>
            </div>
          </div>

          <div className="control-actions">
            <button className="download-button" disabled={!imageUrl || isLoading} onClick={download} type="button">
              <Icon name="download" size={19} /> Download PNG
            </button>
            {imageUrl && <button className="reset-button" onClick={resetImage} type="button">Clear image</button>}
          </div>
        </aside>
      </section>

      <section className="how-strip">
        <span className="how-title">HOW IT WORKS</span>
        <div><b>1</b><span><strong>Upload</strong><small>Choose your image</small></span></div>
        <i />
        <div><b>2</b><span><strong>Pick</strong><small>Sample a color</small></span></div>
        <i />
        <div><b>3</b><span><strong>Download</strong><small>Save a clear PNG</small></span></div>
        <span className="local-badge"><Icon name="shield" size={15} /> 100% local</span>
      </section>
    </div>
  )
}
