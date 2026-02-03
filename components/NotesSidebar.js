'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Save, Lock } from 'lucide-react'

export default function NotesSidebar({ projectId, initialNotes, isOwner }) {
    const [notes, setNotes] = useState(initialNotes || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!isOwner) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('projects')
                .update({ notes })
                .eq('id', projectId)

            if (error) throw error
            // Optional: Toast notification
        } catch (error) {
            alert('Failed to save notes')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="w-full lg:w-80 flex flex-col h-full bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    Project Notes
                </h2>
                {!isOwner && (
                    <span className="text-xs flex items-center gap-1 text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3" /> Read Only
                    </span>
                )}
            </div>

            <div className="flex-1 p-4">
                {isOwner ? (
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-full p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all placeholder:text-gray-300"
                        placeholder="Write your research notes here..."
                    />
                ) : (
                    <div className="w-full h-full p-4 text-sm text-gray-600 bg-gray-50 rounded-lg overflow-auto prose prose-sm">
                        {notes || <em className="text-gray-400">No notes available.</em>}
                    </div>
                )}
            </div>

            {isOwner && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? (
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                </div>
            )}
        </div>
    )
}
