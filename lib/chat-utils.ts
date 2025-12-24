import type { ChatConversation, ChatMessage, ChatUser } from "@/types/chat";
import { supabase } from "@/lib/supabase";

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

export const mapSupabaseMessageToChatMessage = (msg: any, currentUserId: string): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    timestamp: msg.created_at,
    senderId: msg.sender_id,
    isFromCurrentUser: msg.sender_id === currentUserId,
});

export const fetchConversations = async (): Promise<ChatConversation[]> => {
    const currentUser = getCurrentUser();

    // 1. Fetch profiles to build participants list
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
    }

    // 2. Fetch all messages (for now, simple approach)
    // In production, you'd fetch per conversation or use a join
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return [];
    }

    // 3. Group messages by conversation
    const conversationMap = new Map<string, ChatMessage[]>();

    messages.forEach((msg: any) => {
        const chatMsg = mapSupabaseMessageToChatMessage(msg, currentUser.id);

        if (!conversationMap.has(msg.conversation_id)) {
            conversationMap.set(msg.conversation_id, []);
        }
        conversationMap.get(msg.conversation_id)?.push(chatMsg);
    });

    // 4. Build Conversation objects
    // We'll define fixed conversations based on the mock users for this demo
    const targetUsers = profiles.filter((p: any) => p.id !== currentUser.id);

    const conversations: ChatConversation[] = targetUsers.map((user: any) => {
        const convId = `conv-${user.id}`;
        const userMsgs = conversationMap.get(convId) || [];
        const lastMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null;

        // Convert profile to ChatUser
        const participant = mapProfileToChatUser(user);

        return {
            id: convId,
            participants: [currentUser, participant],
            messages: userMsgs,
            lastMessage: lastMsg || {
                id: `init-${convId}`,
                content: "New conversation",
                timestamp: new Date().toISOString(),
                senderId: 'system',
                isFromCurrentUser: false
            },
            unreadCount: 0 // logic for unread count can be added later
        };
    });

    return conversations;
};

export const sendMessageToSupabase = async (content: string, conversationId: string, senderId: string) => {
    const { error } = await supabase
        .from('messages')
        .insert({
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content,
            conversation_id: conversationId,
            sender_id: senderId
        });

    if (error) console.error('Error sending message:', error);
    return error;
};
