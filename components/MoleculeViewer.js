'use client'
import { useEffect, useRef, useState } from 'react'
import * as $3Dmol from '3dmol'

export default function MoleculeViewer({ url, type }) {
    const containerRef = useRef(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!containerRef.current || !url) return

        setLoading(true)

        // Clear previous viewer if any (simple way is to clear innerHTML, but 3Dmol creates a canvas)
        containerRef.current.innerHTML = ''

        // Initialize viewer
        const config = { backgroundColor: 'white' }
        const viewer = $3Dmol.createViewer(containerRef.current, config)

        // Fetch the molecule file
        fetch(url)
            .then((res) => res.text())
            .then((data) => {
                // addModel(data, format)
                // ensure type is supported. 3Dmol supports many.
                viewer.addModel(data, type)

                // Default style - can be improved
                viewer.setStyle({}, { cartoon: { color: 'spectrum' }, stick: {} })

                viewer.zoomTo()
                viewer.render()
                setLoading(false)
            })
            .catch((err) => {
                console.error('Error loading molecule:', err)
                setLoading(false)
            })

    }, [url, type])

    return (
        <div className="relative w-full h-[600px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full"
            />
        </div>
    )
}
