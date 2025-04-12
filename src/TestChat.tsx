/**
 * Requirements:
 * - Provide a chat interface using AWS Amplify's chat functionality
 * - Display message history with clear user/assistant distinction
 * - Allow sending new messages
 * - Auto-scroll to latest messages
 * - Handle loading states and errors
 */
import React, { useState, useEffect, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import './TestChat.css';

// Import Amplify configuration outputs
// @ts-ignore
import outputs from "../amplify_outputs.json";

// Configure Amplify
Amplify.configure(outputs);

// We're using any for the client type to avoid TypeScript errors with the conversations API
// since we don't have access to the full type definition
const client = generateClient<any>({ authMode: "userPool" });

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

const TestChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [subscription, setSubscription] = useState<any>(null);
  // Keep track of current assistant message being built from stream
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<string | null>(null);

  // Initialize chat session
  useEffect(() => {
    async function initChat() {
      try {
        setIsLoading(true);
        console.log('Initializing chat...');

        // Create a new chat conversation using the Amplify client
        const { data: newChat, errors } = await client.conversations.chat.create({
          name: 'My conversation',
          metadata: {
            value: '1234567890',
          },
        });

        if (errors) {
          console.error('Chat creation errors:', errors);
          setError('Failed to create chat session');
          return;
        }

        console.log('Chat created successfully:', newChat);
        setChat(newChat);

        // Subscribe to assistant responses
        if (newChat) {
          const newSubscription = newChat.onStreamEvent({
            next: (event: any) => {
              console.log('Received event:', event);

              // Log the full event details for debugging
              console.log('Event details:', {
                id: event.id,
                text: event.text,
                associatedUserMessageId: event.associatedUserMessageId,
                hasText: !!event.text,
                keys: Object.keys(event)
              });

              // We have a text update from the assistant
              if (event.text) {
                // Check if this is a stream event (part of a message)
                if (event.id && event.id.includes('#stream')) {
                  const baseId = event.id.split('#')[0];

                  setMessages(prevMessages => {
                    // Check if we already have a message with this ID
                    const existingMessageIndex = prevMessages.findIndex(
                      msg => msg.id === baseId
                    );

                    // If we found an existing message, update its content
                    if (existingMessageIndex >= 0) {
                      const updatedMessages = [...prevMessages];
                      updatedMessages[existingMessageIndex] = {
                        ...updatedMessages[existingMessageIndex],
                        content: updatedMessages[existingMessageIndex].content + event.text
                      };
                      return updatedMessages;
                    }
                    // If this is the first fragment of a new message
                    else {
                      const newMessage: Message = {
                        id: baseId,
                        content: event.text,
                        isUser: false,
                        timestamp: new Date()
                      };
                      setCurrentAssistantMessageId(baseId);
                      return [...prevMessages, newMessage];
                    }
                  });
                }
                // Handle complete message events if there are any
                else if (event.id) {
                  setMessages(prev => [
                    ...prev,
                    {
                      id: event.id,
                      content: event.text,
                      isUser: false,
                      timestamp: new Date()
                    }
                  ]);
                }
              }
            },
            error: (error: any) => {
              console.error('Stream error:', error);
              setError('Error in message stream');
            }
          });

          setSubscription(newSubscription);
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    }

    initChat();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('Cleaning up subscription');
        subscription.unsubscribe?.();
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log('Messages updated:', messages.length);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chat) return;

    try {
      setIsLoading(true);
      const messageContent = inputText.trim();

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: messageContent,
        isUser: true,
        timestamp: new Date(),

      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      console.log('Sending message:', messageContent);
      const { data, errors } = await chat.sendMessage(messageContent, {
        aiContext: {
          uiContextId: {
            value: '123asd213123',
          },
        },
      });

      if (errors) {
        console.error('Send message errors:', errors);
        setError('Failed to send message');
      } else {
        console.log('Message sent successfully:', data);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container" data-testid="test-chat">
      <div className="chat-header">
        <h2>Chat</h2>
        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">Start a conversation by sending a message</div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'assistant-message'}`}
              data-message-id={message.id}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={isLoading || !chat}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !chat || !inputText.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default TestChat;
