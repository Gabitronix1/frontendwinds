/ App.jsx - Frontend Tronix profesional con Supabase Auth + Dashboards personalizados

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const supabase = createClient(
  'https://kvenozirujsvjrsmpqhu.supabase.co',
  'PHyDwgHefWFTQkNKPRZ-Xdj7v6cg6j9oZ3VWTbseKLc'
);

const API_URL = 'https://n8n-production-993e.up.railway.app/webhook/01103618-3424-4455-bde6-aa8d295157b2';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchDashboards(user.id);
    };
    getUser();
  }, []);

  const fetchDashboards = async (user_id) => {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (!error) setDashboards(data);
  };

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    const newMessage = { sender: 'user', content: prompt };
    setChatHistory((prev) => [...prev, newMessage]);
    setPrompt('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      const data = await response.json();
      const respuesta = data.response || data.output || '⚠️ Respuesta vacía';

      const containsGraphURL = typeof respuesta === 'string' && respuesta.includes('grafico_id=');

      if (containsGraphURL && user) {
        const url = respuesta.match(/https?:\/\/[^\s)]+grafico_id=[^\s)]+/)[0];
        await supabase.from('dashboards').insert({
          user_id: user.id,
          prompt,
          url
        });
        toast({ title: '📊 Gráfico guardado en tu dashboard' });
        fetchDashboards(user.id);
      }

      setChatHistory((prev) => [...prev, { sender: 'agent', content: respuesta }] );
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'agent', content: '⚠️ Error al contactar con el agente' }]);
    }
  };

  const signInWithEmail = async () => {
    const email = prompt('Correo:');
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) toast({ title: '📬 Revisa tu correo para ingresar' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDashboards([]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-3xl font-bold">Tronix 🚀</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button onClick={signOut}>Salir</Button>
          </div>
        ) : (
          <Button onClick={signInWithEmail}>Iniciar sesión</Button>
        )}
      </div>

      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chat">💬 Chat</TabsTrigger>
          <TabsTrigger value="dash">📈 Mis Dashboards</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="space-y-4">
            {chatHistory.map((msg, i) => (
              <Card key={i} className="w-full">
                <CardContent className="p-4">
                  <strong>{msg.sender === 'user' ? '🧑 Tú' : '🤖 Tronix'}:</strong>
                  <div className="mt-2 whitespace-pre-wrap">{msg.content}</div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2">
              <Textarea
                className="flex-1"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe tu mensaje..."
              />
              <Button onClick={sendMessage}>Enviar</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dash">
          <div className="space-y-4">
            {dashboards.length === 0 && <p className="text-gray-500">No has guardado gráficos aún.</p>}
            {dashboards.map((g, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-2">📝 <strong>{g.prompt}</strong></p>
                  <iframe src={g.url} width="100%" height="500" className="rounded" frameBorder="0" allowFullScreen></iframe>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;

