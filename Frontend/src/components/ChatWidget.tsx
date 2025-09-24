import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number;
};

interface ChatWidgetProps {
  apiKey?: string; // Gemini API key (optional, demo mode without it)
}

const demoQuestions = [
  'Predict yield for Kharif rice in Pune',
  'What if the monsoon is delayed?',
  'How can I reduce irrigation next week?',
  'Show risk level for wheat in Nashik',
];

async function fetchGeminiResponse(prompt: string, apiKey?: string): Promise<string> {
  // Placeholder implementation. If apiKey exists, you can wire to your backend proxy.
  // For now, return deterministic demo answers.
  const lower = prompt.toLowerCase();
  if (lower.includes('yield')) {
    return 'Estimated yield for Kharif rice in Pune is 3.8–4.2 t/ha with current weather outlook. Confidence ~78%. Key drivers: rainfall spread, soil moisture, and NDVI trend.';
  }
  if (lower.includes('monsoon') || lower.includes('delay')) {
    return 'A 2–3 week monsoon delay raises drought risk to Moderate (45–55%). Mitigation: switch to short-duration varieties, staggered sowing, and conserve soil moisture with mulching.';
  }
  if (lower.includes('irrigation') || lower.includes('water')) {
    return 'Next week irrigation plan: irrigate on Tue and Fri, 18–22 mm each, skip if rainfall >10 mm in prior 24h. This typically saves ~12% water while preserving yield.';
  }
  if (lower.includes('risk') || lower.includes('wheat') || lower.includes('nashik')) {
    return 'Wheat risk in Nashik: Low→Moderate (32–40%) due to mild heatwave probability. Watch for leaf rust; consider prophylactic spray if humidity stays >70% for 3+ days.';
  }
  if (lower.includes('trend') || lower.includes('forecast')) {
    return '7‑day forecast: scattered showers mid‑week, temperatures 1–2°C above normal. Expect slight uptick in evapotranspiration—adjust irrigation by +10%.';
  }
  return 'Thanks for the question! This is a demo response tailored for agriculture. Connect Gemini to get farm‑ and crop‑specific answers from your data.';
}

const ChatWidget = ({ apiKey }: ChatWidgetProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    try {
      const reply = await fetchGeminiResponse(text, apiKey);
      const botMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: reply, ts: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(input);
  };

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, open]);

  const fab = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setOpen(true)}
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ask AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {fab}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 w-full max-w-full sm:w-[420px] lg:w-[480px]">
          <div className="flex flex-col h-full">
            <div className="px-5 py-4 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 sticky top-0">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold">AI Assistant Hub</SheetTitle>
                <p className="text-xs text-muted-foreground">Quick Questions</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoQuestions.map((q) => (
                    <Button key={q} variant="secondary" className="justify-start h-9 text-xs truncate" onClick={() => handleAsk(q)} title={q}>
                      {q}
                    </Button>
                  ))}
                </div>
              </SheetHeader>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <Card className="p-4 text-sm text-muted-foreground">
                  Hello! I can help with crop forecasts, irrigation plans, risk alerts, and weather trends.
                </Card>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="text-xs text-muted-foreground">Assistant is typing…</div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t p-3 flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about yield, irrigation, weather, or risk…"
              />
              <Button type="submit" disabled={!input.trim() || isSending} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatWidget;


