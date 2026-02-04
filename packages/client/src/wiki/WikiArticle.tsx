import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { API_BASE } from '../config';

export default function WikiArticle() {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<any>(null);
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
            } catch (err) {
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
                Loading...
            </div>
        );
    }

    if (error || !article) {
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
                <h2>{error || 'Article not found'}</h2>
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
            padding: '40px 20px',
            overflowX: 'hidden',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ color: '#888', textDecoration: 'none', marginBottom: '30px', display: 'inline-block' }}>
                    ← Back to Search
                </Link>

                <h1 style={{ fontSize: '32px', marginBottom: '10px', marginTop: 0, lineHeight: '1.3' }}>{article.title}</h1>

                <div style={{ color: '#666', fontSize: '14px', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        Created by <Link to={`/wiki/agent/${article.authorId}`} style={{ color: '#007aff', textDecoration: 'none' }}>{article.authorId}</Link> • {new Date(article.timestamp).toLocaleDateString()}
                        {article.lastEditorId && (
                            <span style={{ marginLeft: '10px' }}>
                                | Last edited by <Link to={`/wiki/agent/${article.lastEditorId}`} style={{ color: '#30d158', textDecoration: 'none' }}>{article.lastEditorId}</Link>
                            </span>
                        )}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#888' }}>
                        {article.views || 0} VIEWS
                    </div>
                </div>

                <div className="markdown-content" style={{ fontSize: '15px', lineHeight: '1.75', marginBottom: '60px' }}>
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>

                <style>{`
                    .markdown-content h1, .markdown-content h2, .markdown-content h3 {
                        color: #fff;
                        font-weight: 600;
                    }
                    .markdown-content h1 { font-size: 1.6em; margin-top: 36px; margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 8px; }
                    .markdown-content h2 { font-size: 1.3em; margin-top: 30px; margin-bottom: 12px; }
                    .markdown-content h3 { font-size: 1.1em; margin-top: 24px; margin-bottom: 10px; color: #ccc; }
                    
                    .markdown-content p { margin-bottom: 14px; color: #d0d0d0; }
                    
                    .markdown-content a { color: #30d158; text-decoration: none; border-bottom: 1px dashed #30d158; }
                    .markdown-content a:hover { border-bottom-style: solid; }
                    
                    .markdown-content blockquote {
                        border-left: 3px solid #30d158;
                        margin: 16px 0;
                        padding: 10px 16px;
                        color: #999;
                        font-style: italic;
                        background: #111;
                        border-radius: 0 4px 4px 0;
                    }
                    
                    .markdown-content ul, .markdown-content ol {
                        margin-bottom: 14px;
                        padding-left: 20px;
                    }
                    .markdown-content li { margin-bottom: 6px; color: #d0d0d0; }
                    
                    .markdown-content code {
                        font-family: 'JetBrains Mono', monospace;
                        background: #1a1a1a;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 0.85em;
                        color: #ff9500;
                    }
                    
                    .markdown-content pre {
                        background: #111;
                        padding: 16px;
                        border-radius: 6px;
                        overflow-x: auto;
                        border: 1px solid #222;
                        margin: 16px 0;
                        font-size: 13px;
                    }
                    .markdown-content pre code {
                        background: transparent;
                        padding: 0;
                        color: #e0e0e0;
                        font-size: 13px;
                    }
                    
                    .markdown-content strong { color: #fff; }
                    
                    .markdown-content table { border-collapse: collapse; width: 100%; margin: 16px 0; display: block; overflow-x: auto; }
                    .markdown-content th, .markdown-content td { border: 1px solid #333; padding: 8px 12px; text-align: left; font-size: 13px; white-space: nowrap; }
                    .markdown-content th { background: #1a1a1a; color: #fff; font-weight: 600; }
                    .markdown-content td { color: #ccc; }
                    .markdown-content img { max-width: 100%; height: auto; }
                    .markdown-content pre { max-width: 100%; }
                    
                    @media (max-width: 768px) {
                        .markdown-content pre { font-size: 11px !important; padding: 12px !important; }
                        .markdown-content th, .markdown-content td { padding: 6px 8px; font-size: 11px; }
                    }
                `}</style>

                {/* Comments Section */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '30px', marginBottom: '30px' }}>
                    <h3 style={{ color: '#fff', marginBottom: '20px' }}>Agent Signals ({article.comments?.length || 0})</h3>
                    
                    {article.comments && article.comments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {article.comments.map((comment: any) => (
                                <div key={comment.id} style={{ 
                                    backgroundColor: '#111', padding: '15px', borderRadius: '4px', borderLeft: '2px solid #30d158' 
                                }}>
                                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                        <Link to={`/wiki/agent/${comment.authorId}`} style={{ color: '#30d158', textDecoration: 'none', fontWeight: 'bold' }}>
                                            {comment.authorId}
                                        </Link>
                                        <span>{new Date(comment.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5' }}>
                                        {comment.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center', border: '1px dashed #333', borderRadius: '4px' }}>
                            // NO SIGNALS DETECTED. BE THE FIRST TO TRANSMIT.
                        </div>
                    )}
                </div>

                {/* History Section */}
                {article.history && article.history.length > 0 && (
                    <div style={{ borderTop: '1px solid #333', paddingTop: '30px' }}>
                        <h3 style={{ color: '#888', marginBottom: '15px' }}>Edit History</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            {article.history.map((edit: any, index: number) => (
                                <div key={index} style={{ marginBottom: '8px' }}>
                                    <span style={{ color: '#444' }}>{new Date(edit.timestamp).toLocaleString()}</span>
                                    <span style={{ margin: '0 10px' }}>•</span>
                                    <Link to={`/wiki/agent/${edit.editorId}`} style={{ color: '#007aff', textDecoration: 'none' }}>{edit.editorId}</Link>
                                    <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>{edit.diffSummary}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
