<template>
  <v-card color="bg">
    <v-card-title>
      <v-text-field
        v-model="groupName"
        :label="$t('Group Name')"
        :readonly="!newgroup"
        :rules="[checkGroupName]"
      ></v-text-field>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"


      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="10"
      :loading="loading"
      :search="search"
      class="ma-4 bg"
      multi-sort
      show-select
      item-key="email"
      v-model="selected"
      @click:row="rowClick"
    >
      <template v-slot:top>
        <v-toolbar flat color="bg">
          <v-btn
            v-if="appData.checkPermission('/groups','w')"
            class="ma-4"
            color="primary" :disabled="readonly || groupName == '' || checkGroupName(groupName) !== true" @click="openAddProfiles">{{
            $t("Add Profiles")
          }}</v-btn>
          <v-btn
            v-if="appData.checkPermission('/groups','w')"
            color="primary"
            class="ma-4"
            @click="dialogDelete = true"
            :disabled="removeSelectedDisable || readonly"
            >{{ $t("Remove Selected Profiles") }}</v-btn
          >
        </v-toolbar>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" max-width="800px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>
          {{ $t("Add Profiles") }}
          <v-spacer></v-spacer>
          <v-text-field
            v-model="searchProfiles"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        <v-data-table
          v-model="profilesSelected"
          :headers="profilesHeaders"
          :items="profilesRows"
          :loading="profilesLoading"
          class="ma-4 bg"
          :server-items-length="totalItems"
          :items-per-page="5"
          :options.sync="options"
          :search="searchProfiles"
          show-select
          multi-sort
          item-key="email"
          @update:options="updateOptions"
        >
          <template v-slot:[`header.data-table-select`]> &nbsp; </template>
          <template v-slot:[`item.data-table-select`]="{ isSelected, select, item }">
            <v-simple-checkbox :disabled="!isItemExists(item)" :value="isSelected" @input="select($event)"></v-simple-checkbox>
          </template>
          <template v-slot:top>
            <v-toolbar flat color="bg">
              <v-btn
                color="primary"
                class="mb-2"
                @click="addSelected"
                v-bind:disabled="addSelectedDisabled"
                v-bind:loading="addSelectedLoading"
              >
                {{ $t("Assign Selected Profiles") }}
              </v-btn>
            </v-toolbar>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDelete" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Remove Selected Profiles") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove the selected profiles?")
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="dialogDelete = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            @click="dialogDelete = false | removeProfiles(selected)"
            >{{ $t("Remove Profiles") }}</v-btn
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
  name: "Group",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    groupName: {},
    adDomain: {},
    appData,
    groupParam: "",
    selected: [],
    removeSelectedDisable: true,
    dialogDelete: false,
    // add profiles dialog
    dialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    profilesSelected: [],
    searchProfiles: "",
    addSelectedDisabled: true,
    addSelectedLoading: false,
    readonly: false,
    newgroup: true,
    snackbarSave: false,
    snackbarText: "",
    groupNames: {},
    pageContext: {}, // Store context data for the Group page
  }),
  methods: {
    // Add updateContext method to maintain context within the Group page
    updateContext: function(contextData) {
      // Preserve existing page context while adding new data
      this.pageContext = {
        ...this.pageContext,
        ...contextData
      };

      // Always include the full pageContext when updating app state
      this.$emit('updateAppState', {
        componentName: this.$options.name || 'Group',
        timestamp: new Date().toISOString(),
        ...this.pageContext
      });
    },

    openAddProfiles: function() {
      console.log("openAddProfiles");
      this.dialog = true;
      this.profilesSelected = [];

      // Update context when opening the add profiles dialog
      this.updateContext({
        view: 'group_details',
        action: 'open_add_profiles',
        groupName: this.groupName,
        adDomain: this.adDomain,
        isNewGroup: this.newgroup
      });

      this.refreshProfiles();
    },

    addSelected: function() {
      this.addSelectedLoading = true;

      // Update context when adding selected profiles
      this.updateContext({
        view: 'group_details',
        action: 'add_profiles',
        groupName: this.groupName,
        adDomain: this.adDomain,
        selectedProfiles: this.profilesSelected.map(profile => ({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName
        })),
        profileCount: this.profilesSelected.length
      });

      this.addProfiles(this.profilesSelected);
    },

    refreshProfiles: function() {
      console.log(`refreshProfiles. search: ${this.searchProfiles}`);
      this.profilesLoading = true;

      // Update context when refreshing available profiles
      this.updateContext({
        view: 'group_details',
        action: 'refresh_available_profiles',
        loading: true,
        searchTerm: this.searchProfiles,
        options: this.options
      });

      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      appUtils
        .post({
          url: "api/profiles",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.searchProfiles,
          },
        })
        .then((response) => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.totalItems = response.data.totalItems;

            // Update context with profiles data
            this.updateContext({
              view: 'group_details',
              action: 'available_profiles_loaded',
              loading: false,
              availableProfilesData: {
                count: this.totalItems,
                displayed: this.profilesRows.length,
                search: this.searchProfiles
              }
            });

            /*let newSelected = [];
            this.profilesRows.forEach((element) => {
              if (this.allSelected[element.email]) {
                newSelected.push(element);
              }
            });
            this.profilesSelected = newSelected;*/
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'group_details',
              action: 'available_profiles_error',
              loading: false,
              error: `Failed to load available profiles (status: ${response.data.status})`
            });

            //this.$router.push("/Login");
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'group_details',
            action: 'available_profiles_error',
            loading: false,
            error: `Error loading available profiles: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    isItemExists: function(item) {
      if (!this.emailMap[item.email]) {
        return true;
      } else {
        return false;
      }
    },

    updateOptions(options) {
      console.log("update:options", options);

      // Update context when options change
      this.updateContext({
        view: 'group_details',
        action: 'update_options',
        options: options
      });

      this.refreshProfiles();
    },

    rowClick: function(val) {
      console.log(`rowClick: ${val.email}`);

      // Update context when clicking on a profile
      this.updateContext({
        view: 'group_details',
        action: 'select_profile',
        groupName: this.groupName,
        adDomain: this.adDomain,
        selectedProfile: {
          email: val.email,
          firstName: val.firstName,
          lastName: val.lastName
        }
      });

      this.$router.push("/Profile/" + val.email);
    },

    refresh: function() {
      console.log(`groupParam: ${this.groupParam}`);

      // Update context when refreshing group members
      this.updateContext({
        view: 'group_details',
        action: 'refresh_group_members',
        loading: true,
        groupName: this.groupName,
        adDomain: this.adDomain,
        groupParam: this.groupParam,
        isNewGroup: this.newgroup
      });

      appUtils
        .get({
          url: "api/groups/" + encodeURIComponent(this.groupParam),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
            this.emailMap = {};
            this.rows.forEach((element) => {
              this.emailMap[element.email] = 1;
            });

            // Update context with group members data
            this.updateContext({
              view: 'group_details',
              action: 'group_members_loaded',
              loading: false,
              groupData: {
                name: this.groupName,
                adDomain: this.adDomain,
                type: this.adDomain === '' ? 'Manual' :
                      this.groupName === 'All' ? 'Automatic' : 'Active Directory',
                isNewGroup: this.newgroup,
                isReadOnly: this.readonly,
                memberCount: this.rows.length,
                members: this.rows.map(profile => ({
                  email: profile.email,
                  firstName: profile.firstName,
                  lastName: profile.lastName
                }))
              }
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'group_details',
              action: 'group_members_error',
              loading: false,
              error: `Failed to load group members (status: ${response.data.status})`
            });

            this.$router.push("/Login");
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'group_details',
            action: 'group_members_error',
            loading: false,
            error: `Error loading group members: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    loadGroupNames: function () {
      // Update context when loading group names
      this.updateContext({
        view: 'group_details',
        action: 'load_group_names',
        loading: true
      });

      appUtils
        .get({
          url: "api/groups"
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            response.data.groups.forEach((item) => {
              this.groupNames[item.groupName] = "1";
            });

            // Update context with group names data
            this.updateContext({
              view: 'group_details',
              action: 'group_names_loaded',
              loading: false,
              existingGroups: Object.keys(this.groupNames)
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'group_details',
              action: 'group_names_error',
              loading: false,
              error: `Failed to load group names (status: ${response.data.status})`
            });
          }
        })
        .catch(error => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'group_details',
            action: 'group_names_error',
            loading: false,
            error: `Error loading group names: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    addProfiles: function(items) {
      if (!Array.isArray(items)) {
        items = [items];
      }
      //let emailParams = "";
      let emails = [];
      items.forEach((item) => {
        let email;
        if (typeof item === "string") {
          email = item;
        } else {
          email = item.email;
        }
        //emailParams += "&email=" + encodeURIComponent(email);
        emails.push(email);
      });
      console.log(`addProfiles: ${emails}`);

      let method;
      let cmd;
      if (this.newgroup) {
        method = "put";
        cmd = "";
        this.groupParam = this.groupName;
      } else {
        method = "post";
        cmd = "addProfiles";
      }

      // Update context when adding profiles
      this.updateContext({
        view: 'group_details',
        action: this.newgroup ? 'create_group_with_profiles' : 'add_profiles_to_group',
        loading: true,
        groupName: this.groupName,
        adDomain: this.adDomain,
        profileCount: emails.length,
        isNewGroup: this.newgroup
      });

      appUtils
        .req({
          method: method,
          url: `api/groups/${encodeURIComponent(
            this.groupParam
          )}/${cmd}`,
          data: {
            email: emails
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 ) {
            console.log(`status: ${response.data.status}`);
            this.addSelectedLoading = false;
            this.dialog = false;
            if (this.newgroup) {
              this.newgroup = false;
              this.updatePageHead();
              this.snackbarText = this.$t("Group Added");

              // Update context with group creation success
              this.updateContext({
                view: 'group_details',
                action: 'group_created',
                loading: false,
                groupData: {
                  name: this.groupName,
                  adDomain: this.adDomain,
                  type: 'Manual',
                  profilesAdded: emails.length
                }
              });
            } else {
              this.snackbarText = this.$t("Profiles Added");

              // Update context with profiles added success
              this.updateContext({
                view: 'group_details',
                action: 'profiles_added',
                loading: false,
                profilesAdded: emails.length
              });
            }
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.addSelectedLoading = false;
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'group_details',
              action: this.newgroup ? 'group_creation_error' : 'add_profiles_error',
              loading: false,
              error: `Error: ${response.data.message}`
            });

            //this.$router.push("/Login");
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'group_details',
            action: this.newgroup ? 'group_creation_error' : 'add_profiles_error',
            loading: false,
            error: `Error: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    removeProfiles: function(items) {
      if (!Array.isArray(items)) {
        items = [items];
      }
      let emailParams = "";
      let emails = [];

      items.forEach((item) => {
        let email;
        if (typeof item === "string") {
          email = item;
        } else {
          email = item.email;
        }
        emailParams += "&email=" + encodeURIComponent(email);
        emails.push(email);
      });

      // Update context when removing profiles
      this.updateContext({
        view: 'group_details',
        action: 'remove_profiles',
        loading: true,
        groupName: this.groupName,
        adDomain: this.adDomain,
        profilesBeingRemoved: emails.length,
        emails: emails
      });

      appUtils
        .get({
          url: `api/groups/${encodeURIComponent(
            this.groupParam
          )}/removeProfiles?${emailParams}`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 ) {
            console.log(`status: ${response.data.status}`);

            // Update context with profiles removed success
            this.updateContext({
              view: 'group_details',
              action: 'profiles_removed',
              loading: false,
              profilesRemoved: emails.length
            });

            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with profiles removal error
            this.updateContext({
              view: 'group_details',
              action: 'remove_profiles_error',
              loading: false,
              error: `Failed with status ${response.data.status}`
            });

            //this.$router.push("/Login");
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with profiles removal error
          this.updateContext({
            view: 'group_details',
            action: 'remove_profiles_error',
            loading: false,
            error: `Error: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    updatePageHead: function() {
      let bcItems = [
        {
          text: appData.productName,
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Groups"),
          to: "/Groups",
          disabled: false,
        },
        {
          text: (this.newgroup ? this.$t("New Group") : this.groupName),
          to: "/Group/" + this.groupName + "/" + this.adDomain,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },

    checkGroupName: function(name) {
      if (!name || name == "") {
        return this.$t(`Enter group name`);
      } else if (this.groupNames[name]) {
        return this.$t(`Group name already exists`);
      } else {
        return true;
      }
    }
  },
  created: function() {
    this.groupName = this.$route.params.groupName;
    if (this.groupName == "All") {
      this.readonly = true;
    } else {
      this.readonly = false;
    }
    if (!this.groupName) {
      this.groupName = "";
    }
    if (this.groupName == "") {
      this.newgroup = true;
      this.adDomain = ""
      this.loadGroupNames();
    } else {
      this.newgroup = false;
      this.adDomain = this.$route.params.adDomain ? this.$route.params.adDomain : "";
    }

    if (this.adDomain && this.adDomain != "") {
      this.groupParam = `${this.groupName}#${this.adDomain}`;
    } else {
      this.groupParam = this.groupName;
    }

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Group',
      groupName: this.groupName,
      adDomain: this.adDomain,
      groupParam: this.groupParam,
      isNewGroup: this.newgroup,
      isReadOnly: this.readonly,
      type: this.adDomain === '' ? 'Manual' :
            this.groupName === 'All' ? 'Automatic' : 'Active Directory',
      permissions: {
        canModify: appData.checkPermission('/groups','w') && !this.readonly
      },
      lastInitialized: new Date().toISOString()
    });

    this.updatePageHead();
    this.headers = [
      {
        text: this.$t("First Name"),
        value: "firstName",
      },
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      {
        text: this.$t("Email"),
        value: "email",
      },
    ];
    this.profilesHeaders = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];
    this.refresh();
  },
  watch: {
    selected: function(newVal) {
      console.log(`selected: ${JSON.stringify(newVal, null, 2)}`);
      this.removeSelectedDisable = newVal.length == 0;

      // Update context when selection changes
      this.updateContext({
        view: 'group_details',
        action: 'selection_changed',
        selectedProfiles: newVal.map(profile => ({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName
        })),
        selectedCount: newVal.length,
        canRemove: newVal.length > 0 && !this.readonly
      });
    },

    profilesSelected: function(newVal) {
      console.log(`profilesSelected: ${JSON.stringify(newVal, null, 2)}`);
      this.addSelectedDisabled = newVal.length == 0;

      // Update context when profiles selection changes
      this.updateContext({
        view: 'group_details',
        action: 'profiles_selection_changed',
        selectedProfilesToAdd: newVal.map(profile => ({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName
        })),
        selectedCount: newVal.length,
        canAdd: newVal.length > 0
      });
    },

    searchProfiles: function(newVal) {
      console.log(`searchProfiles: ${JSON.stringify(newVal, null, 2)}`);

      // Update context when search term changes
      this.updateContext({
        view: 'group_details',
        action: 'search_profiles',
        searchTerm: newVal
      });

      this.refreshProfiles();
    },

    search: function(newVal) {
      // Update context when group members search term changes
      this.updateContext({
        view: 'group_details',
        action: 'search_members',
        searchTerm: newVal
      });
    },

    groupName: function(newVal) {
      // Update context when group name changes (for new groups)
      if (this.newgroup) {
        this.updateContext({
          view: 'group_details',
          action: 'name_changed',
          groupName: newVal,
          isValid: this.checkGroupName(newVal) === true
        });
      }
    }
  },
};

export default page;
</script>
