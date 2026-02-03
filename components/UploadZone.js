'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import { UploadCloud, Loader2, FileType } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadZone() {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const handleDrag = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true)
        } else if (e.type === 'dragleave') {
            setIsDragging(false)
        }
    }, [])

    const processFile = async (file) => {
        if (!file) return

        // Security: Check File Size (Max 50MB)
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_SIZE) {
            alert('File is too large! Maximum limit is 50MB.');
            return;
        }

        setUploading(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error('You must be logged in to upload.')

            const fileExt = file.name.split('.').pop().toLowerCase()
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `${user.id}/${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('molecules')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('molecules')
                .getPublicUrl(filePath)

            // 3. Save Metadata to DB
            const { error: dbError } = await supabase
                .from('projects')
                .insert({
                    owner_id: user.id,
                    title: file.name,
                    file_url: publicUrl,
                    file_extension: fileExt, // Crucial for viewer
                    is_public: true,
                })

            if (dbError) throw dbError

            // Refresh local data
            router.refresh()

        } catch (error) {
            alert('Error uploading file: ' + error.message)
        } finally {
            setUploading(false)
            setIsDragging(false)
        }
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center
        w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-200
        ${isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }
      `}
        >
            <input
                type="file"
                multiple={false}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdb,.sdf,.mol2,.xyz,.cif,.cube,.pqr"
            />

            <div className="flex flex-col items-center space-y-4 text-center p-6">
                {uploading ? (
                    <>
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-gray-900">Uploading...</p>
                            <p className="text-sm text-gray-500">Storing your molecule securely</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'} group-hover:bg-indigo-100 transition-colors`}>
                            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-gray-400'} group-hover:text-indigo-600`} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-gray-900">
                                Drop your molecule here
                            </p>
                            <p className="text-sm text-gray-500">
                                or click to browse
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {['PDB', 'SDF', 'MOL2', 'XYZ', 'CIF'].map((ext) => (
                                <span key={ext} className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md">
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
