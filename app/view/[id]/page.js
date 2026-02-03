'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useParams, useRouter } from 'next/navigation'
import MoleculeViewer from '@/components/MoleculeViewer'
import NotesSidebar from '@/components/NotesSidebar'
import { ArrowLeft, Download, Share2, Loader2, Database, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ViewPage() {
    const { id } = useParams()
    const router = useRouter()
    const [project, setProject] = useState(null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getData() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (!id) return;

            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single()

            if (data) setProject(data)
            setLoading(false)
        }
        getData()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!project) return null

    const isOwner = user?.id === project.owner_id

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard')
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* Left Panel: 3D Stage */}
            <div className="flex-1 relative bg-gray-100 flex flex-col">
                <div className="absolute top-4 left-4 z-10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Repository
                    </Link>
                </div>

                <div className="flex-1 w-full h-full">
                    {/* The containerRef in MoleculeViewer handles dimensions automatically */}
                    <div className="w-full h-full relative">
                        <MoleculeViewer
                            url={project.file_url}
                            type={project.file_extension}
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel: Sidebar Information */}
            <div className="w-[400px] flex flex-col border-l border-gray-200 bg-white">

                {/* Header Metadata */}
                <div className="p-8 border-b border-gray-50 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {project.file_extension.toUpperCase()}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={copyLink} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Share">
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <a href={project.file_url} download className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Download">
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 break-words tracking-tight leading-tight">{project.title}</h1>
                    </div>
                </div>

                {/* Notes Component (Fills remaining height) */}
                <div className="flex-1 overflow-hidden">
                    <NotesSidebar
                        projectId={project.id}
                        initialNotes={project.notes}
                        isOwner={isOwner}
                    />
                </div>
            </div>
        </div>
    )
}
