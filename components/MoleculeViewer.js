'use client'
import { useEffect, useRef, useState } from 'react'

export default function MoleculeViewer({ url, type }) {
    const containerRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let viewer = null
        if (!containerRef.current || !url) return

        setLoading(true)

        // Clear previous viewer
        containerRef.current.innerHTML = ''

        let $3Dmol

        // Dynamic import to avoid SSR "window is not defined" error
        import('3dmol').then((module) => {
            $3Dmol = module

            // Initialize viewer
            const config = { backgroundColor: 'white' }
            viewer = $3Dmol.createViewer(containerRef.current, config)

            // Fetch the molecule file
            return fetch(url)
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`)
                return res.text()
            })
            .then((data) => {
                if (!data) throw new Error('File is empty')
                if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
                    throw new Error('File validation failed (Received HTML instead of molecule data). Check file URL access.')
                }

                // Sanitize type
                const ext = type.toLowerCase()

                // Load model
                viewer.addModel(data, ext)

                // Conditional Styling
                // Cartoon is only safe/relevant for macromolecules (PDB, CIF, etc.)
                // For small molecules (SDF, MOL2, XYZ), use Stick/Sphere
                const isProtein = ['pdb', 'cif', 'mmtf', 'pqr', 'ent'].includes(ext)

                if (isProtein) {
                    viewer.setStyle({}, { cartoon: { color: 'spectrum' }, stick: {} })
                } else {
                    viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.25 } })
                }

                viewer.zoomTo()
                viewer.render()
                setLoading(false)
            })
            .catch((err) => {
                console.error('Error loading molecule:', err)
                setError(err.message)
                setLoading(false)
            })

    }, [url, type])

    return (
        <div className="relative w-full h-full bg-gray-100 overflow-hidden">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Rendering...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                    <div className="text-center p-6 max-w-md border border-red-200 bg-red-50 rounded">
                        <h3 className="text-red-800 font-bold mb-2 font-mono uppercase text-xs">Error</h3>
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full"
            />
        </div>
    )
}
