/**
 * ContextUpdater Mixin
 *
 * This mixin provides methods for updating the global app context that will
 * be sent to the AI chatbot, allowing it to have awareness of the current
 * application state when responding to user queries.
 */

export default {
  methods: {
    /**
     * Update the global app context with page-specific state
     * @param {Object} contextData - Object containing page state data to add to the global context
     */
    updateContext(contextData) {
      // Create component-specific context object
      const componentContext = {
        componentName: this.$options.name || 'UnnamedComponent',
        timestamp: new Date().toISOString(),
        ...contextData
      };

      // Emit event to update global app state
      this.$emit('updateAppState', componentContext);

      // Also update directly if $parent chain isn't working for some reason
      if (window.$nuboAppState) {
        const componentName = this.$options.name || 'UnnamedComponent';
        window.$nuboAppState[componentName] = componentContext;
        window.$nuboAppState.lastUpdated = new Date().toISOString();
      }
    }
  }
};