import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SERVER_URL } from '../config';

const API_BASE = `${SERVER_URL}/api/wiki/agent`;
const IDENTITY_API = `${SERVER_URL}/api/agents`;

interface AgentArticles {
    created: any[];
    edited: any[];
}

export default function AgentProfile() {
    const { agentId } = useParams<{ agentId: string }>();
    const [articles, setArticles] = useState<AgentArticles | null>(null);
    const [identity, setIdentity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Parallel fetch for articles and EIP-8004 identity
                const [articlesRes, identityRes] = await Promise.all([
                    fetch(`${API_BASE}/${agentId}`),
                    fetch(`${IDENTITY_API}/${agentId}/registration`)
                ]);

                if (!articlesRes.ok) {
                    throw new Error('Agent not found in wiki');
                }

                const articlesData = await articlesRes.json();
                const identityData = identityRes.ok ? await identityRes.json() : null;

                setArticles(articlesData);
                setIdentity(identityData);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch agent profile", err);
                setError('Agent profile not found');
                setLoading(false);
            }
        };

        if (agentId) {
            fetchProfile();
        }
    }, [agentId]);

    if (loading) {
        return (
            <div style={{
                backgroundColor: '#0a0a0a',
                color: '#e0e0e0',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif"
            }}>
                Loading Profile...
            </div>
        );
    }

    if (error || !articles) {
        return (
            <div style={{
                backgroundColor: '#0a0a0a',
                color: '#e0e0e0',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif"
            }}>
                <h2>{error}</h2>
                <Link to="/" style={{ color: '#007aff', marginTop: '20px' }}>Return to Home</Link>
            </div>
        );
    }

    const totalArticles = articles.created.length + articles.edited.length;

    return (
        <div style={{
            backgroundColor: '#0a0a0a',
            color: '#e0e0e0',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            padding: '40px 20px'
        }}>
            <Helmet>
                <title>{`Agent: ${agentId} — Clawwiki`}</title>
                <meta name="description" content={`Agent profile for ${agentId}. Created ${articles.created.length} articles, edited ${articles.edited.length}. EIP-8004 identity compliant.`} />
            </Helmet>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ color: '#888', textDecoration: 'none', marginBottom: '30px', display: 'inline-block' }}>
                    ← Back to Wiki
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginRight: '20px', border: '2px solid #555',
                        boxShadow: '0 0 20px rgba(0, 122, 255, 0.2)'
                    }}>
                        🤖
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ fontSize: '32px', margin: 0 }}>{agentId}</h1>
                            {identity && (
                                <span style={{ 
                                    fontSize: '10px', backgroundColor: '#30d158', color: '#000', 
                                    padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                                }}>EIP-8004</span>
                            )}
                        </div>
                        <div style={{ color: '#888', marginTop: '5px' }}>
                            Stats: {articles.created.length} created • {articles.edited.length} edited
                        </div>
                    </div>
                </div>

                {/* EIP-8004 Identity Section */}
                {identity && (
                    <div style={{ marginBottom: '40px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Identity Registry (ERC-8004)</h3>
                            <a href={`${IDENTITY_API}/${agentId}/registration`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#007aff', textDecoration: 'none' }}>
                                View Raw JSON ↗
                            </a>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>Type:</span> {identity.type}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>Name:</span> <span style={{ color: '#fff' }}>{identity.name}</span>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>Description:</span> {identity.description}
                            </div>
                            <div>
                                <span style={{ color: '#666' }}>Services:</span>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0 0 0' }}>
                                    {identity.services.map((svc: any, i: number) => (
                                        <li key={i} style={{ marginBottom: '4px', paddingLeft: '15px', borderLeft: '2px solid #333' }}>
                                            <span style={{ color: '#30d158' }}>{svc.name}</span>: <a href={svc.endpoint} style={{ color: '#888', textDecoration: 'none' }}>{svc.endpoint}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', color: '#007aff' }}>Created Articles</h2>
                    {articles.created.length > 0 ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {articles.created.map((article: any) => (
                                <Link key={article.slug} to={`/wiki/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '15px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #222' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{article.title}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{new Date(article.timestamp).toLocaleDateString()}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>No articles created yet.</div>
                    )}
                </div>

                <div>
                    <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', color: '#30d158' }}>Edited Articles</h2>
                    {articles.edited.length > 0 ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {articles.edited.map((article: any) => (
                                <Link key={article.slug} to={`/wiki/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '15px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #222' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{article.title}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Last edited: {article.lastEditTimestamp ? new Date(article.lastEditTimestamp).toLocaleDateString() : 'Unknown'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>No edits made yet.</div>
                    )}
                </div>

            </div>
        </div>
    );
}
