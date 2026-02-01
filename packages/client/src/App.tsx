import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Game from './game/Game';
import WikiLanding from './wiki/WikiLanding';
import WikiArticle from './wiki/WikiArticle';
import AgentProfile from './wiki/AgentProfile';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WikiLanding />} />
                <Route path="/wiki/:slug" element={<WikiArticle />} />
                <Route path="/wiki/agent/:agentId" element={<AgentProfile />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
