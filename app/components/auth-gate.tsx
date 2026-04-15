'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

const ALLOWED_EMAIL = 'joao@stokysolutions.com'

type Props = {
  children: React.ReactNode
}

export default function AuthGate({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabaseBrowser.auth.getSession()

      if (error) {
        console.error('Erro ao buscar sessão:', error.message)
        setAuthorized(false)
        setLoading(false)
        return
      }

      const email = data.session?.user?.email

      if (email && email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }

      setLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email

      if (email && email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleGoogleLogin = async () => {
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error('Erro no login com Google:', error.message)
      alert('Não foi possível iniciar o login com Google.')
    }
  }

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut()
    setAuthorized(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b141a] text-white">
        <div className="rounded-3xl border border-white/10 bg-[#111b21] px-8 py-6 shadow-2xl">
          Verificando acesso...
        </div>
      </main>
    )
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b141a] px-4 text-white">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#111b21] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-xl font-bold text-[#0b141a]">
            SS
          </div>

          <h1 className="text-2xl font-semibold">Stoky SMS</h1>

          <p className="mt-3 text-sm text-[#9fb3c8]">
            Faça login com sua conta Google para acessar seu painel privado.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="mt-6 w-full rounded-2xl bg-[#25d366] px-5 py-3 font-semibold text-[#0b141a] transition hover:opacity-90"
          >
            Entrar com Google
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-50">
        <button
          onClick={handleLogout}
          className="rounded-xl border border-white/10 bg-[#202c33] px-4 py-2 text-sm text-white transition hover:bg-[#2a3942]"
        >
          Sair
        </button>
      </div>

      {children}
    </div>
  )
}