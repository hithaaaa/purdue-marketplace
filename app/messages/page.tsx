"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Send, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  listing_title?: string
  listing_price?: number
  listing_images?: string[]
  other_user_name?: string
  other_user_id?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name?: string
  is_read: boolean
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch conversations with optimized query
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          id,
          listing_id,
          buyer_id,
          seller_id,
          created_at,
          updated_at
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (conversationsError) {
        throw conversationsError
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Get listing details
      const listingIds = conversationsData.map((c) => c.listing_id).filter(Boolean)
      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, title, price, images")
        .in("id", listingIds)

      // Get user profiles
      const userIds = [
        ...conversationsData.map((c) => c.buyer_id),
        ...conversationsData.map((c) => c.seller_id),
      ].filter((id) => id !== user.id)

      const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", userIds)

      // Get last messages and unread counts
      const conversationIds = conversationsData.map((c) => c.id)
      const { data: lastMessagesData } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })

      // Process conversations with additional data
      const enrichedConversations = conversationsData.map((conversation) => {
        const listing = listingsData?.find((l) => l.id === conversation.listing_id)
        const otherUserId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id
        const otherUser = profilesData?.find((p) => p.id === otherUserId)

        // Find last message for this conversation
        const conversationMessages = lastMessagesData?.filter((m) => m.conversation_id === conversation.id) || []
        const lastMessage = conversationMessages[0]

        // Count unread messages (messages from other user that we haven't read)
        const unreadCount = conversationMessages.filter(
          (m) => m.sender_id !== user.id && new Date(m.created_at) > new Date(conversation.updated_at || 0),
        ).length

        return {
          ...conversation,
          listing_title: listing?.title,
          listing_price: listing?.price,
          listing_images: listing?.images,
          other_user_name: otherUser?.full_name || "Unknown User",
          other_user_id: otherUserId,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at,
          unread_count: unreadCount,
        }
      })

      setConversations(enrichedConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        setMessagesLoading(true)

        const { data: messagesData, error } = await supabase
          .from("messages")
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            is_read
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) {
          throw error
        }

        // Get sender names
        const senderIds = [...new Set(messagesData?.map((m) => m.sender_id) || [])]
        const { data: sendersData } = await supabase.from("profiles").select("id, full_name").in("id", senderIds)

        const enrichedMessages =
          messagesData?.map((message) => ({
            ...message,
            sender_name: sendersData?.find((s) => s.id === message.sender_id)?.full_name || "Unknown",
            is_read: message.is_read || false,
          })) || []

        setMessages(enrichedMessages)

        // Mark messages as read
        if (user && messagesData?.length > 0) {
          const unreadMessageIds = messagesData.filter((m) => m.sender_id !== user.id && !m.is_read).map((m) => m.id)

          if (unreadMessageIds.length > 0) {
            await supabase.from("messages").update({ is_read: true }).in("id", unreadMessageIds)
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        })
      } finally {
        setMessagesLoading(false)
      }
    },
    [user, toast],
  )

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return

    setSendingMessage(true)

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: newMessage.trim(),
        is_read: false,
      })

      if (error) {
        throw error
      }

      setNewMessage("")
      await fetchMessages(selectedConversation)

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation)

      // Refresh conversations to update unread counts
      fetchConversations()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    fetchMessages(conversationId)
  }

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purdue-gold mx-auto"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start messaging sellers!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id ? "bg-purdue-gold/10" : ""
                      }`}
                      onClick={() => handleConversationSelect(conversation.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Link
                            href={`/profile/${conversation.other_user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block"
                          >
                            <Avatar className="hover:ring-2 hover:ring-purdue-gold transition-all">
                              <AvatarFallback className="bg-purdue-gold text-black">
                                {conversation.other_user_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          {conversation.unread_count > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-sm ${conversation.unread_count > 0 ? "font-bold" : ""}`}>
                              {conversation.other_user_name}
                            </p>
                            {conversation.last_message_time && (
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conversation.listing_title}</p>
                          <p className="text-xs text-gray-500">${conversation.listing_price}</p>
                          {conversation.last_message && (
                            <p
                              className={`text-xs text-gray-500 truncate mt-1 ${
                                conversation.unread_count > 0 ? "font-semibold text-gray-700" : ""
                              }`}
                            >
                              {conversation.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {(() => {
                      const conversation = conversations.find((c) => c.id === selectedConversation)
                      if (!conversation) return "Conversation"

                      return (
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/profile/${conversation.other_user_id}`}
                            className="flex items-center space-x-2 hover:text-purdue-gold transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-purdue-gold text-black">
                                {conversation.other_user_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{conversation.other_user_name}</span>
                          </Link>
                          <span className="text-gray-500">-</span>
                          <span className="text-gray-600">{conversation.listing_title}</span>
                        </div>
                      )
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 mb-4">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purdue-gold"></div>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? "bg-purdue-gold text-black"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                                {message.sender_id === user?.id && (
                                  <span className="text-xs opacity-70">{message.is_read ? "Read" : "Sent"}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-purdue-gold text-black hover:bg-yellow-400"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
