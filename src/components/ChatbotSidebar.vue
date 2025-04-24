<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    right
    width="380"
    persistent
    class="chatbot-drawer"
  >
    <v-card flat class="d-flex flex-column" style="height: 100%">
      <v-card-title class="py-2 px-4 chatbot-header">
        <span>{{ $t('AI Assistant') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon small @click="startNewChat">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon small @click="toggleChatHistory">
          <v-icon>{{ showChatHistory ? 'mdi-history' : 'mdi-message-text' }}</v-icon>
        </v-btn>
        <v-btn icon small @click="close" class="ml-2">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Chat History -->
      <v-card-text v-if="showChatHistory" class="chat-history flex-grow-1 overflow-y-auto pa-0">
        <v-list two-line class="pa-0">
          <v-list-item-group v-model="selectedChatHistory" color="primary">
            <v-list-item
              v-for="(chat, index) in chatHistory"
              :key="index"
              @click="loadChatHistory(chat.id)"
            >
              <v-list-item-content>
                <v-list-item-title class="text-truncate">{{ chat.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-truncate">{{ formatDate(chat.timestamp) }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon small @click.stop="deleteChatHistory(chat.id)">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card-text>

      <!-- Chat Messages -->
      <v-card-text v-else class="chat-messages flex-grow-1 overflow-y-auto px-4 py-2">
        <div v-for="(message, i) in currentChat.messages" :key="i" class="message-container mb-6">
          <div class="message-wrapper" :class="message.sender === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'">
            <div
              class="message-bubble pa-4"
              :class="message.sender === 'user' ? 'user-message' : 'bot-message'"
            >
              <div class="message-content" v-html="formatMessage(message.content)"></div>
              <span v-if="message.sender === 'bot' && isGenerating && i === currentChat.messages.length - 1" class="cursor-blink"></span>
            </div>
          </div>
        </div>

        <!-- Thinking Indicator -->
        <div v-if="isThinking" class="message-container mb-6">
          <div class="message-wrapper bot-message-wrapper">
            <div class="message-bubble bot-message pa-4">
              <v-progress-linear
                indeterminate
                color="primary"
                height="3"
                class="mb-2"
              ></v-progress-linear>
              <div>{{ $t('Thinking...') }}</div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Input Area -->
      <v-card-actions class="pa-4">
        <v-textarea
          v-model="chatInput"
          :placeholder="$t('Type a message...')"
          :disabled="isGenerating"
          @keydown.enter.prevent="handleEnterKey"
          class="input-field ma-0 pa-0"
          auto-grow
          hide-details
          rows="1"
          no-resize
          outlined
          dense
        >
          <template v-slot:append>
            <v-btn
              icon
              :disabled="!chatInput.trim() || isGenerating"
              color="primary"
              @click="sendMessage"
              class="send-button"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-textarea>
      </v-card-actions>

      <!-- Stop Generation Button -->
      <v-card-actions v-if="isGenerating" class="py-2 px-4">
        <v-btn
          block
          color="error"
          @click="stopGeneration"
          small
        >
          {{ $t('Stop Generation') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<style scoped>
.chatbot-drawer {
  border-left: 1px solid rgba(0, 0, 0, 0.12);
}

.chatbot-header {
  background-color: #f5f5f5;
}

.chat-messages, .chat-history {
  height: calc(100vh - 140px);
}

.message-container {
  width: 100%;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.user-message-wrapper {
  justify-content: flex-end;
}

.bot-message-wrapper {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 85%;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  box-shadow: none;
}

.user-message {
  background-color: #e9f5ff;
  color: #000;
}

.bot-message {
  background-color: #f7f7f8;
  color: #000;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.cursor-blink {
  display: inline-block;
  width: 8px;
  height: 16px;
  background-color: #000;
  vertical-align: text-bottom;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.message-content >>> code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.input-field {
  border-radius: 8px;
}

.input-field >>> textarea {
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
}

.input-field >>> .v-input__slot {
  align-items: flex-end !important;
  min-height: 44px !important;
}

.input-field >>> .v-input__append-inner {
  margin-top: 0 !important;
  align-self: flex-end !important;
  padding-bottom: 8px;
}

.send-button {
  margin: 0 !important;
  height: 36px !important;
}
</style>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

export default {
  name: 'ChatbotSidebar',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    showChatHistory: false,
    selectedChatHistory: null,
    chatHistory: [],
    chatInput: '',
    isThinking: false,
    isGenerating: false,
    currentChat: {
      id: null,
      title: '',
      timestamp: null,
      messages: []
    },
    chatController: null,
    chatMessagesRef: null
  }),
  computed: {
    drawer: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    }
  },
  watch: {
    value(newVal) {
      if (newVal && !this.currentChat.id) {
        this.startNewChat();
        this.fetchChatHistory();
      }
    },
    'currentChat.messages': {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    isGenerating(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    }
  },
  mounted() {
    this.chatMessagesRef = this.$el.querySelector('.chat-messages');
  },
  methods: {
    scrollToBottom() {
      if (this.chatMessagesRef) {
        this.chatMessagesRef.scrollTop = this.chatMessagesRef.scrollHeight;
      }
    },

    close() {
      this.drawer = false;
    },

    toggleChatHistory() {
      this.showChatHistory = !this.showChatHistory;
      if (this.showChatHistory) {
        this.fetchChatHistory();
      }
    },

    startNewChat() {
      this.currentChat = {
        id: null,
        title: '',
        timestamp: null,
        messages: []
      };
      this.showChatHistory = false;
    },

    fetchChatHistory() {
      appUtils
        .get({
          url: "api/chatbot/history",
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.chatHistory = response.data.history || [];
          } else {
            console.error("Failed to fetch chat history:", response.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching chat history:", error);
        });
    },

    loadChatHistory(chatId) {
      appUtils
        .get({
          url: `api/chatbot/history/${chatId}`,
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.currentChat = response.data.chat;
            this.showChatHistory = false;
          } else {
            console.error("Failed to load chat:", response.data);
          }
        })
        .catch((error) => {
          console.error("Error loading chat:", error);
        });
    },

    deleteChatHistory(chatId) {
      appUtils
        .delete({
          url: `api/chatbot/history/${chatId}`,
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.chatHistory = this.chatHistory.filter(chat => chat.id !== chatId);
            if (this.currentChat.id === chatId) {
              this.currentChat = {
                id: null,
                title: '',
                timestamp: null,
                messages: []
              };
            }
          } else {
            console.error("Failed to delete chat:", response.data);
          }
        })
        .catch((error) => {
          console.error("Error deleting chat:", error);
        });
    },

    sendMessage() {
      if (!this.chatInput.trim() || this.isGenerating) return;

      // Add user message
      const userMessage = {
        sender: 'user',
        content: this.chatInput.trim(),
        timestamp: new Date()
      };

      // If this is a new chat, create it first
      if (!this.currentChat.id) {
        this.currentChat = {
          id: 'temp-' + Date.now(),
          title: this.chatInput.trim(),
          timestamp: new Date(),
          messages: [userMessage]
        };
        this.showChatHistory = false;
      } else {
        this.currentChat.messages.push(userMessage);
      }

      this.chatInput = '';
      this.isThinking = true;
      this.isGenerating = true;

      // Set up AbortController for streaming response
      this.chatController = new AbortController();

      // Add an empty bot message that will be streamed into
      const botMessage = {
        sender: 'bot',
        content: '',
        timestamp: new Date()
      };
      this.currentChat.messages.push(botMessage);

      // Determine endpoint based on whether this is a new chat or existing chat
      const endpoint = this.currentChat.id.startsWith('temp-')
        ? 'api/chatbot/chat/new'
        : `api/chatbot/chat/${this.currentChat.id}/message`;

      // Stream the response directly from the endpoint
      this.streamResponse(endpoint, botMessage, userMessage.content);
    },

    async streamResponse(endpoint, botMessage, userMessage = null) {
      let processedInit = false;

      try {
        let url = endpoint;
        if (appData.postURL) {
            url = appData.postURL + url;
        }
        if (appData.proxyURL) {
            url = appData.proxyURL + url;
        }

        // Get current app context
        const context = this.getAppContext();

        // Prepare request options
        const options = {
          method: userMessage ? 'POST' : 'GET',
          headers: {
            'Authorization': `OAuth ${appData.adminLoginToken}`,
            'Accept': 'text/event-stream'
          },
          signal: this.chatController.signal
        };

        // Add body for POST requests
        if (userMessage) {
          options.method = 'POST';
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify({
            stream: true,
            message: userMessage,
            context: context
            // chatTitle: this.currentChat.title
          });
        }

        const response = await fetch(url, options);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let streaming = true;

        while (streaming) {
          const { value, done } = await reader.read();
          if (done) {
            streaming = false;
            break;
          }

//           type ChatBufferItem = {
//     type: 'text' | 'event' | 'init' | 'done';
//     content: any;
// }

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const eventData = line.substring(6);
              if (eventData === '[DONE]') {
                this.isGenerating = false;
                streaming = false;
                break;
              }

              try {
                const parsedData = JSON.parse(eventData);

                // Handle init message
                if (parsedData.type === 'init' && parsedData.content) {
                  console.log("init:",parsedData.content);
                  if (parsedData.content.status === 1) {
                    // Update chat ID if this was a new chat
                    if (parsedData.content.chatId && this.currentChat.id.startsWith('temp-')) {
                      this.currentChat.id = parsedData.content.chatId;
                    }
                    this.isThinking = false;
                    processedInit = true;
                  } else {
                    throw new Error(parsedData.content.message || "Failed to send message");
                  }
                } else if (parsedData.type === 'done' && parsedData.content) {
                  console.log("done:",parsedData.content);
                  this.isGenerating = false;
                  streaming = false;
                  break;
                } else if (parsedData.type === 'text' && parsedData.content) {
                  console.log("text:",parsedData.content);
                  botMessage.content += parsedData.content;
                  // Force Vue to recognize the change
                  this.currentChat = { ...this.currentChat };
                  // Scroll to bottom when new content arrives
                  this.$nextTick(() => {
                    this.scrollToBottom();
                  });
                } else if (parsedData.type === 'event' && parsedData.content) {
                  console.log("event:",parsedData.content);
                  // type: 'event',
                  //           content: {
                  //               event: 'navigate',
                  //               pageName: pageName,
                  //               params: params || {}
                  //           }
                  if (parsedData.content.event === 'navigate') {
                    console.log("navigate:",parsedData.content);
                    this.$router.push({ name: parsedData.content.pageName, params: parsedData.content.params });
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          console.error('Error streaming response:', error);
          if (!processedInit) {
            botMessage.content = 'Sorry, I encountered an error while processing your request.';
          }
        }
      } finally {
        this.isGenerating = false;
        this.isThinking = false;
        this.chatController = null;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },

    stopGeneration() {
      if (this.chatController) {
        this.chatController.abort();
        this.isGenerating = false;
        this.isThinking = false;
      }
    },

    formatMessage(text) {
      // Basic markdown-like formatting - replace with more sophisticated parser if needed
      return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
    },

    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },

    handleEnterKey(event) {
      if (event.shiftKey) {
        // Shift+Enter adds a new line
        this.chatInput += '\n';
      } else {
        // Enter sends the message
        this.sendMessage();
      }
    },

    getAppContext() {
      // Get the current route information
      const currentRoute = this.$route;

      // Get basic app data
      const contextData = {
        // General application state
        currentOrg: appData.mainDomain,
        orgName: appData.orgname,
        currentRoute: {
          path: currentRoute ? currentRoute.path : null,
          name: currentRoute ? currentRoute.name : null,
          params: currentRoute ? currentRoute.params : null,
          query: currentRoute ? currentRoute.query : null
        },
        // User info
        user: {
          firstName: appData.firstname,
          lastName: appData.lastname,
          email: appData.email,
          permissions: appData.permissions
        },
        // System info
        productName: appData.productName,
        version: appData.version,
        isEnterpriseEdition: appData.isEnterpriseEdition(),
        pluginsEnabled: appData.pluginsEnabled,
        // Navigation context
        breadcrumbs: this.$parent.items || []
      };

      // Get active component data if available through global event bus
      if (window.$nuboAppState) {
        contextData.pageState = window.$nuboAppState;
      }

      // Try to get Vuex store data if it exists
      if (this.$store) {
        try {
          contextData.storeState = this.$store.state;
        } catch (e) {
          console.error("Error accessing store state:", e);
        }
      }

      // Add active dialog information if available
      const activeDialogs = document.querySelectorAll('.v-dialog--active');
      if (activeDialogs.length > 0) {
        contextData.activeDialogs = Array.from(activeDialogs).map(dialog => {
          return {
            title: dialog.querySelector('.v-card__title')?.textContent?.trim() || null,
            content: dialog.querySelector('.v-card__text')?.textContent?.trim() || null
          };
        });
      }

      // Add selected items if any are available in the global state
      if (window.$nuboAppState && window.$nuboAppState.selectedItems) {
        contextData.selectedItems = window.$nuboAppState.selectedItems;
      }

      // Add form data if available in the global state
      if (window.$nuboAppState && window.$nuboAppState.formData) {
        contextData.formData = window.$nuboAppState.formData;
      }

      console.log("contextData:",contextData);

      return contextData;
    }
  }
};
</script>