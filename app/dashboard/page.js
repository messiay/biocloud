'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadZone from '@/components/UploadZone'
import { FileText, Clock, ExternalLink, Loader2 } from 'lucide-react'

export default function Dashboard() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setProjects(data)
            setLoading(false)
        }

        fetchProjects()

        // Realtime subscription to update list on new upload
        const channel = supabase
            .channel('realtime projects')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, (payload) => {
                setProjects((prev) => [payload.new, ...prev])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your molecular collection</p>
                </div>
            </header>

            {/* Upload Section */}
            <section>
                <UploadZone />
            </section>

            {/* Projects Grid */}
            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link href={`/view/${project.id}`} key={project.id} className="group block">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <span className="px-2 py-1 text-xs font-bold tracking-wider text-gray-600 uppercase bg-gray-100 rounded border border-gray-200">
                                        {project.file_extension}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                                    {project.title}
                                </h3>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        View
                                        <ExternalLink className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                            <p>No molecules uploaded yet.</p>
                            <p className="text-sm">Upload your first file above!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
