import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/api";
import { Authenticator } from "@aws-amplify/ui-react";
import { AIConversation, createAIHooks } from '@aws-amplify/ui-react-ai';
import '@aws-amplify/ui-react/styles.css';
import outputs from "../amplify_outputs.json";
import { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

const client = generateClient<Schema>({ authMode: "userPool" });
const { useAIConversation } = createAIHooks(client);

export default function App() {
  const [
    {
      data: { messages },
      isLoading,
    },
    handleSendMessage,
  ] = useAIConversation('chat');
  // 'chat' is based on the key for the conversation route in your schema.

  return (
    <Authenticator>
      <AIConversation
        messages={messages}
        isLoading={isLoading}
        handleSendMessage={handleSendMessage}
        aiContext={() => {
          return {
            uiContextId: '123123adfa',
          };
        }}
      />
    </Authenticator>
  );
}