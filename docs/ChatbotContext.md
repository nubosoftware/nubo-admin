# Chatbot Context System

The Nubo Admin application includes an AI assistant chatbot that can help users with various tasks. To make the chatbot more helpful and aware of the current application state, we've implemented a context system that allows components to provide information about their current state to the chatbot.

## How It Works

1. The application maintains a global state object (`window.$nuboAppState`) that components can update with their current state.
2. When a user interacts with the chatbot, this context data is sent along with the user's message to provide additional context to the AI.
3. Components use the `contextUpdater` mixin to easily update this global state.

## Using the Context Updater Mixin

### Step 1: Import the Mixin

```js
import contextUpdater from "../mixins/contextUpdater";

export default {
  name: "YourComponent",
  mixins: [contextUpdater],
  // ... component definition
}
```

### Step 2: Update Context at Key Points

Use the `updateContext` method to send data to the global state:

```js
methods: {
  fetchData() {
    api.getData()
      .then(response => {
        this.items = response.data;

        // Update context with fetched data
        this.updateContext({
          items: this.items,
          count: this.items.length,
          lastFetched: new Date().toISOString()
        });
      });
  }
}
```

## When to Update Context

Update the context at key points in your component's lifecycle:

1. **Initialization**: When the component is created
2. **Data Loading**: After fetching data from an API
3. **User Interactions**: When users make selections or changes
4. **Form Updates**: When form values change
5. **Navigation**: Before or after navigating to a new view
6. **Errors**: When errors occur

## Context Data Structure

When updating context, provide structured data that will be helpful for the chatbot:

```js
this.updateContext({
  // Always include a view state to indicate what the user is looking at
  view: 'list', // or 'detail', 'form', 'searching', etc.

  // Include relevant data for the current view
  items: this.items,
  selectedItem: this.selectedItem,

  // Include filter/search parameters
  filters: this.filters,
  searchTerm: this.searchQuery,

  // Include user permissions relevant to the current view
  canEdit: this.hasEditPermission,
  canDelete: this.hasDeletePermission,

  // Include timestamps for when data was last updated
  lastUpdated: new Date().toISOString()
});
```

## Example Implementation

The Apps page demonstrates a complete implementation of context updates:

- It initializes context in the `created` hook
- It updates context when apps are fetched
- It updates context when search filters change
- It updates context during app upload/installation
- It updates context before navigation

See `src/views/Apps.vue` for a complete example.

## Examples for Different Scenarios

For more examples of how to use the context system in different scenarios, see the example file at `src/examples/ContextExamples.js`.

## Debugging

You can inspect the current context data in the browser console:

```js
console.log(window.$nuboAppState);
```

This can be helpful for debugging and understanding what context is available to the chatbot.