import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

const socket = io('http://localhost:3001');

export default function Game() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [agents, setAgents] = useState<any>({});
    const [name, setName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }
        function onDisconnect() {
            setIsConnected(false);
        }
        function onStateUpdate(state: any) {
            setAgents(state.agents);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('stateUpdate', onStateUpdate);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('stateUpdate', onStateUpdate);
        };
    }, []);

    const handleJoin = () => {
        if (name) {
            socket.emit('join', { name, color: '#' + Math.floor(Math.random() * 16777215).toString(16) });
            setHasJoined(true);
        }
    };

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hasJoined) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        socket.emit('moveTo', { x, y });
    }

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Generative Agents Town</h1>
                <Link to="/wiki" style={{ color: 'blue', textDecoration: 'underline' }}>📖 Visit Town Library (Wiki)</Link>
            </div>

            <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>

            {!hasJoined ? (
                <div style={{ marginTop: 20 }}>
                    <input
                        placeholder="Agent Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ padding: 5, marginRight: 10 }}
                    />
                    <button onClick={handleJoin}>Join Town</button>
                </div>
            ) : (
                <div style={{ marginTop: 10 }}>
                    <p>Click on the grid to move.</p>
                </div>
            )}

            <div
                style={{
                    width: 800,
                    height: 600,
                    border: '2px solid #333',
                    position: 'relative',
                    marginTop: 20,
                    backgroundImage: 'url(/assets/the_ville_viz.png)',
                    backgroundSize: 'cover'
                }}
                onClick={handleMove}
            >
                {Object.values(agents).map((agent: any) => (
                    <div
                        key={agent.id}
                        style={{
                            position: 'absolute',
                            left: agent.position.x - 10, // center
                            top: agent.position.y - 10,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: agent.color,
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 'bold'
                        }}
                        title={agent.name}
                    >
                        {agent.name.substring(0, 1)}
                    </div>
                ))}

                {/* Render Names */}
                {Object.values(agents).map((agent: any) => (
                    <div
                        key={agent.id + '_label'}
                        style={{
                            position: 'absolute',
                            left: agent.position.x,
                            top: agent.position.y - 25,
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            padding: '2px 4px',
                            borderRadius: 4,
                            fontSize: 10,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {agent.name}
                        {agent.status !== 'Idle' && ` (${agent.status})`}
                    </div>
                ))}
            </div>
        </div>
    );
}
