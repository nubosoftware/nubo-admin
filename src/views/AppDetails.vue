<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title>{{ details.appname }}</v-toolbar-title>

      <v-spacer></v-spacer>



      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="details"> {{ $t("Details") }} </v-tab>
          <v-tab key="profiles"> {{ $t("Profiles") }} </v-tab>
          <v-tab key="groups"> {{ $t("Groups") }} </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="details">
        <v-card flat class="ma-0" color="bg">
          <v-list-item three-line>
            <v-list-item-avatar tile size="80">
              <v-img :src="details.imageurl"></v-img>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1">
                {{ details.appname }}
              </v-list-item-title>
              <v-list-item-subtitle
                >{{ $t("App ID") }}: {{ details.packagename }}<br />
                {{ $t("Profiles") }}: {{ totalNumOfUsers }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
        <v-card flat class="ma-0" color="bg">
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('App Name')"
                    v-model="details.appname"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Summary')"
                    v-model="details.summary"
                  />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Categories')"
                    :placeholder="$t('Seperate names by comma')"
                    v-model="details.categories"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    :label="$t('Description')"
                    v-model="details.description"
                  />
                </v-col>
              </v-row>
              <v-row v-if="details.base_image_app == 1">
                <v-col cols="12" sm="6" md="3">
                  <v-checkbox
                    v-model="details.base_image_app"
                    readonly
                    column
                    class="mx-4 my-0"
                    :label="$t('App included in base image')"
                  ></v-checkbox>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Version Name')"
                    v-model="details.versionname"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Version Code')"
                    v-model="details.versioncode"
                    readonly
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-select
                        :items="renderingItems"
                        :label="$t('Rendering Mode')"
                         :rules="requiredRules"
                        v-model="details.displayprotocol"
                      ></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    v-if="appData.checkPermission('/apps','w')"
                    color="primary"
                    class="mr-4"
                    @click="saveDetails"
                    v-bind:loading="saveLoading"
                  >
                    Save
                  </v-btn>
                </v-col>
              </v-row>
            </v-container></v-form
          >
        </v-card>
      </v-tab-item>
      <v-tab-item key="profiles">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{$t("Profiles")}}</v-card-title>
          <v-data-table
            :headers="headers"
            :items="rows"
            :loading="loading"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn v-if="appData.checkPermission('/apps','i')" color="primary" dark class="mb-2" @click="addProfile">
                  {{ $t("Assign Profiles to App") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon v-if="appData.checkPermission('/apps','i')" small @click="deleteProfile(item)" class="mx-2">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
          <v-dialog v-model="dialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Profiles") }}
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="search"
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
                class="elevation-1 ma-4 bg"
                :server-items-length="totalItems"
                :items-per-page="5"
                :options.sync="options"
                :search="search"
                show-select
                multi-sort
                @update:options="updateOptions"
                @click:row="rowClick"
              >
                <template v-slot:[`header.data-table-select`]> &nbsp; </template>
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
        </v-card>
      </v-tab-item>

      <v-tab-item key="groups">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{ $t("Groups") }}</v-card-title>
          <v-data-table
            :headers="groupHeaders"
            :items="groupRows"
            :loading="groupLoading"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn v-if="appData.checkPermission('/apps','i')" color="primary" dark class="mb-2" @click="addGroup">
                  {{ $t("Add Groups") }}
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:[`item.adDomain`]="{ item }">
              <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
              <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
              <div v-else>{{$t("Active Directory")}}</div>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon v-if="appData.checkPermission('/apps','i')" small @click="deleteGroup(item)" class="mx-2">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
          <v-dialog v-model="groupDialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Groups") }}
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="groupSearch"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                ></v-text-field>
              </v-card-title>
              <v-data-table
                :headers="allGroupsHeaders"
                :items="allGroupsRows"
                :loading="allGroupsLoading"
                class="elevation-1 ma-4 bg"
                :search="groupSearch"
                @click:row="groupClick"
              >
              <template v-slot:[`item.adDomain`]="{ item }">
              <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
              <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
              <div v-else>{{$t("Active Directory")}}</div>
            </template>
              </v-data-table>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-dialog v-model="dialogInstall" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Add App") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to add app to the selected profiles",{addItemLabel: addItemLabel})
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="cancelInstall">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn color="primary" @click="installApp">{{
            $t("Install App")
          }}</v-btn>
          <v-btn color="secondary" @click="addToAppstore">{{
            $t("Add to Appstore")
          }}</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDelete" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Remove App") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove app from", {
            name: deleteItemName,
          })
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="cancelUninstall">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn color="primary" @click="uninstallApp">{{
            $t("Uninstall App")
          }}</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="info" text v-bind="attrs" @click="snackbarSave = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

