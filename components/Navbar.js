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
        <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                <Dna className="w-6 h-6" />
                BioCloud
            </Link>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                            Dashboard
                        </Link>
                        <div className="flex items-center gap-3 pl-4 border-l">
                            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <User className="w-4 h-4" />
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    )
}
