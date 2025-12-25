import type { ChatConversation, ChatMessage, ChatUser } from "@/types/chat";


export const getCurrentUser = (): ChatUser => ({
    id: "joyboy", // Fixed user for this demo
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

// We keep "Mock Conversations" structure for the UI, but populate messages from Real DB.
// In a full app, conversations would also be in DB.
const BASE_CONVERSATIONS: ChatConversation[] = [
    {
        id: 'global-room',
        participants: [
            { id: 'system', name: 'Xandeum Network', username: '@network', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=XN', isOnline: true }
        ],
        messages: [],
        unreadCount: 0,
        lastMessage: undefined
    },
    {
        id: 'support-room',
        participants: [
            { id: 'support', name: 'Xandeum Support', username: '@support', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=support', isOnline: true }
        ],
        messages: [],
        unreadCount: 0,
        lastMessage: undefined
    },
    {
        id: 'krimson-chat',
        participants: [
            { id: 'krimson', name: 'Krimson', username: '@krimson', avatar: '/avatars/user_krimson.png', isOnline: true }
        ],
        messages: [],
        unreadCount: 2,
        lastMessage: undefined
    },
    {
        id: 'mati-chat',
        participants: [
            { id: 'mati', name: 'Mati', username: '@mati', avatar: '/avatars/user_mati.png', isOnline: false }
        ],
        messages: [],
        unreadCount: 0,
        lastMessage: undefined
    },
    {
        id: 'pek-chat',
        participants: [
            { id: 'pek', name: 'Pek', username: '@pek', avatar: '/avatars/user_pek.png', isOnline: true }
        ],
        messages: [],
        unreadCount: 5,
        lastMessage: undefined
    }
];

export const mapMessageToChatMessage = (msg: any, currentUserId: string): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    timestamp: msg.timestamp, // matched DB column
    senderId: msg.sender_id,
    isFromCurrentUser: msg.sender_id === currentUserId,
});

export const fetchConversations = async (): Promise<ChatConversation[]> => {
    try {
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching chat_messages:', error);
            return BASE_CONVERSATIONS;
        }

        const currentUser = getCurrentUser();

        // Hydrate conversations with real messages
        const conversations = BASE_CONVERSATIONS.map(conv => {
            const convMessages = messages
                .filter((m: any) => m.conversation_id === conv.id)
                .map((m: any) => mapMessageToChatMessage(m, currentUser.id));

            return {
                ...conv,
                messages: convMessages,
                lastMessage: convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined,
                unreadCount: 0
            };
        });

        return conversations;
    } catch (err) {
        console.error('Failed to fetch conversations:', err);
        return BASE_CONVERSATIONS;
    }
};

export const sendMessage = async (content: string, conversationId: string, senderId: string) => {
    try {
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                content,
                conversation_id: conversationId,
                sender_id: senderId,
                timestamp: new Date().toISOString()
            });

        if (error) throw error;
    } catch (err) {
        console.error('Error sending message:', err);
        throw err;
    }
};

