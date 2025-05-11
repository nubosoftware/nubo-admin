<template>
  <div class="chatbot-container">
    <div
      v-if="drawer"
      class="resize-handle"
      @mousedown="startResize"
      :style="{right: drawerWidth + 'px'}"
    >
      <div class="resize-indicator"></div>
    </div>
    <v-navigation-drawer
      v-model="drawer"
      app
      right
      :width="drawerWidth"
      persistent
      class="chatbot-drawer"
    >
      <v-card flat class="d-flex flex-column" style="height: 100%" elevation="0">
        <v-card-title class="py-2 px-4 chatbot-header">
          <span class="font-weight-medium">{{ $t('AI Assistant') }}</span>
          <v-spacer></v-spacer>
          <v-btn icon small @click="startNewChat" class="action-button">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn icon small @click="toggleChatHistory" class="action-button">
            <v-icon>{{ showChatHistory ? 'mdi-history' : 'mdi-message-text' }}</v-icon>
          </v-btn>
          <v-btn icon small @click="close" class="ml-2 action-button">
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
                class="chat-history-item"
              >
                <v-list-item-content>
                  <v-list-item-title class="text-truncate">{{ chat.title }}</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">{{ formatDate(chat.timestamp) }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon small @click.stop="deleteChatHistory(chat.id)" class="delete-button">
                    <v-icon small>mdi-delete</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card-text>

        <!-- Chat Messages -->
        <v-card-text v-else class="chat-messages flex-grow-1 overflow-y-auto px-4 py-2">
          <!-- Welcome message when no messages -->
          <div v-if="currentChat.messages.length === 0" class="welcome-message">
            <v-icon size="64" color="primary" class="mb-4">mdi-robot</v-icon>
            <h3 class="mb-2">{{ $t('Welcome to the AI Assistant') }}</h3>
            <p class="text-body-2">{{ $t('How can I help you with Nubo Admin today?') }}</p>
          </div>

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
        <v-card-actions class="input-container pa-4">
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
            rounded
          >
            <template v-slot:append>
              <div class="button-container">
                <v-btn
                  v-if="!isGenerating"
                  icon
                  :disabled="!chatInput.trim()"
                  color="primary"
                  @click="sendMessage"
                  class="send-button"
                  elevation="0"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  icon
                  color="error"
                  @click="stopGeneration"
                  class="stop-button"
                  elevation="0"
                >
                  <v-icon>mdi-stop</v-icon>
                </v-btn>
              </div>
            </template>
          </v-textarea>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.chatbot-container {
  position: relative;
}

