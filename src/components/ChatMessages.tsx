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
  return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold">Chat Temporarily Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            I am currently switching API providers. Please check back soon!
          </p>
        </div>
      </div>
    );
}
