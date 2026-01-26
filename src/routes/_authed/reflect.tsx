import type { UIMessage } from "@tanstack/ai-react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ChatInputBar } from "../../components/reflection/ChatInputBar";
import { ChatMessage } from "../../components/reflection/ChatMessage";
import { CompletionModal } from "../../components/reflection/CompletionModal";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  clearTodayChat,
  getTodayChat,
  saveChatMessage,
} from "../../server/functions/chat";
import { createEntry, getTodayEntry } from "../../server/functions/entries";
import { formatTime } from "../../utils/date";

const ReflectPage = () => {
  const router = useRouter();
  const { existingChat } = Route.useLoaderData();
  const [modalOpen, setModalOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnMount = useRef(false);
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingChat.map((message) => `db-${message.id}`))
  );
  const hasMounted = useRef(false);

  const initialMessages: UIMessage[] = existingChat.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }));

  const { messages: hookMessages, sendMessage, isLoading, setMessages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  // Use loader data as fallback if hook hasn't initialized yet
  const messages = hookMessages.length > 0 ? hookMessages : initialMessages;

  // Sync loader data to useChat on navigation (skip initial mount to avoid double render)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (existingChat.length > 0 && hookMessages.length === 0) {
      const newMessages: UIMessage[] = existingChat.map((message) => ({
        id: `db-${message.id}`,
        role: message.role as "user" | "assistant",
        parts: [{ type: "text" as const, content: message.content }],
        createdAt: new Date(message.createdAt),
      }));
      setMessages(newMessages);
      savedMessageIds.current = new Set(
        existingChat.map((message) => `db-${message.id}`)
      );
    }
  }, [existingChat, hookMessages.length, setMessages]);

  const scrollToBottom = (smooth = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;

    if (!hasScrolledOnMount.current) {
      requestAnimationFrame(() => scrollToBottom(false));
      hasScrolledOnMount.current = true;
    } else {
      scrollToBottom(true);
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;
    if (savedMessageIds.current.has(lastMessage.id)) return;

    const content = getMessageText(lastMessage.parts);
    if (!content) return;

    savedMessageIds.current.add(lastMessage.id);

    saveChatMessage({
      data: { role: "assistant", content },
    }).catch((error) => {
      console.error("Failed to save assistant message:", error);
      savedMessageIds.current.delete(lastMessage.id);
      toast.error("Kunde inte spara meddelandet");
    });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    sendMessage(message);

    try {
      await saveChatMessage({
        data: { role: "user", content: message },
      });
    } catch (error) {
      console.error("Failed to save user message:", error);
      toast.error("Kunde inte spara meddelandet");
    }
  };

  const handleOpenModal = () => {
    if (messages.length > 0) {
      setModalOpen(true);
    }
  };

  const handleSave = async (mood: number, summary: string) => {
    const result = await createEntry({
      data: {
        mood,
        summary,
      },
    });

    if (result && "error" in result) {
      toast.error(result.error);
      setModalOpen(false);
      return;
    }

    setModalOpen(false);
    router.navigate({ to: "/" });
  };

  const handleRestartChat = async () => {
    await clearTodayChat();
    setMessages([]);
    savedMessageIds.current.clear();
    setRestartDialogOpen(false);
  };

  const getMessageText = (parts: (typeof messages)[0]["parts"]) => {
    return parts
      .filter((part) => part.type === "text")
      .map((part) => part.content)
      .join("");
  };

  const chatMessages = messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: getMessageText(message.parts),
  }));

  return (
    <>
      <CompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        messages={chatMessages}
        onSave={handleSave}
      />
      <AlertDialog
        open={restartDialogOpen}
        onOpenChange={setRestartDialogOpen}
        title="Börja om chatten?"
        description="Din nuvarande konversation kommer att raderas. Du kan sedan starta en ny."
        cancelText="Avbryt"
        confirmText="Ja, börja om"
        variant="danger"
        onConfirm={handleRestartChat}
      />
      <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
        <PageHeader
          title="Dagens reflektion"
          subtitle="Ta en stund att reflektera"
          rightContent={
            messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRestartDialogOpen(true)}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Börja om
              </Button>
            )
          }
        />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6 space-y-5">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-16 sm:py-20">
                <div className="relative inline-block mb-8">
                  {/* Glow behind moon */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-violet-400/20 rounded-full blur-2xl scale-150" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center empty-state-icon shadow-xl">
                    <span className="text-4xl">🌙</span>
                  </div>
                </div>
                <h2 className="text-stone-100 text-2xl sm:text-3xl font-semibold mb-3">
                  Hur har din dag varit?
                </h2>
                <p className="text-slate-400 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
                  Berätta vad du har gjort, hur du mår, eller vad som ligger i tankarna
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                text={getMessageText(message.parts)}
                isStreaming={
                  isLoading &&
                  message.role === "assistant" &&
                  message === messages[messages.length - 1]
                }
                time={formatTime(message.createdAt)}
              />
            ))}
          </div>
        </div>

        <ChatInputBar
          input={input}
          onInputChange={setInput}
          onSend={handleSendMessage}
          onComplete={handleOpenModal}
          isLoading={isLoading}
          canComplete={messages.length >= 2}
        />
      </div>
    </>
  );
};

export const Route = createFileRoute("/_authed/reflect")({
  head: () => ({
    meta: [{ title: "Reflektera - Skymning" }],
  }),
  loader: async () => {
    const [todayEntry, existingChat] = await Promise.all([
      getTodayEntry(),
      getTodayChat(),
    ]);

    if (todayEntry) {
      throw redirect({ to: "/" });
    }

    return { existingChat };
  },
  component: ReflectPage,
});
