// pages/index.tsx
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const urlRegex = /^(https?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!$&'()*+,;=.]+$/i;

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [original, setOriginal] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [error, setError] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortUrl('');

    // Validate URL
    let validUrl = false;
    try {
      // Throws if not a valid URL
      new URL(original);
      validUrl = true;
    } catch {
      validUrl = false;
    }

    if (!urlRegex.test(original) || !validUrl) {
      setError('Please enter a valid URL.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, customSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setShortUrl(`${window.location.origin}/${data.slug}`);
      }
    } catch {
      setError('Network error.');
    }

    setLoading(false);
  };

  const handleCopy = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', padding: 20, position: 'relative' }}>
      <nav style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {status === 'loading' ? null : session?.user ? (
          <>
            <span>Hello, {session.user?.email}</span>
            <button onClick={() => signOut()}>Sign out</button>
            <button onClick={() => router.push('/dashboard')}>Dashboard</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/signin')}>Sign in</button>
            <button onClick={() => router.push('/register')}>Sign up</button>
          </>
        )}
      </nav>
      <h1 style={{ textAlign: 'center', marginTop: 40 }}>URL Shortener</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="url"
          placeholder="Enter long URL"
          value={original}
          onChange={e => setOriginal(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Custom slug (optional)"
          value={customSlug}
          onChange={e => setCustomSlug(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {shortUrl && (
        <>
          <p style={{ color: '#2ecc40', marginTop: 16 }}>Success! Here's your shortened URL:</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>
              {shortUrl}
            </a>
            <button onClick={handleCopy} style={{ width: 'fit-content' }}>Copy to clipboard</button>
          </div>
        </>
      )}
    </main>
  );
}
