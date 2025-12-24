import { create } from "zustand";
import type { ChatState, ChatMessage, ChatConversation } from "@/types/chat";
import { mockChatData } from "@/data/chat-mock";
import { fetchConversations, getCurrentUser, sendMessageToSupabase, mapSupabaseMessageToChatMessage } from "@/lib/chat-utils";
import { supabase } from "@/lib/supabase";

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
  conversations: mockChatData.conversations,
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

    // 1. Fetch initial data
    const convs = await fetchConversations();
    set({ conversations: convs });

    // 2. Subscribe to realtime messages
    supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const currentUser = getCurrentUser();

        const chatMsg = mapSupabaseMessageToChatMessage(newMsg, currentUser.id);

        // Update store
        set((state) => {
          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === newMsg.conversation_id) {
              // Avoid duplicates if we optimistically added it
              if (conv.messages.some(m => m.id === chatMsg.id)) return conv;

              return {
                ...conv,
                messages: [...conv.messages, chatMsg],
                lastMessage: chatMsg,
                // Increment unread if chat is closed or different conversation active
                unreadCount: (state.chatState.state !== 'conversation' || state.chatState.activeConversation !== conv.id)
                  ? conv.unreadCount + 1
                  : 0
              };
            }
            return conv;
          });
          return { conversations: updatedConversations };
        });
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
    const tempId = `msg-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderId: currentUser.id,
      isFromCurrentUser: true,
    };

    const updatedConversations = conversations.map((conv) =>
      conv.id === activeConv.id
        ? {
          ...conv,
          messages: [...conv.messages, optimisticMsg],
          lastMessage: optimisticMsg,
        }
        : conv
    );

    set({
      conversations: updatedConversations,
      newMessage: "",
    });

    // Send to Supabase
    await sendMessageToSupabase(newMessage.trim(), activeConv.id, currentUser.id);
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
