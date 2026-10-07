import React, { useState, useRef, useEffect } from 'react';

const N8N_WEBHOOK_URL = 'https://sarahhassan22.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'أهلاً بك في فندق ماجيستك! 🏨\nكيف يمكنني مساعدتك اليوم في استفسارات الغرف، الأسعار، أو إتمام حجز جديد؟'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input.trim();
    if (!queryText) return;

    const newMessages = [...messages, { sender: 'user' as const, text: queryText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: queryText, action: 'sendMessage' })
      });
      const data = await res.json();
      const reply = data.output || data.text || data.response || 'تم استقبال طلبك بنجاح!';
      setMessages((prev) => [...prev, { sender: 'bot' as const, text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot' as const, text: 'أهلاً بك في فندق ماجيستك، تسعدنا خدمتك دائماً!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#d97706',
          color: '#fff',
          border: 'none',
          boxShadow: '0 10px 25px rgba(217, 119, 6, 0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="المساعد الذكي 💬"
      >
        💬
      </button>

      {/* Chat Container */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '30px',
            width: '380px',
            maxWidth: 'calc(100vw - 40px)',
            height: '540px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#fff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #d97706'
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#fbbf24' }}>🏨 فندق ماجيستك - المساعد الذكي</h4>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>متصل الآن لخدمتك 24/7 (n8n AI)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-start' : 'flex-end',
                  backgroundColor: m.sender === 'user' ? '#0f172a' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  maxWidth: '85%',
                  fontSize: '14px',
                  boxShadow: m.sender === 'bot' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-end', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', color: '#64748b' }}>
                جاري حساب الإجابة والتوافر... ⏳
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', overflowX: 'auto', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={() => handleSend('ما هي الغرف المتاحة حالياً؟')} style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              الغرف المتاحة
            </button>
            <button onClick={() => handleSend('حساب حجز 2 كبار و 2 أطفال')} style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              حجز عائلي
            </button>
          </div>

          {/* Footer Input */}
          <div style={{ padding: '14px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب سؤالك هنا..."
              style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '24px', padding: '10px 14px', fontSize: '14px', outline: 'none' }}
            />
            <button
              onClick={() => handleSend()}
              style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '16px' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