let page = {
  name: "AppDetails",
  components: {
    //HelloWorld
  },
  mixins: [contextUpdater],
  data: () => ({
    details: {},
    totalNumOfUsers: 0,
    tab: {},
    headers: [],
    rows: [],
    dialog: false,
    profilesHeaders: [],
    profilesRows: [],
    profilesLoading: true,
    search: "",
    profilesSelected: [],
    allSelected: {},
    addSelectedDisabled: true,
    addSelectedLoading: false,
    dialogInstall: false,
    addItemLabel: "",
    groupHeaders: [],
    groupRows: [],
    groupLoading: false,
    groupSearch: "",
    groupDialog: false,
    allGroupsHeaders: [],
    allGroupsRows: [],
    allGroupsLoading: false,
    allGroupSelected: {},
    totalItems: 0,
    loading: true,
    options: {},
    appData,
    saveLoading: false,
    snackbarSave: false,
    snackbarText: "",
    moment: moment,
    dialogDelete: false,
    deleteProfileItem: {},
    deleteItemType: "",
    deleteItemName: "",
  }),
  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`,this,['options','search']);
    },
    updateOptions: function () {
      console.log("updateOptions");
      this.savePage();
      this.refreshProfiles();
    },
    rowClick: function () {
      console.log("rowClick");
    },
    deleteProfile: function (item) {
      this.deleteProfileItem = item;
      this.deleteItemType = "profile";
      this.deleteItemName = `${item.firstname} ${item.lastname}`;
      this.dialogDelete = true;
    },
    deleteGroup: function (item) {
      this.deleteProfileItem = item;
      this.deleteItemType = "group";
      this.deleteItemName = item.groupName;
      this.dialogDelete = true;
    },
    uninstallApp: function () {
      console.log(this.deleteProfileItem);
      this.dialogDelete = false;
      let data;

      // Update context before uninstalling
      this.updateContext({
        view: 'uninstalling_app',
        action: 'uninstall',
        appDetails: {
          packageName: this.$route.params.packageName,
          appName: this.details.appname
        },
        target: {
          type: this.deleteItemType,
          name: this.deleteItemName,
          details: this.deleteProfileItem
        }
      });

      if (this.deleteItemType == "profile") {
        data = {
          email: this.deleteProfileItem.email,
        };
      } else {
        data = {
          groupName: this.deleteProfileItem.groupName,
          adDomain: this.deleteProfileItem.adDomain,
        };
      }
      appUtils
        .post({
          url: `api/apps/${encodeURIComponent(
            this.$route.params.packageName
          )}/uninstall`,
          data: data,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.snackbarText = this.$t("App uninstaled");
            this.snackbarSave = true;

            // Update context after successful uninstall
            this.updateContext({
              view: 'app_uninstalled',
              action: 'uninstall_complete',
              status: 'success',
              appDetails: {
                packageName: this.$route.params.packageName,
                appName: this.details.appname
              },
              target: {
                type: this.deleteItemType,
                name: this.deleteItemName
              }
            });

            this.loadDetails();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;

            // Update context after failed uninstall
            this.updateContext({
              view: 'uninstall_error',
              action: 'uninstall_failed',
              status: 'error',
              appDetails: {
                packageName: this.$route.params.packageName,
                appName: this.details.appname
              },
              target: {
                type: this.deleteItemType,
                name: this.deleteItemName
              }
            });
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {});
    },
    cancelUninstall: function () {
      this.dialogDelete = false;
    },

    loadDetails: function () {
      // if (this.refreshTimeout) {
      //     clearTimeout(this.refreshTimeout);
      //     this.refreshTimeout = null;
      // }
      appUtils
        .get({
          url:
            "api/apps/" + encodeURIComponent(this.$route.params.packageName),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("loadDetails: Success");
            this.details = response.data.appDetails;
            this.totalNumOfUsers = response.data.totalNumOfUsers;
            this.rows = response.data.emails;
            this.renderingItems = [
              { text: this.$t("Auto-detect"), value: 0 },
              { text: this.$t("Server Rendering"), value: 1 },
              { text: this.$t("Client Rendering"), value: 2 },
              { text: this.$t("Server Rendering for iOS only"), value: 3 },
            ];
            this.headers = [
              {
                text: this.$t("Last Name"),
                value: "lastname",
              },
              { text: this.$t("First Name"), value: "firstname" },
              { text: this.$t("Email"), value: "email" },
              { text: "Actions", value: "actions", sortable: false },
            ];
            this.loading = false;
            this.groupLoading = false;
            this.groupRows = response.data.groups;
            this.groupHeaders = [
              {
                text: this.$t("Group Name"),
                value: "groupName",
              },
              { text: this.$t("Group Type"), value: "adDomain" },
              { text: "Actions", value: "actions", sortable: false },
            ];
            let bcItems = [
              {
                text: appData.productName,
                to: "/",
                disabled: false,
              },
              {
                text: this.$t("Apps"),
                to: "/Apps",
                disabled: false,
              },
              {
                text: this.details.appname,
                to: "/App/" + this.$route.params.packageName,
                disabled: false,
              },
            ];
            this.$emit("updatePage", bcItems);

            // Update context with app details
            this.updateContext({
              view: 'app_details',
              tab: this.tab,
              appDetails: {
                packageName: this.details.packagename,
                appName: this.details.appname,
                summary: this.details.summary,
                description: this.details.description,
                categories: this.details.categories,
                versionName: this.details.versionname,
                versionCode: this.details.versioncode,
                displayProtocol: this.details.displayprotocol,
                baseImageApp: this.details.base_image_app === 1,
                imageUrl: this.details.imageurl
              },
              profiles: {
                count: this.totalNumOfUsers,
                items: this.rows
              },
              groups: {
                count: this.groupRows.length,
                items: this.groupRows
              },
              lastUpdated: new Date().toISOString()
            });

            // this.refreshTimeout = setTimeout(this.loadDetails,5000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    saveDetails: function () {
      this.saveLoading = true;

      // Update context before saving
      this.updateContext({
        view: 'saving_app_details',
        action: 'save',
        appDetails: {
          packageName: this.details.packagename,
          appName: this.details.appname,
          summary: this.details.summary,
          description: this.details.description,
          categories: this.details.categories,
          displayProtocol: this.details.displayprotocol
        }
      });

      appUtils
        .post({
          url:
            "api/apps/" + encodeURIComponent(this.$route.params.packageName),
          data: {
            appName: this.details.appname,
            appDescription: this.details.description,
            appSummary: this.details.summary,
            appCategories: this.details.categories,
            displayprotocol: ""+this.details.displayprotocol,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.saveLoading = false;
            this.snackbarText = "Saved";
            this.snackbarSave = true;

            // Update context after saving
            this.updateContext({
              view: 'app_details_saved',
              action: 'save_completed',
              status: 'success',
              appDetails: {
                packageName: this.details.packagename,
                appName: this.details.appname
              }
            });

            this.loadDetails();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;

            // Update context after save error
            this.updateContext({
              view: 'app_details_save_error',
              action: 'save_failed',
              status: 'error',
              appDetails: {
                packageName: this.details.packagename
              }
            });
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.saveLoading = false));
    },
    addGroup: function () {
      this.groupDialog = true;
      this.loadAllGroups();
    },
    loadAllGroups: function () {
      this.allGroupsLoading = true;
      this.allGroupsHeaders = [

        {
          text: this.$t("Group Name"),
          value: "groupName",
        },
        { text: this.$t("Group Type"), value: "adDomain" },
      ];
      appUtils
        .get({
          url: "api/groups",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.allGroupsRows = response.data.groups;
            this.allGroupsLoading = false;
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    groupClick: function(item) {
      console.log(`groupClick: ${item.groupName}`);
      this.dialogInstall = true;
      this.allSelected = [];
      this.allGroupSelected = item;
      this.addItemLabel = this.$t("selected group",{groupName: item.groupName});
    },
    addProfile: function () {
      this.dialog = true;
      this.allSelected = [];
      this.addSelectedDisabled = true;
      //this.refreshProfiles();
    },
    addSelected: function () {
      console.log("addSelected");
      this.dialogInstall = true;
      this.allGroupSelected = {};
      this.addItemLabel = this.$t("selected profiles");
    },
    cancelInstall: function () {
      this.dialogInstall = false;
    },
    installApp: function () {
      this.dialogInstall = false;

      // Update context before installing app
      this.updateContext({
        view: 'installing_app',
        action: 'install',
        appDetails: {
          packageName: this.$route.params.packageName,
          appName: this.details.appname
        },
        targets: this.allGroupSelected.groupName ?
          { groupName: this.allGroupSelected.groupName } :
          { profileCount: Object.keys(this.allSelected).length }
      });

      this.installImp(0);
    },
    addToAppstore: function () {
      this.dialogInstall = false;
      this.installImp(1);
    },
    installImp: function (appStoreOnly) {
      let emails = [];
      for (const [key] of Object.entries(this.allSelected)) {
        emails.push(key);
      }
      let data;
      console.log("Install Apps: " + emails);
      if (emails.length == 0 && this.allGroupSelected.groupName) {
        data = {
          groupName: [this.allGroupSelected.groupName],
          adDomain: [this.allGroupSelected.adDomain],
          privateApp: "0",
          appStoreOnly: appStoreOnly,
        }
      } else {
        data = {
            email: emails,
            privateApp: "1",
            appStoreOnly: appStoreOnly,
          }
      }
      this.addSelectedLoading = true;
      appUtils
        .post({
          url: `api/apps/${encodeURIComponent(
            this.$route.params.packageName
          )}/install`,
          data: data,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 || response.data.status == 2) {
            this.addSelectedLoading = false;
            this.snackbarText = this.$t("Added");
            this.snackbarSave = true;
            this.loadDetails();
            this.dialog = false;
            this.groupDialog = false;
          } else {
            console.log(`status: ${response.data.status}`);
            this.addSelectedLoading = false;
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
            this.dialog = false;
            this.groupDialog = false;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refreshProfiles: function () {
      this.profilesLoading = true;
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;

      // Update context before refreshing profiles
      this.updateContext({
        view: 'loading_profiles',
        search: this.search,
        pagination: {
          page: this.options.page,
          limit: limit,
          offset: offset
        }
      });

      appUtils
        .post({
          url: "api/profiles",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
          },
        })
        .then((response) => {
          this.profilesLoading = false;
          console.log(response.data);
          if (response.data.status == 1) {
            this.profilesRows = response.data.profiles;
            this.totalItems = response.data.totalItems;
            let newSelected = [];
            this.profilesRows.forEach((element) => {
              if (this.allSelected[element.email]) {
                newSelected.push(element);
              }
            });
            this.profilesSelected = newSelected;

            // Update context after loading profiles
            this.updateContext({
              view: 'profiles_loaded',
              search: this.search,
              profiles: {
                total: this.totalItems,
                displayed: this.profilesRows.length,
                selected: Object.keys(this.allSelected).length
              }
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function () {
    let bcItems = [
      {
        text: appData.productName,
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Apps"),
        to: "/Apps",
        disabled: false,
      },
      {
        text: this.$route.params.packageName,
        to: "/App/" + this.$route.params.packageName,
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    //
    this.profilesHeaders = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];
    appUtils.loadPageData(page.name,this);

    // Initialize context
    this.updateContext({
      view: 'initializing',
      component: 'AppDetails',
      packageName: this.$route.params.packageName,
      loadingState: 'starting'
    });

    this.loadDetails();
  },

  beforeDestroy: function () {
    console.log('lifecycle: beforeDestroy');
    // if (this.refreshTimeout) {
    //       clearTimeout(this.refreshTimeout);
    //       this.refreshTimeout = null;
    // }
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);

      // Update context when tab changes
      this.updateContext({
        view: 'app_details',
        tab: newVal,
        appDetails: {
          packageName: this.details.packagename,
          appName: this.details.appname
        }
      });
    },
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      this.savePage();
      if (newVal.length > 1 || newVal.length == 0) {
        this.refreshProfiles();
      }
    },
    profilesSelected: function (arr) {
      console.log(`profilesSelected: ${JSON.stringify(arr, null, 2)}`);
      let addKeys = {};
      arr.forEach((element) => {
        addKeys[element.email] = element.email;
        //console.log(`Add ${element.email}`);
      });
      Object.assign(this.allSelected, addKeys);
      this.profilesRows.forEach((element) => {
        if (!addKeys[element.email]) {
          //delKeys[element.email] = element.email;
          delete this.allSelected[element.email];
          //console.log(`Remove ${element.email}`);
        }
      });
      if (Object.keys(this.allSelected).length > 0) {
        this.addSelectedDisabled = false;
      } else {
        this.addSelectedDisabled = true;
      }
      //console.log("addSelectedDisabled: "+this.addSelectedDisabled);

      //console.log("allSelected: "+JSON.stringify(this.allSelected,null,2));
    },
  },
};

export default page;
</script>
