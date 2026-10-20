import { useState } from 'react'
import { supabase } from '../supabase'

/** One-time, on a new phone: email, then the six-digit code from the email. */
export function SignIn() {
  const [email, setEmail] = useState(() => localStorage.getItem('email') ?? '')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')

  async function send() {
    setBusy(true); setProblem('')
    const { error } = await supabase!.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
    setBusy(false)
    if (error) { setProblem(error.message.includes('Signups not allowed') ? 'That email isn’t set up for Keepsake yet.' : error.message); return }
    localStorage.setItem('email', email.trim())
    setSent(true)
  }

  async function verify() {
    setBusy(true); setProblem('')
    const { error } = await supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setProblem('That code didn’t work. Check the newest email, or ask for another code.')
  }

  return (
    <div className="screen screen--pad signin">
      <img className="signin__icon" src="/icons/icon-192.png" alt="" />
      <h1 className="h1" style={{ textAlign: 'center' }}>Keepsake</h1>
      {!sent ? (
        <>
          <p className="row__sub" style={{ textAlign: 'center', marginBottom: 18 }}>Your diary lives safely in the cloud. Sign in once on this phone.</p>
          <input className="search" type="email" inputMode="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} disabled={busy || !email.includes('@')} onClick={() => void send()}>
            {busy ? 'Sending…' : 'Send me a code'}
          </button>
        </>
      ) : (
        <>
          <p className="row__sub" style={{ textAlign: 'center', marginBottom: 18 }}>A six-digit code is on its way to {email}. Type it here.</p>
          <input className="search signin__code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} disabled={busy || code.trim().length < 6} onClick={() => void verify()}>
            {busy ? 'Checking…' : 'That’s it'}
          </button>
          <button className="btn btn--quiet btn--block" style={{ marginTop: 6 }} onClick={() => { setSent(false); setCode('') }}>Send another code</button>
        </>
      )}
      {problem && <p className="row__sub" style={{ color: 'var(--danger)', textAlign: 'center', marginTop: 14 }}>{problem}</p>}
    </div>
  )
}
