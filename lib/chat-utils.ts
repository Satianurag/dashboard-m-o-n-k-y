import type { ChatConversation, ChatMessage, ChatUser } from "@/types/chat";


export const getCurrentUser = (): ChatUser => ({
    id: "joyboy",
    name: "JOYBOY",
    username: "@JOYBOY",
    avatar: "/avatars/user_joyboy.png",
    isOnline: true,
});

export const mapProfileToChatUser = (profile: any): ChatUser => ({
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    isOnline: profile.is_online
});


import { supabase } from '@/lib/supabase';

const MOCK_CONVERSATIONS: ChatConversation[] = [
    {
        id: 'global-room',
        participants: [
            { id: 'system', name: 'Xandeum Network', username: '@network', avatar: '/avatars/xandeum.png', isOnline: true }
        ],
        messages: [],
        unreadCount: 0,
        lastMessage: undefined
    },
    {
        id: 'support-room',
        participants: [
            { id: 'support', name: 'Xandeum Support', username: '@support', avatar: '/avatars/support.png', isOnline: true }
        ],
        messages: [],
        unreadCount: 0,
        lastMessage: undefined
    }
];

export const mapMessageToChatMessage = (msg: any, currentUserId: string): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    timestamp: msg.created_at,
    senderId: msg.sender_id,
    isFromCurrentUser: msg.sender_id === currentUserId,
});

export const fetchConversations = async (): Promise<ChatConversation[]> => {
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return MOCK_CONVERSATIONS;
        }

        const currentUser = getCurrentUser();

        // Hydrate mock conversations with real messages
        const conversations = MOCK_CONVERSATIONS.map(conv => {
            const convMessages = messages
                .filter((m: any) => m.conversation_id === conv.id)
                .map((m: any) => mapMessageToChatMessage(m, currentUser.id));

            return {
                ...conv,
                messages: convMessages,
                lastMessage: convMessages[convMessages.length - 1],
                unreadCount: 0 // Reset for now
            };
        });

        return conversations;
    } catch (err) {
        console.error('Failed to fetch conversations:', err);
        return MOCK_CONVERSATIONS;
    }
};

export const sendMessage = async (content: string, conversationId: string, senderId: string) => {
    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                content,
                conversation_id: conversationId,
                sender_id: senderId,
                created_at: new Date().toISOString() // Client TS, server will override or ignore if default
            });

        if (error) throw error;
    } catch (err) {
        console.error('Error sending message:', err);
        throw err;
    }
};

