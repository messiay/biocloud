'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/utils/supabase'
import { useParams } from 'next/navigation'
import MoleculeViewer from '@/components/MoleculeViewer'
import NotesSidebar from '@/components/NotesSidebar'
import { Share2, ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ViewPage({ params }) {
    // Unwrapping params for Next.js 15+ (if applicable, but useParams is safer client-side)
    const { id } = useParams()
    const [project, setProject] = useState(null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getData() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (!id) return;

            const { data, error } = await supabase
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
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-800">Project Not Found</h2>
                <Link href="/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    const isOwner = user?.id === project.owner_id

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                    <span className="px-2 py-1 text-xs font-bold uppercase bg-indigo-100 text-indigo-700 rounded border border-indigo-200">
                        {project.file_extension}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={project.file_url}
                        download
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Download Original File"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

                {/* Viewer Area */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 relative">
                        <MoleculeViewer
                            url={project.file_url}
                            type={project.file_extension}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:w-96 h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
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
