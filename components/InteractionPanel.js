'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { Save, Lock, MessageSquare, StickyNote, Send, MoreVertical, Trash2 } from 'lucide-react'

// Helper to generate consistent avatar color from string (email/id)
const getAvatarColor = (str) => {
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

export default function InteractionPanel({ projectId, initialNotes, isOwner, user }) {
    const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'comments'

    // Notes Logic
    const [notes, setNotes] = useState(initialNotes || '')
    const [savingNotes, setSavingNotes] = useState(false)

    const handleSaveNotes = async () => {
        if (!isOwner) return
        setSavingNotes(true)
        try {
            const { error } = await supabase.from('projects').update({ notes }).eq('id', projectId)
            if (error) throw error
        } catch (error) {
            alert('Failed to save notes')
        } finally {
            setSavingNotes(false)
        }
    }

    // Comments Logic
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(true)

    useEffect(() => {
        if (activeTab === 'comments') {
            fetchComments()

            const channel = supabase
                .channel('comments-' + projectId)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `project_id=eq.${projectId}`
                }, payload => {
                    if (payload.eventType === 'INSERT') {
                        // We need to fetch the author details
                        // For simplicity in this realtime update we might just reload or optimistically add if we had the user info
                        fetchComments()
                    } else if (payload.eventType === 'DELETE') {
                        setComments(prev => prev.filter(c => c.id !== payload.old.id))
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [activeTab, projectId])

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles ( email, full_name, avatar_url )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setComments(data)
        }
        setLoadingComments(false)
    }

    const handlePostComment = async () => {
        if (!newComment.trim() || !user) return

        const { error } = await supabase
            .from('comments')
            .insert({
                project_id: projectId,
                user_id: user.id,
                content: newComment.trim()
            })

        if (!error) {
            setNewComment('')
            fetchComments() // Refresh to get the definitive server state
        } else {
            alert('Failed to post comment')
        }
    }

    const handleDeleteComment = async (commentId) => {
        if (!confirm('Delete this comment?')) return
        await supabase.from('comments').delete().eq('id', commentId)
        // Optimistic update handled by Subscription or refetch
        fetchComments()
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Tab Header */}
            <div className="px-4 border-b border-gray-100 flex items-center gap-6 bg-white">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'notes'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <StickyNote className="w-4 h-4" />
                    Notes
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'comments'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Discussion
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col">
                        {!isOwner && (
                            <div className="px-6 py-2 bg-gray-50/50 border-b border-gray-50 text-xs text-gray-500 flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                Only the owner can edit these notes.
                            </div>
                        )}
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={!isOwner}
                            className={`w-full h-full p-6 text-base text-gray-700 bg-white border-0 focus:ring-0 resize-none leading-relaxed ${!isOwner ? 'cursor-default' : ''
                                }`}
                            placeholder={isOwner ? "Add your research notes..." : "No notes recorded."}
                        />
                        {isOwner && (
                            <div className="absolute bottom-6 right-6">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={savingNotes}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm font-medium"
                                >
                                    <Save className="w-4 h-4" />
                                    {savingNotes ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* COMMENTS TAB */}
                {activeTab === 'comments' && (
                    <div className="h-full flex flex-col">
                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {comments.length === 0 && !loadingComments && (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    No comments yet. Start the conversation!
                                </div>
                            )}

                            {comments.map((comment) => {
                                const isMyComment = user?.id === comment.user_id
                                const canDelete = isMyComment || isOwner
                                const authorName = comment.profiles?.email?.split('@')[0] || 'Unknown'
                                const avatarColor = getAvatarColor(comment.user_id)

                                return (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs text-white font-bold ${avatarColor}`}>
                                            {authorName[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {comment.profiles?.full_name || authorName}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-r-xl rounded-bl-xl">
                                                {comment.content}
                                            </div>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            {user ? (
                                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Type a comment..."
                                        className="w-full bg-transparent border-0 focus:ring-0 text-sm p-2 max-h-32 resize-none"
                                        rows="1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handlePostComment()
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        disabled={!newComment.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-2">
                                    Sign in to join the discussion.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
