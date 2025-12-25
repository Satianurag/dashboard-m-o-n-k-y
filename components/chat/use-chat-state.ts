import { create } from "zustand";
import type { ChatState, ChatMessage, ChatConversation } from "@/types/chat";
import { getCurrentUser } from "@/lib/chat-utils";


type ChatComponentState = {
  state: ChatState;
  activeConversation?: string;
};

interface ChatStore {
  // State
  chatState: ChatComponentState;
  conversations: ChatConversation[];
  newMessage: string;
  isInitialized: boolean;

  // Actions
  setChatState: (state: ChatComponentState) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  openConversation: (conversationId: string) => void;
  goBack: () => void;
  toggleExpanded: () => void;
  initializeChat: () => void;
}

const chatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatState: {
    state: "collapsed",
  },
  conversations: [], // Empty init
  newMessage: "",
  isInitialized: false,

  // Actions
  setChatState: (chatState) => set({ chatState }),

  setConversations: (conversations) => set({ conversations }),

  setNewMessage: (newMessage) => set({ newMessage }),


  initializeChat: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isInitialized: true });

    // Initial Fetch
    const conversations = await import("@/lib/chat-utils").then(m => m.fetchConversations());
    set({ conversations });

    // Realtime Subscription
    const { supabase } = await import("@/lib/supabase");
    const { mapMessageToChatMessage, getCurrentUser } = await import("@/lib/chat-utils");

    supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const currentUser = getCurrentUser();
        const chatMsg = mapMessageToChatMessage(newMsg, currentUser.id);

        const { conversations } = get();

        const updated = conversations.map(c => {
          if (c.id === newMsg.conversation_id) {
            // Check if already exists (optimistic)
            if (c.messages.some(m => m.id === chatMsg.id || (m.isFromCurrentUser && m.content === chatMsg.content && new Date(m.timestamp).getTime() - new Date(chatMsg.timestamp).getTime() < 1000))) {
              return c;
            }
            return {
              ...c,
              messages: [...c.messages, chatMsg],
              lastMessage: chatMsg,
              unreadCount: c.id !== get().chatState.activeConversation ? c.unreadCount + 1 : 0
            };
          }
          return c;
        });

        set({ conversations: updated });
      })
      .subscribe();
  },

  handleSendMessage: async () => {
    const { newMessage, conversations, chatState } = get();
    const activeConvId = chatState.activeConversation;
    const activeConv = conversations.find(c => c.id === activeConvId);

    if (!newMessage.trim() || !activeConv) return;

    // Optimistic update
    const currentUser = getCurrentUser();
    // const tempId = `msg-${Date.now()}`; // Don't use temp ID for now to avoid dupes with simple logic
    // Actually, stick to optimistic UI

    const content = newMessage.trim();
    set({ newMessage: "" }); // Clear input immediately

    const { sendMessage } = await import("@/lib/chat-utils");
    await sendMessage(content, activeConv.id, currentUser.id);
  },

  openConversation: (conversationId) => {
    const { conversations } = get();

    // Update chat state
    set({
      chatState: { state: "conversation", activeConversation: conversationId },
    });

    // Mark conversation as read
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    );

    set({ conversations: updatedConversations });
  },

  goBack: () => {
    const { chatState } = get();
    if (chatState.state === "conversation") {
      set({ chatState: { state: "expanded" } });
    } else {
      set({ chatState: { state: "collapsed" } });
    }
  },

  toggleExpanded: () => {
    const { chatState } = get();
    set({
      chatState: {
        state: chatState.state === "collapsed" ? "expanded" : "collapsed",
      },
    });
  },
}));

// Hook with computed values using selectors
export const useChatState = () => {
  const chatState = chatStore((state) => state.chatState);
  const conversations = chatStore((state) => state.conversations);
  const newMessage = chatStore((state) => state.newMessage);
  const setChatState = chatStore((state) => state.setChatState);
  const setConversations = chatStore((state) => state.setConversations);
  const setNewMessage = chatStore((state) => state.setNewMessage);
  const handleSendMessage = chatStore((state) => state.handleSendMessage);
  const openConversation = chatStore((state) => state.openConversation);
  const goBack = chatStore((state) => state.goBack);
  const toggleExpanded = chatStore((state) => state.toggleExpanded);
  const initializeChat = chatStore((state) => state.initializeChat);

  // Computed values
  const totalUnreadCount = conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0
  );

  const activeConversation = conversations.find(
    (conv) => conv.id === chatState.activeConversation
  );

  return {
    chatState,
    conversations,
    newMessage,
    totalUnreadCount,
    activeConversation,
    setChatState,
    setConversations,
    setNewMessage,
    handleSendMessage,
    openConversation,
    goBack,
    toggleExpanded,
    initializeChat,
  };
};
