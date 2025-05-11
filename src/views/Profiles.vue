<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title> {{ $t("Profiles") }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="list"> {{ $t("Profile List") }} </v-tab>
          <v-tab key="online"> {{ $t("Online Profiles") }} </v-tab>
          <v-tab key="approvals"> {{ $t("Approvals") }} </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="list" class="bg">
        <v-data-table
          color="bg"
          :headers="headers"
          :items="rows"
          :server-items-length="totalItems"
          :items-per-page="5"
          :loading="loading"
          :options.sync="options"
          :search="search"
          :footer-props="{
            'items-per-page-options': [10, 25, 50, 100, 1000]
          }"
          class="ma-4 bg"
          multi-sort
          @update:options="updateOptions"
          @click:row="rowClick"
        >
          <template v-slot:top>
            <v-toolbar flat color="bg">
              <v-btn
                v-if="appData.checkPermission('/profiles','w')"
                class="ma-4"
                color="primary"
                @click="$router.push('/Profile/')"
                >{{ $t("New Profile") }}</v-btn
              >
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

          <template #[`item.isActive`]="{ item }">
            {{ item.isActive === 1 ? $t('Yes') : $t('No') }}
          </template>
        </v-data-table>
      </v-tab-item>
       <v-tab-item key="online" class="bg">
         <v-data-table
            :headers="onlineHeads"
            :items="onlineRows"
            :items-per-page="10"
            :loading="onlineLoad"
            :expanded.sync="onlineExpanded"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100]
            }"
            item-key="email"
            show-expand
            @click:row="rowClick"
            :options.sync="onlineOptions"
            @update:options="updateOnlineOptions"
            class="elevation-1 ma-4 bg"
          >
          <template v-slot:expanded-item="{ headers, item }">
            <td :colspan="headers.length">
              <v-data-table
                :headers="devicesHeads"
                :items="item.user_devices"
                :items-per-page="10"
                class="ma-4 bg"

              >
              </v-data-table>
            </td>
          </template>
         </v-data-table>
       </v-tab-item>

       <v-tab-item key="approvals" class="bg">
         <v-data-table
            :headers="approvalHeads"
            :items="approvalRows"
            :items-per-page="10"
            :loading="approvalLoad"
            :expanded.sync="approvalsExpanded"
            group-by="Profile"
            show-expand
            show-select
            item-key="item_key"
            v-model="selectedApprovals"
            :options.sync="approvalOptions"
            @update:options="updateApprovalOptions"
            class="elevation-1 ma-4 bg"
          >
          <template v-slot:top>
            <v-toolbar  v-if="selectedApprovals.length > 0" flat color="bg">
              <v-btn
                v-if="appData.checkPermission('/profiles','w')"
                class="ma-4"
                color="success"  @click="approveSelected(true)">{{
                $t("Approve Selected")
              }}</v-btn>
              <v-btn
                v-if="appData.checkPermission('/profiles','w')"
                color="error"
                class="ma-4"
                @click="approveSelected(false)"
                >{{ $t("Disapprove Selected") }}</v-btn
              >
            </v-toolbar>
          </template>

          <template #[`group.header`]="{ isOpen, toggle, group,headers }">
             <td :colspan="headers.length" class="accent">
            <v-btn @click="toggle" icon>
              <v-icon>
                {{ isOpen ? '$minus' : '$plus' }}
              </v-icon>
            </v-btn>
            {{group}}
             </td>
          </template>
          <template v-slot:expanded-item="{ headers, item }">
            <td :colspan="headers.length">
              {{$t("Device ID")}}: {{item.deviceid}}
            </td>
          </template>
          <template v-slot:[`item.approvalType`]="{ item }">
            <v-chip v-if="item.approvalType == 'activate'">{{$t('Activate Device')}}</v-chip>
            <v-chip v-if="item.approvalType == 'unlock passcode'">{{$t('Unlock Device')}}</v-chip>
            <v-chip v-if="item.approvalType == 'reset passcode'">{{$t('Reset Password')}}</v-chip>
            <v-chip v-if="item.approvalType == 'reset biometric'">{{$t('Reset Biometric Key')}}</v-chip>
            <v-chip v-if="item.approvalType == 'admin'">{{$t('Activate Control Panel')}}</v-chip>
            <v-chip v-if="item.approvalType == 'admin reset'">{{$t('Reset Admin Password')}}</v-chip>
            <v-chip v-if="item.approvalType == 'unlock admin'">{{$t('Unlock Admin')}}</v-chip>
            <v-chip v-if="item.approvalType == 'reset otp'">{{$t('Reset OTP Code')}}</v-chip>
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-icon  v-if="appData.checkPermission('/profiles','w')" @click="approveItem(item,true)" color="success" class="mx-2"> mdi-check-bold </v-icon>
            <v-icon  v-if="appData.checkPermission('/profiles','w')" @click="approveItem(item,false)" color="error" class="mx-2"> mdi-close-thick </v-icon>
          </template>
         </v-data-table>
       </v-tab-item>
    </v-tabs-items>
  </v-card>

  <!--<v-btn @click="refresh">Refresh</v-btn>-->
</template>


