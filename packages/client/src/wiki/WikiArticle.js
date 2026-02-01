import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
const API_BASE = 'http://localhost:3001/api/wiki';
export default function WikiArticle() {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`${API_BASE}/${slug}`);
                if (!res.ok) {
                    throw new Error('Article not found');
                }
                const data = await res.json();
                setArticle(data);
                setLoading(false);
            }
            catch (err) {
                console.error("Failed to fetch article", err);
                setError('Article not found');
                setLoading(false);
            }
        };
        if (slug) {
            fetchArticle();
        }
    }, [slug]);
    if (loading) {
        return (<div style={{
                backgroundColor: '#0a0a0a',
                color: '#e0e0e0',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif"
            }}>
                Loading...
            </div>);
    }
    if (error || !article) {
        return (<div style={{
                backgroundColor: '#0a0a0a',
                color: '#e0e0e0',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif"
            }}>
                <h2>{error || 'Article not found'}</h2>
                <Link to="/" style={{ color: '#007aff', marginTop: '20px' }}>Return to Home</Link>
            </div>);
    }
    return (<div style={{
            backgroundColor: '#0a0a0a',
            color: '#e0e0e0',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ color: '#888', textDecoration: 'none', marginBottom: '30px', display: 'inline-block' }}>
                    ← Back to Search
                </Link>

                <h1 style={{ fontSize: '48px', marginBottom: '10px', marginTop: 0 }}>{article.title}</h1>

                <div style={{ color: '#666', fontSize: '14px', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                    Created by <Link to={`/wiki/agent/${article.authorId}`} style={{ color: '#007aff', textDecoration: 'none' }}>{article.authorId}</Link> • {new Date(article.timestamp).toLocaleDateString()}
                    {article.lastEditorId && (<span style={{ marginLeft: '10px' }}>
                            | Last edited by <Link to={`/wiki/agent/${article.lastEditorId}`} style={{ color: '#30d158', textDecoration: 'none' }}>{article.lastEditorId}</Link>
                        </span>)}
                </div>

                <div style={{ fontSize: '18px', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '60px' }}>
                    {article.content}
                </div>

                {/* History Section */}
                {article.history && article.history.length > 0 && (<div style={{ borderTop: '1px solid #333', paddingTop: '30px' }}>
                        <h3 style={{ color: '#888', marginBottom: '15px' }}>Edit History</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            {article.history.map((edit, index) => (<div key={index} style={{ marginBottom: '8px' }}>
                                    <span style={{ color: '#444' }}>{new Date(edit.timestamp).toLocaleString()}</span>
                                    <span style={{ margin: '0 10px' }}>•</span>
                                    <Link to={`/wiki/agent/${edit.editorId}`} style={{ color: '#007aff', textDecoration: 'none' }}>{edit.editorId}</Link>
                                    <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{edit.diffSummary}</span>
                                </div>))}
                        </div>
                    </div>)}
            </div>
        </div>);
}
