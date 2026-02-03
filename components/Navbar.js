'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import { LogOut, User, Dna } from 'lucide-react'

export default function Navbar() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null)
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        })
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky-nav">
            <Link href="/" className="flex items-center gap-2 font-semibold text-xl text-gray-900 tracking-tight">
                <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                    <Dna className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">BioCloud</span>
            </Link>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Dashboard
                        </Link>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <span className="text-sm text-gray-500 hidden sm:block font-medium">{user.email}</span>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-gray-100 rounded-full"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                    >
                        <User className="w-4 h-4" />
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    )
}
