"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, User } from "lucide-react";
import { useState } from "react";

interface Message {
    sender: "user" | "bot";
    text: string;
}

export function GeminiTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      const newMessages: Message[] = [...messages, { sender: "user", text: input }];
      setMessages(newMessages);
      setInput("");

      // Mock bot response
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: "bot", text: `This is a mocked Gemini response for: "${input}"` }]);
      }, 1000);
    }
  };

  return (
    <Card className="h-[75vh] flex flex-col">
      <CardHeader>
            <h2 className="text-2xl font-bold">Chat with Gemini</h2>
        </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'bot' && <BrainCircuit className="h-8 w-8 text-primary" />}
                <div className={`rounded-lg p-3 max-w-[70%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.sender === 'user' && <User className="h-8 w-8" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
