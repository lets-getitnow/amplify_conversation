import { type ClientSchema, a, defineData } from "@aws-amplify/backend";


const schema = a.schema({
  chat: a.conversation({
    aiModel: a.ai.model('Claude 3.5 Haiku'),
    systemPrompt: 'Return the uiContextId to the user, and return all metaData associated with this conversation including uiMetadataId',
  })
  .authorization((allow) => allow.owner()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});