.resize-handle {
  position: fixed;
  top: 0;
  bottom: 0;
  /* Width and position are set with inline style */
  width: 12px;
  cursor: ew-resize;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-indicator {
  width: 4px;
  height: 40px;
  background-color: rgba(95, 137, 130, 0.3);
  border-radius: 2px;
  transition: background-color 0.2s;
}

.resize-handle:hover .resize-indicator {
  background-color: rgba(95, 137, 130, 0.7);
}

.chatbot-drawer {
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  background-color: #f8f5ed; /* Match app bg color */
}

.chatbot-header {
  background-color: #f2ecdf; /* Use high theme color from vuetify theme */
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.chat-messages, .chat-history {
  height: calc(100vh - 140px);
  background-color: #f8f5ed; /* Match app bg color */
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.7);
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
  border-radius: 16px; /* More rounded corners */
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.user-message {
  background-color: #5f8982; /* Use secondary theme color */
  color: white;
  border-bottom-right-radius: 4px; /* Unique shape for user messages */
}

.bot-message {
  background-color: white; /* White background for bot messages */
  color: #3c4446; /* Primary color text */
  border-bottom-left-radius: 4px; /* Unique shape for bot messages */
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
  background-color: #3c4446; /* Match primary color */
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

.input-container {
  background-color: #f8f5ed; /* Match app bg color */
}

.input-field {
  border-radius: 20px; /* More rounded corners */
  background-color: white;
}

.input-field >>> .v-input__slot {
  align-items: center !important;
  min-height: 44px !important;
  border-radius: 20px !important; /* More rounded corners */
  border: 1px solid rgba(0, 0, 0, 0.04) !important; /* Lighter border */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.input-field >>> textarea {
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
  font-size: 14px;
  padding-top: 0;
  margin-top: 0;
}

.input-field >>> .v-text-field__slot {
  display: flex;
  align-items: center;
}

.input-field >>> .v-label {
  top: 50% !important;
  transform: translateY(-50%) !important;
  margin-bottom: 0;
  color: rgba(0, 0, 0, 0.5); /* Lighter text color */
}

.input-field >>> .v-input__append-inner {
  margin-top: 0 !important;
  align-self: center !important;
  padding-bottom: 0;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.send-button {
  margin: 0 !important;
  height: 36px !important;
  transition: transform 0.2s;
}

.send-button:hover {
  transform: scale(1.1);
}

.stop-button {
  margin: 0 !important;
  height: 36px !important;
  transition: transform 0.2s;
}

.stop-button:hover {
  transform: scale(1.1);
}

.button-container {
  position: relative;
}

.chat-history-item {
  border-radius: 8px;
  margin: 2px 4px;
  transition: background-color 0.2s;
}

.chat-history-item:hover {
  background-color: rgba(95, 137, 130, 0.1); /* Secondary color with transparency */
}

.delete-button {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-button:hover {
  opacity: 1;
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
    chatMessagesRef: null,
    drawerWidth: 380, // Default width
    isResizing: false,
    minWidth: 280,
    maxWidth: 800
  }),
  computed: {
    drawer: {
      get() {
        return this.value && appData.isAuthenticated;
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

    // Add event listeners for resize
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);

    // Try to load saved width from localStorage
    const savedWidth = localStorage.getItem('chatbotWidth');
    if (savedWidth) {
      this.drawerWidth = parseInt(savedWidth, 10);
    }
  },
  beforeDestroy() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  },
  methods: {
    startResize(e) {
      this.isResizing = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    },

    onResize(e) {
      if (!this.isResizing) return;

      // Calculate new width based on mouse position
      // Since it's a right-side drawer, we subtract from window width
      const newWidth = window.innerWidth - e.clientX;

      // Enforce min and max constraints
      if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
        this.drawerWidth = newWidth;
        // Save to localStorage for persistence
        localStorage.setItem('chatbotWidth', newWidth);
      }
    },

    stopResize() {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    },

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
      let timeoutId = null;

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

        // Set up timeout (30 seconds)
        timeoutId = setTimeout(() => {
          if (this.isGenerating) {
            this.stopGeneration();
            botMessage.content += '\n\n*Error: Response generation timed out after 30 seconds.*';
            this.currentChat = { ...this.currentChat };
          }
        }, 30000);

        const response = await fetch(url, options);

        // Check if response is not OK (non-200 status)
        if (!response.ok) {
          try {
            // Try to parse JSON error response
            const errorData = await response.json();
            const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
            botMessage.content = `*${errorMessage}*`;
            if (errorData.status === 0 && (errorMessage.includes('unauthorized') || errorMessage.includes('login') || errorMessage.includes('auth'))) {
              botMessage.content += '\n\n*It seems your session may have expired. Please try logging in again.*';
            }
          } catch (e) {
            // If can't parse JSON, use status text
            botMessage.content = `*Error: ${response.status} ${response.statusText}*`;
          }

          this.currentChat = { ...this.currentChat };
          return;
        }

        // Check content type to handle non-event-stream responses with 200 status
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') && !contentType.includes('text/event-stream')) {
          try {
            const jsonData = await response.json();
            if (jsonData.status === 0) {
              // Handle error JSON response with status 200
              const errorMessage = jsonData.message || 'Unknown error occurred';
              botMessage.content = `*${errorMessage}*`;

              if (errorMessage.includes('unauthorized') || errorMessage.includes('login') || errorMessage.includes('auth')) {
                botMessage.content += '\n\n*It seems your session may have expired. Please try logging in again.*';
              }

              this.currentChat = { ...this.currentChat };
              return;
            }
          } catch (e) {
            console.error('Error parsing JSON response:', e);
          }
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let streaming = true;

        while (streaming) {
          const { value, done } = await reader.read();
          if (done) {
            streaming = false;
            break;
          }

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
                  if (parsedData.content.event === 'navigate') {
                    console.log("navigate:",parsedData.content);
                    let pagePath = parsedData.content.pageName;
                    if (!pagePath.startsWith('/'  )) {
                      pagePath = '/' + pagePath;
                    }
                    this.$router.push({ path: pagePath, params: parsedData.content.params });
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
            if (error.message && error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
              botMessage.content = '*Sorry, I couldn\'t connect to the server. Please check your internet connection and try again.*';
            } else if (error.message && (error.message.includes('unauthorized') || error.message.includes('login') || error.message.includes('auth'))) {
              botMessage.content = '*Your session may have expired. Please try logging in again.*';
            } else {
              botMessage.content = '*Sorry, I encountered an error while processing your request. Please try again later.*';
            }
            // Force Vue to recognize the change
            this.currentChat = { ...this.currentChat };
          }
        }
      } finally {
        // Clear the timeout if it's still active
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

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
        breadcrumbs: appData.breadcrumbs || [],
        // Available routes with descriptions
        routes: this.getRouteDefinitions()
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
    },

    getRouteDefinitions() {
      // Define route information including descriptions and parameters
      return [
        {
          name: 'Home',
          description: 'Dashboard and home page',
          params: []
        },
        {
          name: 'SessionView',
          description: 'View details about a specific monitor session',
          params: [
            { name: 'id', description: 'The ID of the session to view' }
          ]
        },
        {
          name: 'Profiles',
          description: 'List users and view their profiles',
          params: []
        },
        {
          name: 'ProfileEdit',
          description: 'View and edit the profile of a user',
          params: [
            { name: 'id', description: 'The ID of the user to view/edit' }
          ]
        },
        {
          name: 'Profile',
          description: 'Create a new user profile',
          params: []
        },
        {
          name: 'Apps',
          description: 'List installed applications',
          params: []
        },
        {
          name: 'App',
          description: 'View details about a specific application',
          params: [
            { name: 'packageName', description: 'The package name of the application to view' }
          ]
        },
        {
          name: 'Groups',
          description: 'List and manage user groups',
          params: []
        },
        {
          name: 'GroupName',
          description: 'View and edit a specific group',
          params: [
            { name: 'groupName', description: 'The name of the group to view/edit' }
          ]
        },
        {
          name: 'GroupAD',
          description: 'View and edit a specific group with Active Directory domain',
          params: [
            { name: 'groupName', description: 'The name of the group to view/edit' },
            { name: 'adDomain', description: 'The Active Directory domain' }
          ]
        },
        {
          name: 'LDAP',
          description: 'LDAP configuration and management',
          params: []
        },
        {
          name: 'LDAPDomain',
          description: 'Manage specific LDAP domain settings',
          params: [
            { name: 'addomain', description: 'The Active Directory domain to manage' }
          ]
        },
        {
          name: 'Admins',
          description: 'List and manage system administrators',
          params: []
        },
        {
          name: 'Admin',
          description: 'View and edit administrator details',
          params: [
            { name: 'email', description: 'The email of the administrator to view/edit' }
          ]
        },
        {
          name: 'EmailSetup',
          description: 'Configure email settings',
          params: []
        },
        {
          name: 'Security',
          description: 'Security settings and configuration',
          params: []
        },
        {
          name: 'Orgs',
          description: 'List and manage organizations',
          params: []
        },
        {
          name: 'OrgDomain',
          description: 'View and edit organization details',
          params: [
            { name: 'domain', description: 'The domain of the organization to view/edit' }
          ]
        },
        {
          name: 'Reports',
          description: 'View system reports',
          params: []
        },
        {
          name: 'Report',
          description: 'View a specific report',
          params: [
            { name: 'reportCode', description: 'The code of the report to view' }
          ]
        },
        {
          name: 'Platforms',
          description: 'List and manage device platforms',
          params: []
        },
        {
          name: 'Platform',
          description: 'View and edit platform details',
          params: [
            { name: 'platID', description: 'The ID of the platform to view/edit' }
          ]
        },
        {
          name: 'Logs',
          description: 'View system logs',
          params: []
        },
        {
          name: 'Telephony',
          description: 'Telephony settings and configuration',
          params: []
        },
        {
          name: 'Recordings',
          description: 'View call recordings',
          params: []
        },
        {
          name: 'Firewalls',
          description: 'List and manage firewalls',
          params: []
        },
        {
          name: 'Firewall',
          description: 'View and edit firewall details',
          params: [
            { name: 'firewall_id', description: 'The ID of the firewall to view/edit' }
          ]
        },
        {
          name: 'Plugins',
          description: 'List and manage system plugins',
          params: []
        },
        {
          name: 'Plugin',
          description: 'View and edit plugin details',
          params: [
            { name: 'id', description: 'The ID of the plugin to view/edit' }
          ]
        },
        {
          name: 'SessionMonitor',
          description: 'Monitor past sessions. Browse and analyze past sessions.',
          params: []
        }
      ];
    }
  }
};
</script>