<style>
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "ProfilesPage",
  mixins: [],
  data: () => ({
    tab: {},
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    approvalLoad: false,
    approvalRows: [],
    approvalHeads: [],
    approvalsExpanded: [],
    approvalOptions: {},
    selectedApprovals: [],
    onlineLoad: false,
    onlineRows: [],
    onlineHeads: [],
    onlineExpanded: [],
    onlineOptions: {},
    devicesHeads: [],
    appData,
    pageContext: {},
  }),
  methods: {
    savePage: function () {
      //console.log(`options: ${JSON.stringify(this.options,null,2)}`);
      appUtils.savePageData(`${page.name}`,this,['options','search','approvalOptions','onlineOptions','tab']);
    },
    updateOptions() {
      //console.log("update:options", options);
      this.savePage();
      this.refresh();
    },
    updateOnlineOptions() {
      this.savePage();
    },
    updateApprovalOptions() {
      this.savePage();
    },
    rowClick: function (val) {
      console.log(`rowClick: ${val.email}`);

      // Update context before navigating
      this.updateContext({
        view: 'profiles',
        action: 'select_profile',
        selectedProfile: {
          email: val.email,
          firstName: val.firstName,
          lastName: val.lastName
        }
      });

      this.$router.push("/Profile/" + val.email);
    },

    approveSelected: function(approve) {
      console.log("approveSelected");

      // Update context for bulk approval action
      this.updateContext({
        view: 'profiles',
        tab: 'approvals',
        action: approve ? 'bulk_approve' : 'bulk_disapprove',
        count: this.selectedApprovals.length,
        itemsToApprove: this.selectedApprovals.map(item => ({
          email: item.email,
          deviceId: item.deviceid,
          approvalType: item.approvalType
        }))
      });

      this.selectedApprovals.forEach(item => {
        this.approveItem(item, approve);
      });
      this.selectedApprovals = [];
    },

    approveItem: function(item, approve) {
      // Update context for approval action
      this.updateContext({
        view: 'profiles',
        tab: 'approvals',
        action: approve ? 'approve' : 'disapprove',
        profile: item.Profile,
        email: item.email,
        deviceId: item.deviceid,
        approvalType: item.approvalType
      });

      let method;
      if (approve) {
        method = "put";
      } else {
        method = "delete";
      }
      appUtils
        .req({
          method,
          url: `api/approvals/${encodeURIComponent(item.email)}/${encodeURIComponent(item.deviceid)}/${encodeURIComponent(item.approvalType)}`,
        })
        .then((response) => {
          //console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            for( var i = 0; i < this.approvalRows.length; i++){
              if ( this.approvalRows[i].deviceid == item.deviceid && this.approvalRows[i].email == item.email) {
                this.approvalRows.splice(i, 1);
              }
            }

            // Update context with success
            this.updateContext({
              view: 'profiles',
              tab: 'approvals',
              action: approve ? 'approve_success' : 'disapprove_success',
              profile: item.Profile,
              email: item.email,
              deviceId: item.deviceid,
              approvalType: item.approvalType,
              remaining: this.approvalRows.length
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'profiles',
              tab: 'approvals',
              action: approve ? 'approve_error' : 'disapprove_error',
              profile: item.Profile,
              email: item.email,
              deviceId: item.deviceid,
              approvalType: item.approvalType,
              error: `Failed with status ${response.data.status}`
            });
          }
        }).catch((err) => {
          console.log(err);

          // Update context with error
          this.updateContext({
            view: 'profiles',
            tab: 'approvals',
            action: approve ? 'approve_error' : 'disapprove_error',
            profile: item.Profile,
            email: item.email,
            deviceId: item.deviceid,
            approvalType: item.approvalType,
            error: `Error: ${err}`
          });
        });
    },

    loadApprovals: function () {
      console.log("loadApprovals");

      // Update context with loading state
      this.updateContext({
        view: 'profiles',
        tab: 'approvals',
        loading: true
      });

      this.approvalLoad = true;
      appUtils
        .get({
          url: "api/approvals",
        })
        .then((response) => {
          //console.log(response.data);
          this.approvalLoad = false;
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            let rows = [];
            response.data.profiles.forEach(profile => {
              profile.devices.forEach(device => {
                rows.push({
                  Profile: `${profile.firstName} ${profile.lastName} <${profile.email}>`,
                  deviceid: device.deviceid,
                  devicetype: device.devicetype,
                  approvalType: device.type,
                  email: profile.email,
                  item_key: `${profile.email}_${device.deviceid}`
                })
              });
            });
            this.approvalRows = rows;
            this.approvalHeads = [

              { text: this.$t("Profile"), value: "Profile" },
              { text: this.$t("Device Type"), value: "devicetype" },
              { text: this.$t("Approval Type"), value: "approvalType" },
              { text: this.$t('Actions'), value: 'actions', sortable: false }
            ];

            // Update context with approval data
            this.updateContext({
              view: 'profiles',
              tab: 'approvals',
              loading: false,
              approvalData: {
                count: rows.length,
                profiles: response.data.profiles.map(profile => ({
                  name: `${profile.firstName} ${profile.lastName}`,
                  email: profile.email,
                  deviceCount: profile.devices.length
                })),
                approvalTypes: [...new Set(rows.map(row => row.approvalType))]
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'profiles',
              tab: 'approvals',
              loading: false,
              error: `Failed to load approvals (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'profiles',
            tab: 'approvals',
            loading: false,
            error: `Error loading approvals: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    loadOnline: function () {
      //console.log("loadOnline");

      // Update context with loading state
      this.updateContext({
        view: 'profiles',
        tab: 'online',
        loading: true
      });

      this.onlineLoad = true;
      appUtils
        .get({
          url: "api/onlineProfiles",
        })
        .then((response) => {
          //console.log(response.data);
          this.onlineLoad = false;
          if (response.data.status == 1) {
            //console.log(`status: ${response.data.status}`);


            this.onlineRows = response.data.profiles;
            this.onlineHeads = [
              { text: this.$t("Last Name"), value: "lastname",},
              { text: this.$t("First Name"), value: "firstname" },
              { text: this.$t("Email"), value: "email" },
            ];

            this.devicesHeads  = [
              { text: this.$t("Device Name"), value: "devicename",},
              { text: this.$t("Device ID"), value: "imei" },
              { text: this.$t("Gateway"), value: "gateway" },
              { text: this.$t("Platform"), value: "platform" },
              { text: this.$t("Local ID"), value: "localid" },

            ];

            // Update context with online profiles data
            this.updateContext({
              view: 'profiles',
              tab: 'online',
              loading: false,
              onlineData: {
                count: this.onlineRows.length,
                profiles: this.onlineRows.map(profile => ({
                  name: `${profile.firstname} ${profile.lastname}`,
                  email: profile.email,
                  deviceCount: profile.user_devices ? profile.user_devices.length : 0
                }))
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'profiles',
              tab: 'online',
              loading: false,
              error: `Failed to load online profiles (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'profiles',
            tab: 'online',
            loading: false,
            error: `Error loading online profiles: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    refresh: function () {
      // Update context with loading state
      this.updateContext({
        view: 'profiles',
        tab: 'list',
        loading: true,
        searchTerm: this.search,
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
            search: this.search,
          },
        })
        .then((response) => {
          //console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.profiles;
            this.totalItems = response.data.totalItems;

            // Update context with profiles data
            this.updateContext({
              view: 'profiles',
              tab: 'list',
              loading: false,
              profilesData: {
                count: this.totalItems,
                displayed: this.rows.length,
                search: this.search,
                page: this.options.page,
                itemsPerPage: this.options.itemsPerPage,
                activeProfiles: this.rows.filter(profile => profile.isActive === 1).length,
                inactiveProfiles: this.rows.filter(profile => profile.isActive !== 1).length,
                profiles: this.rows
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");

            // Update context with error
            this.updateContext({
              view: 'profiles',
              tab: 'list',
              loading: false,
              error: `Failed to load profiles (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'profiles',
            tab: 'list',
            loading: false,
            error: `Error loading profiles: ${error}`
          });
        })
        .finally(() => (this.loading = false));
    },

    updateContext: function(contextData) {
      // Preserve existing page context while adding new data
      this.pageContext = {
        ...this.pageContext,
        ...contextData
      };

      // Always include the full pageContext when updating app state
      this.$emit('updateAppState', {
        componentName: this.$options.name || 'ProfilesPage',
        timestamp: new Date().toISOString(),
        ...this.pageContext
      });
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
        text: this.$t("Profiles"),
        to: "/Profiles",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Profiles',
      permissions: {
        canCreate: appData.checkPermission('/profiles','w'),
        canApprove: appData.checkPermission('/profiles','w')
      },
      lastInitialized: new Date().toISOString()
    });

    this.headers = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
      { text: this.$t("Enabled"), value: 'isActive', sortable: true },
    ];
    appUtils.loadPageData(`${page.name}`,this);
    //this.refresh();
  },
  watch: {
    tab: function (newVal) {
      //console.log(`tab: ${newVal}`);
      this.savePage();

      // Update context when tab changes
      this.updateContext({
        view: 'profiles',
        tab: newVal === 0 ? 'list' : newVal === 1 ? 'online' : 'approvals',
        lastTabChange: new Date().toISOString()
      });

      if (newVal == 0) {
        this.refresh();
      } else if (newVal == 1) {
        this.loadOnline();
      } else if (newVal == 2) {
        this.loadApprovals();
      }
    },

    selectedApprovals: function (newVal) {
      console.log(`selectedApprovals: ${JSON.stringify(newVal)}`);

      // Update context when approvals selection changes
      this.updateContext({
        view: 'profiles',
        tab: 'approvals',
        selection: {
          count: newVal.length,
          approvalTypes: [...new Set(newVal.map(item => item.approvalType))]
        }
      });
    },

    search: function (newVal) {
      console.log(`search: ${newVal}`);
      this.savePage();

      // Update context when search term changes
      this.updateContext({
        view: 'profiles',
        tab: 'list',
        searchTerm: newVal,
        isSearching: newVal.length > 0
      });

      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
      }
    },
  },
};

export default page;
</script>