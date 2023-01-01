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
        </v-data-table>
      </v-tab-item>
       <v-tab-item key="online" class="bg">
         <v-data-table
            :headers="onlineHeads"
            :items="onlineRows"
            :items-per-page="10"
            :loading="onlineLoad"
            :expanded.sync="onlineExpanded"
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
      this.$router.push("/Profile/" + val.email);
    },

    approveSelected: function(approve) {
      console.log("approveSelected");
      this.selectedApprovals.forEach(item => {
        this.approveItem(item,approve);
      });
      this.selectedApprovals = [];
    },
    approveItem: function(item,approve) {
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
          } else {
            console.log(`status: ${response.data.status}`);
          }
        }).catch((err) => {
          console.log(err);
        });
    },
    loadApprovals: function () {
      console.log("loadApprovals");
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
            
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    loadOnline: function () {
      //console.log("loadOnline");
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
            
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refresh: function () {
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
        text: this.$t("Profiles"),
        to: "/Profiles",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("Last Name"),
        value: "lastName",
      },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" },
    ];
    appUtils.loadPageData(`${page.name}`,this);
    //this.refresh();
  },
  watch: {
    tab: function (newVal) {
      //console.log(`tab: ${newVal}`);
      this.savePage();
      if (newVal == 1) {
        this.loadOnline();
      } else if (newVal == 2) {
        this.loadApprovals();
      }
    },
    selectedApprovals: function (newVal) {
      console.log(`selectedApprovals: ${JSON.stringify(newVal)}`);
    },
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      this.savePage();
      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
      }
    },
  },
};

export default page;
</script>