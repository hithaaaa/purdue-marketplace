"use client"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function ContactUsPage() {
    const [newMessage, setNewMessage] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [sendingMessage, setSendingMessage] = useState(false)
  const { toast } = useToast()
    
  
  const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !email) return
  
      setSendingMessage(true)
  
      try {
        const { error } = await supabase.from("feedback").insert({
          name: username.trim() || "Anonymous",
          email: email.trim(),
          message: newMessage.trim(),
        })
  
        if (error) {
          console.error("Not able to send:", error)
          throw error
        }
  
        setNewMessage("")
        
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
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purdue-black to-gray-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Noticed an issue?</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto p-3">
            Please give a detailed description of your suggestion or the issue you encountered.
          </p>
          <p className="text-sm md:text-md max-w-lg mx-auto">
            Thank you for helping us improve!
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <form className="space-y-6" onSubmit={sendMessage}>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                placeholder="you@purdue.edu"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Message</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="bg-purdue-gold text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400"
            >
              Send Message
            </button>
            {sendingMessage && (
              <div className="text-gray-500 text-sm">Sending your message...</div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
