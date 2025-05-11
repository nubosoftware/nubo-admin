<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Groups") }}

    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="10"
      :search="search"
      class="ma-4 bg"
      @click:row="rowClick"
    >
    <template v-slot:top>
        <v-toolbar flat color="bg">
          <v-btn
            v-if="appData.checkPermission('/groups','w')"
            class="ma-4"
            color="primary" @click="$router.push('/Group/')">{{
            $t("New Group")
          }}</v-btn>
          <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
        </v-toolbar>
      </template>
    <template v-slot:[`item.adDomain`]="{ item }">
      <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
      <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
      <div v-else>{{$t("Active Directory")}}</div>
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon v-if="item.groupName != 'All' && appData.checkPermission('/groups','w')" small @click="deleteGroup(item,$event)" class="mx-2"> mdi-delete </v-icon>
    </template>
    </v-data-table>
    <v-dialog v-model="dialogDelete" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Remove Group") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove the selected group?")
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="dialogDelete = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            @click="dialogDelete = false | removeGroup()"
            >{{ $t("Remove Group") }}</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbarSave = false"
        >
          {{$t("Close")}}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Groups",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialogDelete: false,
    removeItem: null,
    snackbarSave: false,
    snackbarText: "",
    appData,
    pageContext: {}, // Store context data for the Groups page
  }),
  methods: {
    // Add updateContext method to maintain context within the Groups page
    updateContext: function(contextData) {
      // Preserve existing page context while adding new data
      this.pageContext = {
        ...this.pageContext,
        ...contextData
      };

      // Always include the full pageContext when updating app state
      this.$emit('updateAppState', {
        componentName: this.$options.name || 'Groups',
        timestamp: new Date().toISOString(),
        ...this.pageContext
      });
    },

    rowClick: function(val) {
      console.log(`rowClick: ${val.groupName}`);

      // Update context when a group is selected
      this.updateContext({
        view: 'groups',
        action: 'select_group',
        selectedGroup: {
          name: val.groupName,
          adDomain: val.adDomain,
          type: val.adDomain === '' ? 'Manual' :
                val.groupName === 'All' ? 'Automatic' : 'Active Directory'
        }
      });

      this.$router.push("/Group/" + val.groupName + "/" + val.adDomain);
    },

    deleteGroup: function(val,event) {
      console.log(`deleteGroup: ${val.groupName} ${val.adDomain}`);
      event.stopPropagation();
      this.dialogDelete = true;
      this.removeItem = val;

      // Update context when preparing to delete a group
      this.updateContext({
        view: 'groups',
        action: 'prepare_delete_group',
        groupToDelete: {
          name: val.groupName,
          adDomain: val.adDomain,
          type: val.adDomain === '' ? 'Manual' : 'Active Directory'
        }
      });

      return false;
    },

    removeGroup : function() {
      let groupParam;
      if (this.removeItem.adDomain && this.removeItem.adDomain != "") {
        groupParam = `${this.removeItem.groupName}#${this.removeItem.adDomain}`;
      } else {
        groupParam = this.removeItem.groupName;
      }
      console.log("groupParam: "+groupParam);

      // Update context when attempting to delete a group
      this.updateContext({
        view: 'groups',
        action: 'delete_group',
        groupToDelete: {
          name: this.removeItem.groupName,
          adDomain: this.removeItem.adDomain,
          type: this.removeItem.adDomain === '' ? 'Manual' : 'Active Directory'
        },
        groupParam: groupParam
      });

      appUtils
        .delete({
          url: `api/groups/${encodeURIComponent(groupParam)}`
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Group removed");
            this.snackbarSave = true;
            this.dialogDelete = false;

            // Update context with successful deletion
            this.updateContext({
              view: 'groups',
              action: 'delete_group_success',
              deletedGroup: {
                name: this.removeItem.groupName,
                adDomain: this.removeItem.adDomain
              }
            });

            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;

            // Update context with deletion error
            this.updateContext({
              view: 'groups',
              action: 'delete_group_error',
              error: `Failed with status ${response.data.status}`,
              groupToDelete: {
                name: this.removeItem.groupName,
                adDomain: this.removeItem.adDomain
              }
            });
          }
        })
        .catch(error => {
          console.log(error);

          // Update context with deletion error
          this.updateContext({
            view: 'groups',
            action: 'delete_group_error',
            error: `Error: ${error}`,
            groupToDelete: {
              name: this.removeItem.groupName,
              adDomain: this.removeItem.adDomain
            }
          });
        })
        .finally(() => (this.loading = false));
    },

    refresh: function() {
      // Update context with loading state
      this.updateContext({
        view: 'groups',
        action: 'loading',
        loading: true,
        searchTerm: this.search
      });

      appUtils
        .get({
          url: "api/groups"
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.groups;

            // Update context with groups data
            this.updateContext({
              view: 'groups',
              action: 'loaded',
              loading: false,
              groupsData: {
                count: this.rows.length,
                search: this.search,
                groups: this.rows,
                adGroups: this.rows.filter(group => group.adDomain && group.adDomain !== '').length,
                manualGroups: this.rows.filter(group => !group.adDomain || group.adDomain === '').length
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'groups',
              action: 'error',
              loading: false,
              error: `Failed to load groups (status: ${response.data.status})`
            });

            this.$router.push("/Login");
          }
        })
        .catch(error => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'groups',
            action: 'error',
            loading: false,
            error: `Error loading groups: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    }
  },
  created: function() {
    let bcItems = [
      {
        text: appData.productName,
        to: "/",
        disabled: false
      },
      {
        text: this.$t("Groups"),
        to: "/Groups",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Name"),
        value: "groupName"
      },
      {
        text: this.$t("Group Type"),
        value: "adDomain"
      },
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Groups',
      permissions: {
        canCreate: appData.checkPermission('/groups','w'),
        canDelete: appData.checkPermission('/groups','w')
      },
      lastInitialized: new Date().toISOString()
    });

    this.refresh();
  },
  watch: {
    search: function(newVal) {
      console.log(`search: ${newVal}`);

      // Update context when search term changes
      this.updateContext({
        view: 'groups',
        action: 'search',
        searchTerm: newVal,
        isSearching: newVal.length > 0
      });
    }
  }
};

export default page;
</script>
