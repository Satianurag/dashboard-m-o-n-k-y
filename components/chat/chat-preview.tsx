import Image from "next/image";
import type { ChatConversation } from "@/types/chat";
import { formatDate } from "./utils";
import { cn } from "@/lib/utils";

interface ChatPreviewProps {
  conversation: ChatConversation;
  onOpenConversation: (conversationId: string) => void;
}

export default function ChatPreview({
  conversation,
  onOpenConversation,
}: ChatPreviewProps) {
  const currentUserId = "joyboy"; // Hardcoded default
  const user = conversation.participants.find(
    (p) => p.id !== currentUserId
  );

  if (!user) return null;

  return (
    <div
      className="group flex items-center gap-1 p-3 cursor-pointer"
      onClick={() => onOpenConversation(conversation.id)}
    >
      <div className="relative">
        <Image
          src={user.avatar}
          alt={user.name}
          width={96}
          height={96}
          className="rounded-lg size-14"
        />
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs size-5 rounded flex items-center justify-center font-semibold border-2 border-background">
            {conversation.unreadCount}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 group-hover:bg-accent px-2 py-1 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-lg">{user.name}</h3>
            <p className="text-xs text-foreground/50">{user.username}</p>
          </div>
          <span className="text-xs text-foreground/40">
            {conversation.lastMessage ? formatDate(conversation.lastMessage.timestamp) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p
            className={cn(
              "text-xs truncate pr-4",
              conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
