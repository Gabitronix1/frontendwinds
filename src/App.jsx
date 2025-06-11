
import React, { useState } from 'react';

function App() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');

  const saveGraph = (url) => {
    const newGraphs = [...savedGraphs, url];
    setSavedGraphs(newGraphs);
    localStorage.setItem('savedGraphs', JSON.stringify(newGraphs));
  };

  const sendQuestion = async () => {
    if (!question.trim()) return;
    const userMessage = { sender: 'user', text: question };
    setChatHistory([...chatHistory, userMessage]);
    setQuestion('');

    try {
      const response = await fetch('https://n8n-production-993e.up.railway.app/webhook/01103618-3424-4455-bde6-aa8d295157b2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      const agentMessage = { sender: 'agent', text: data.output };
      setChatHistory((prev) => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage = { sender: 'agent', text: 'Error al conectar con el agente.' };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };

  const extractGraphUrl = (text) => {
    const regex = /(https?:\/\/[^\s]+\?grafico_id=[^\s]+)/g;
    const matches = text.match(regex);
    return matches ? matches[0] : null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agente Tronix</h1>
      </header>

      <nav className="mb-4">
        <button
          className={`mr-4 px-3 py-1 rounded ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === 'graphs' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('graphs')}
        >
          📊 Mis Gráficos
        </button>
      </nav>

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[70vh] border rounded p-4 overflow-auto">
          <div className="flex-grow overflow-auto mb-4">
            {chatHistory.map((msg, idx) => {
              const graphUrl = msg.sender === 'agent' ? extractGraphUrl(msg.text) : null;
              return (
                <div key={idx} className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-2 rounded ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-900'}`}>
                    {msg.text.split(/(https?:\/\/[^\s]+\?grafico_id=[^\s]+)/g).map((part, i) => {
                      if (part === graphUrl) {
                        return (
                          <div key={i} className="mt-2">
                            <iframe
                              src={graphUrl}
                              className="w-full h-64 border"
                              title="Gráfico embebido"
                            ></iframe>
                            <button
                              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              onClick={() => saveGraph(graphUrl)}
                            >
                              Guardar gráfico
                            </button>
                          </div>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex">
            <input
              type="text"
              className="flex-grow border rounded px-3 py-2 mr-2"
              placeholder="Escribe tu pregunta..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendQuestion();
              }}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={sendQuestion}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {activeTab === 'graphs' && (
        <div className="border rounded p-4 h-[70vh] overflow-auto">
          {savedGraphs.length === 0 && <p>No tienes gráficos guardados.</p>}
          {savedGraphs.map((url, idx) => (
            <div key={idx} className="mb-4">
              <iframe
                src={url}
                className="w-full h-64 border"
                title={`Gráfico guardado ${idx + 1}`}
              ></iframe>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
