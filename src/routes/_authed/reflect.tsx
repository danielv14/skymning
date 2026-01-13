import type { UIMessage } from "@tanstack/ai-react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
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
  const { todayEntry, existingChat } = Route.useLoaderData();
  const [modalOpen, setModalOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnMount = useRef(false);
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingChat.map((message) => `db-${message.id}`))
  );

  const initialMessages: UIMessage[] = existingChat.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }));

  const { messages, sendMessage, isLoading, setMessages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  // Redirect if today's entry already exists
  useEffect(() => {
    if (todayEntry) {
      router.navigate({ to: "/" });
    }
  }, [todayEntry, router]);

  // Scroll to bottom on initial load (instant) and when new messages arrive (smooth)
  useEffect(() => {
    if (messages.length === 0) return;

    if (!hasScrolledOnMount.current) {
      // First scroll on mount - use instant to avoid jarring animation
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      });
      hasScrolledOnMount.current = true;
    } else {
      // Subsequent scrolls - use smooth for new messages
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const saveNewMessages = async () => {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // Skip if already saved or if AI is still streaming this message
        if (savedMessageIds.current.has(message.id)) continue;
        if (
          message.role === "assistant" &&
          isLoading &&
          i === messages.length - 1
        )
          continue;

        const content = getMessageText(message.parts);
        if (!content) continue;

        // Mark as saved BEFORE the async operation to prevent race conditions
        savedMessageIds.current.add(message.id);

        try {
          await saveChatMessage({
            data: {
              role: message.role as "user" | "assistant",
              content,
              orderIndex: i,
            },
          });
        } catch (error) {
          console.error("Failed to save chat message:", error);
          savedMessageIds.current.delete(message.id);
          toast.error("Kunde inte spara meddelandet");
        }
      }
    };

    saveNewMessages();
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleOpenModal = () => {
    if (messages.length > 0) {
      setModalOpen(true);
    }
  };

  const handleSave = async (mood: number, summary: string) => {
    await createEntry({
      data: {
        mood,
        summary,
      },
    });
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
      <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
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

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6 space-y-5">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🌙</div>
                <p className="text-stone-200 text-lg mb-2">
                  Hej! Hur har din dag varit?
                </p>
                <p className="text-stone-500">
                  Berätta vad du har gjort eller hur du mår
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

            <div ref={messagesEndRef} />
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
    return { todayEntry, existingChat };
  },
  component: ReflectPage,
});
