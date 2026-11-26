import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  Send, Bot, Sparkles, Key, CheckCircle2, ShieldCheck, AlertCircle, Loader2,
} from 'lucide-react';
import { aiApi } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: number;
  followUpQuestions?: string[];
}

interface AIChatProps {
  startupId?: string;
  context?: any;
  initialPrompt?: string;
}

const QUICK_PROMPTS = [
  { label: "📊 Compare all active startups", text: "Compare the active startups listed on FundNest in terms of sector, stage, and target raise." },
  { label: "⚖️ Lowest risk ventures", text: "Which startups currently have the most favorable risk profile and verified traction?" },
  { label: "🛡️ Escrow safety model", text: "How does the milestone-based escrow release model protect investor funds on FundNest?" },
  { label: "🚀 AI & HealthTech breakdown", text: "Summarize the key value proposition of the AI and HealthTech ventures on the platform." }
];

export function AIChat({ startupId, context, initialPrompt }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // OpenAI Configuration Status
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await aiApi.getStatus();
      setAiStatus(res.data?.status);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customKey.trim();
    if (!trimmed || (!trimmed.startsWith('sk-') && !trimmed.startsWith('AIza') && !trimmed.startsWith('gsk_'))) {
      return toast.error('Please enter a valid OpenAI (sk-), Gemini (AIza), or Groq (gsk_) API key');
    }

    setSavingKey(true);
    try {
      const res = await aiApi.configureKey(customKey.trim());
      toast.success(res.data.message || 'OpenAI API key configured and live!');
      setAiStatus(res.data.status);
      setKeyModalOpen(false);
      setCustomKey('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to authenticate with OpenAI API');
    } finally {
      setSavingKey(false);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const queryText = (customQuery || input).trim();
    if (!queryText) return;

    const userMessage: Message = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    if (!customQuery) setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.chat({
        query: queryText,
        conversationHistory: messages.slice(-8),
      });

      const data = res.data;
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response?.answer || data.answer || "No response received from intelligence engine.",
        sources: data.response?.sources || [],
        confidence: data.response?.confidence || 0.94,
        followUpQuestions: data.response?.follow_up_questions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      const errMsg = error.response?.data?.message || 'Sorry, I encountered an issue analyzing your query. Please check connection and try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col border-0 rounded-none bg-transparent">
      {/* Header */}
      <CardHeader className="border-b border-border/40 pb-3 pt-4 px-4 bg-background/80 backdrop-blur">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg btn-gradient grid place-items-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold block leading-tight">FundNest AI Copilot</span>
              <span className="text-[11px] text-muted-foreground">GenAI Investor & Startup Intelligence</span>
            </div>
          </div>

          {/* Engine Status Indicator */}
          {aiStatus?.configured && aiStatus?.mode === 'live' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time ({aiStatus.chatModel})</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyModalOpen(true)}
              className="h-7 text-xs px-2.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 flex items-center gap-1"
            >
              <Key className="h-3 w-3" /> {aiStatus?.mode === 'quota_exhausted' ? 'Quota Exhausted · Update Key' : 'Connect Key'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6 px-2 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center mx-auto text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">How can I assist your investment research?</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Ask me to compare startups, explain risk scores, verify milestone deliverables, or evaluate sectors.
                  </p>
                </div>

                {!aiStatus?.configured && (
                  <div className="glass rounded-xl p-3 max-w-xs mx-auto border-amber-500/30 bg-amber-500/5 text-left">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Offline Demo Mode
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Connect your OpenAI API key for live real-time completions and dynamic embeddings.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7 text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                      onClick={() => setKeyModalOpen(true)}
                    >
                      Connect OpenAI Key
                    </Button>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Suggested Questions</p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(p.text)}
                        className="text-left text-xs p-2.5 rounded-xl glass hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="btn-gradient text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                    message.role === 'user'
                      ? 'btn-gradient text-white shadow-md'
                      : 'glass border-border/50 text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/30">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Grounded Data Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-background/60 px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Follow-up inquiries:</p>
                      <div className="flex flex-col gap-1">
                        {message.followUpQuestions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(q)}
                            className="text-left text-xs py-1 px-2 rounded-lg bg-background/40 hover:bg-background/80 text-primary transition truncate"
                          >
                            • {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="btn-gradient text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="glass rounded-2xl px-4 py-3 border-border/50 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-300" />
                  </div>
                  <span className="text-xs text-muted-foreground">Synthesizing real-time intelligence...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="p-3 border-t border-border/40 bg-background/80 backdrop-blur">
          <div className="flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask FundNest AI Copilot..."
              disabled={isLoading}
              className="glass text-xs sm:text-sm h-10 flex-1 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="btn-gradient h-10 w-10 p-0 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Connect Key Modal */}
      <Dialog open={keyModalOpen} onOpenChange={setKeyModalOpen}>
        <DialogContent className="glass text-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Connect OpenAI API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enable real-time GenAI analysis across SWOT, hybrid risk scoring, and assistant chats.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveKey} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-xs">OpenAI Secret Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-proj-..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="glass font-mono text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Your key will be verified immediately with OpenAI, persisted in <code>.env</code>, and kept strictly private.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setKeyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingKey} className="btn-gradient">
                {savingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                {savingKey ? 'Verifying with OpenAI...' : 'Verify & Enable Real-Time AI'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
