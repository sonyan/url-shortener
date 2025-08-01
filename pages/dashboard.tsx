// pages/dashboard.tsx

import { getSession, useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function ShortUrlCell({ url, setEditingSlugId, setNewSlug, setSlugError }) {
  const [copied, setCopied] = useState(false);
  const shortUrl = typeof window !== 'undefined' ? `${window.location.origin}/${url.slug}` : `/${url.slug}`;
  return (
    <>
      <a href={`/${url.slug}`} target="_blank" rel="noopener noreferrer">/{url.slug}</a>
      <button
        style={{ marginLeft: 8 }}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            setSlugError && setSlugError('');
            setTimeout(() => setCopied(false), 1200);
          } catch {
            setSlugError && setSlugError('Failed to copy');
          }
        }}
        title="Copy short URL"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button style={{ marginLeft: 8 }} onClick={() => { setEditingSlugId(url.id); setNewSlug(url.slug); setSlugError && setSlugError(''); }}>Edit</button>
    </>
  );
}

export default function Dashboard({ initialUrls }) {
  const { data: session, status } = useSession();
  const [urls, setUrls] = useState(initialUrls || []);
  const [editingSlugId, setEditingSlugId] = useState(null);
  const [newSlug, setNewSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
    }
  }, [session, status, router]);

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', padding: 20, position: 'relative' }}>
      <nav style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {session?.user ? (
          <>
            <span>Hello, {session.user.email}</span>
            <button onClick={() => signOut()}>Sign out</button>
            <button onClick={() => window.location.href = '/'}>Create URL</button>
          </>
        ) : null}
      </nav>
      <h1>Dashboard</h1>
      <h2>Your URLs</h2>
      {urls.length === 0 ? (
        <p>No URLs created yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Short URL</th>
              <th>Original URL</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {urls.map(url => (
              <tr key={url.id}>
                <td>
                  {editingSlugId === url.id ? (
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setSlugError('');
                        const res = await fetch('/api/update-slug', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ urlId: url.id, newSlug }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setSlugError(data.error || 'Failed to update slug');
                        } else {
                          setUrls(urls.map(u => u.id === url.id ? { ...u, slug: newSlug } : u));
                          setEditingSlugId(null);
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <input
                        type="text"
                        value={newSlug}
                        onChange={e => setNewSlug(e.target.value)}
                        style={{ width: 100 }}
                        required
                      />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditingSlugId(null)}>Cancel</button>
                    </form>
                  ) : (
                    <ShortUrlCell url={url} setEditingSlugId={setEditingSlugId} setNewSlug={setNewSlug} setSlugError={setSlugError} />
                  )}
                  {editingSlugId === url.id && slugError && (
                    <div style={{ color: 'red', fontSize: 12 }}>{slugError}</div>
                  )}
                </td>
                <td style={{ wordBreak: 'break-all' }}>{url.original}</td>
                <td>{url.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

import { prisma } from '../lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    };
  }
  const token = await getToken({ req: context.req });
  const userId = token?.sub;
  let initialUrls = [];
  if (userId) {
    initialUrls = await prisma.url.findMany({
      where: { userId },
      orderBy: { visits: 'desc' },
    });
    // Serialize Date fields for Next.js
    initialUrls = initialUrls.map(url => ({
      ...url,
      createdAt: url.createdAt.toISOString(),
    }));
  }
  return {
    props: { initialUrls },
  };
}
