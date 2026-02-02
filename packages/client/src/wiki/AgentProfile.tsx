import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SERVER_URL } from '../config';

const API_BASE = `${SERVER_URL}/api/wiki/agent`;

interface AgentArticles {
    created: any[];
    edited: any[];
}

export default function AgentProfile() {
    const { agentId } = useParams<{ agentId: string }>();
    const [articles, setArticles] = useState<AgentArticles | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/${agentId}`);
                if (!res.ok) {
                    throw new Error('Agent not found');
                }
                const data = await res.json();
                setArticles(data);
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

    return (
        <div style={{
            backgroundColor: '#0a0a0a',
            color: '#e0e0e0',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ color: '#888', textDecoration: 'none', marginBottom: '30px', display: 'inline-block' }}>
                    ← Back to Wiki
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginRight: '20px', border: '2px solid #555'
                    }}>
                        🤖
                    </div>
                    <div>
                        <h1 style={{ fontSize: '32px', margin: 0 }}>Agent: {agentId}</h1>
                        <div style={{ color: '#888', marginTop: '5px' }}>
                            Stats: {articles.created.length} created • {articles.edited.length} edited
                        </div>
                    </div>
                </div>

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
