import type { UIMessage } from "@tanstack/ai-react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ChatInputBar } from "../../components/reflection/ChatInputBar";
import { ChatMessage } from "../../components/reflection/ChatMessage";
import { CompletionModal } from "../../components/reflection/CompletionModal";
import { PastChatRecoveryModal } from "../../components/reflection/PastChatRecoveryModal";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  clearTodayChat,
  getTodayChat,
  saveChatMessage,
  getIncompletePastChat,
  clearPastChats,
  getChatForDate,
} from "../../server/functions/chat";
import { createEntry, getTodayEntry, getEntryForDate } from "../../server/functions/entries";
import { formatTime, getTodayDateString } from "../../utils/date";
import type { ChatMessage as DbChatMessage } from "../../server/db/schema";

const getMessageText = (parts: UIMessage["parts"]) =>
  parts
    .filter((part) => part.type === "text")
    .map((part) => part.content)
    .join("");

const dbMessagesToUIMessages = (messages: DbChatMessage[]): UIMessage[] =>
  messages.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }));

const GREETING_TRIGGER = '[GREETING]';

const ReflectPage = () => {
  const router = useRouter();
  const { existingChat, incompletePastChat } = Route.useLoaderData();
  const [modalOpen, setModalOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(incompletePastChat !== null);
  const [reflectionDate, setReflectionDate] = useState<string>(getTodayDateString());
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnMount = useRef(false);
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingChat.map((message) => `db-${message.id}`))
  );
  const hasMounted = useRef(false);
  const greetingSent = useRef(false);

  const initialMessages = dbMessagesToUIMessages(existingChat);

  const { messages: hookMessages, sendMessage, isLoading, setMessages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  const messages = hookMessages.length > 0 ? hookMessages : initialMessages;

  // Sync loader data to useChat on navigation (skip initial mount to avoid double render)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (existingChat.length > 0 && hookMessages.length === 0) {
      setMessages(dbMessagesToUIMessages(existingChat));
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

  // Auto-trigger personalized greeting when starting a fresh conversation
  useEffect(() => {
    if (greetingSent.current) return;
    if (existingChat.length > 0) return;
    if (incompletePastChat) return;

    greetingSent.current = true;
    sendMessage(GREETING_TRIGGER);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;
    if (savedMessageIds.current.has(lastMessage.id)) return;

    const content = getMessageText(lastMessage.parts);
    if (!content) return;

    savedMessageIds.current.add(lastMessage.id);

    saveChatMessage({
      data: { role: "assistant", content, date: reflectionDate },
    }).catch((error) => {
      console.error("Failed to save assistant message:", error);
      savedMessageIds.current.delete(lastMessage.id);
      toast.error("Kunde inte spara meddelandet");
    });
  }, [messages, isLoading, reflectionDate]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    sendMessage(message);

    try {
      await saveChatMessage({
        data: { role: "user", content: message, date: reflectionDate },
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
        date: reflectionDate,
      },
    });

    if (result && "error" in result) {
      toast.error(result.error);
      setModalOpen(false);
      return;
    }

    setModalOpen(false);
    router.navigate({ to: "/", viewTransition: true });
  };

  const handleRestartChat = async () => {
    if (reflectionDate === getTodayDateString()) {
      await clearTodayChat();
    } else {
      await clearPastChats();
      setReflectionDate(getTodayDateString());
    }
    setMessages([]);
    savedMessageIds.current.clear();
    setRestartDialogOpen(false);

    // Re-trigger greeting after clearing chat
    greetingSent.current = false;
    sendMessage(GREETING_TRIGGER);
    greetingSent.current = true;
  };

  const handleRecoveryContinue = async () => {
    if (!incompletePastChat) return;

    setReflectionDate(incompletePastChat.date);

    const pastChatMessages = await getChatForDate({ data: { date: incompletePastChat.date } });

    setMessages(dbMessagesToUIMessages(pastChatMessages));
    savedMessageIds.current = new Set(pastChatMessages.map((m) => `db-${m.id}`));
    setRecoveryModalOpen(false);
  };

  const handleRecoveryWriteManually = () => {
    if (incompletePastChat) {
      router.navigate({ to: '/quick', search: { date: incompletePastChat.date }, viewTransition: true });
    }
  };

  const handleRecoveryDiscard = async () => {
    await clearPastChats();
    setRecoveryModalOpen(false);
  };

  const isGreetingTrigger = (message: UIMessage) =>
    message.role === 'user' && getMessageText(message.parts) === GREETING_TRIGGER;

  const visibleMessages = messages.filter((m) => !isGreetingTrigger(m));

  const chatMessages = visibleMessages.map((message) => ({
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
      {incompletePastChat && (
        <PastChatRecoveryModal
          open={recoveryModalOpen}
          onOpenChange={setRecoveryModalOpen}
          pastChat={incompletePastChat}
          onContinue={handleRecoveryContinue}
          onWriteManually={handleRecoveryWriteManually}
          onDiscard={handleRecoveryDiscard}
        />
      )}
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
      <div className="h-dvh flex flex-col bg-slate-950">
        <PageHeader
          title="Dagens reflektion"
          subtitle="Ta en stund att reflektera"
          rightContent={
            visibleMessages.length > 0 && (
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

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-4">
            {visibleMessages.length === 0 && !isLoading && (
              <div className="text-center py-16 sm:py-20">
                <div className="relative inline-block mb-8">
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

            {visibleMessages.length === 0 && isLoading && (
              <ChatMessage role="assistant" text="" isStreaming />
            )}

            {visibleMessages.map((message) => (
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
          canComplete={visibleMessages.length >= 2}
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
    const [todayEntry, existingChat, incompletePastChat] = await Promise.all([
      getTodayEntry(),
      getTodayChat(),
      getIncompletePastChat(),
    ]);

    if (todayEntry) {
      if (incompletePastChat) {
        await clearPastChats();
      }
      throw redirect({ to: "/" });
    }

    let validPastChat = incompletePastChat;
    if (incompletePastChat) {
      const pastDateEntry = await getEntryForDate({ data: { date: incompletePastChat.date } });
      if (pastDateEntry) {
        await clearPastChats();
        validPastChat = null;
      }
    }

    const showRecovery = existingChat.length === 0 && validPastChat !== null;

    return {
      existingChat,
      incompletePastChat: showRecovery ? validPastChat : null,
    };
  },
  component: ReflectPage,
});
