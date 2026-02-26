import { Message } from "ai";
import { Bot, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";

interface ChatMessagesProps {
  messages: Message[];
  error: Error | undefined;
  isLoading: boolean;
}

export default function ChatMessages({
  messages,
  error,
  isLoading,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="shrink-0" />
          <Loader2 className="animate-spin" />
        </div>
      )}
      {error && (
        <p className="text-center text-sm text-destructive">{error.message}</p>
      )}
      {!error && messages.length === 0 && !isLoading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Bot className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ask me anything about Robert!
          </p>
        </div>
      )}
    </div>
  );
}
