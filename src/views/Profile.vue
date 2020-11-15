<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title
        >{{ details.firstname }} {{ details.lastname }}</v-toolbar-title
      >

      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title >
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="details"> Details </v-tab>
          <v-tab key="activity"> Activity </v-tab>
          <v-tab key="apps"> Apps </v-tab>
          <v-tab key="devices"> Devices </v-tab>
          <v-tab key="groups"> Groups </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab" >
      <v-tab-item key="details" >
        <v-card flat class="ma-0" color="bg">
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="First Name"
                    v-model="details.firstname"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field label="Last Name" v-model="details.lastname" />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Office Phone"
                    v-model="details.officePhone"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Mobile Phone"
                    v-model="details.mobilePhone"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field label="Manager" v-model="details.manager" />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field label="Country" v-model="details.country" />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Email"
                    v-model="details.email"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="User Name"
                    v-model="details.userName"
                    readonly
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
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
      <v-tab-item key="activity">
        <v-card flat class="ma-0" color="bg">
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Last Login"
                    v-model="details.lastActivityTimeFormat"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Data Center"
                    v-model="details.dataCenter"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="Storage Usage"
                    v-model="details.storageUsage"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    label="EWS Subscription"
                    v-model="details.subscriptionUpdateDateFormat"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn @click="notificationTest" color="primary" >Notification Test</v-btn>
                </v-col>
              </v-row>

              <v-row>
                <v-card class="mt-6" color="bg">
                  <v-card-title>Activity Log</v-card-title>
                  <v-data-table
                    :headers="logsHead"
                    :items="logsRows"
                    :items-per-page="20"
                    :loading="logsLoading"
                    :sort-by.sync="logsSort"
                    :sort-desc.sync="logsSortDesc"
                    class="elevation-1 ma-4 bg"
                  >
                    <template v-slot:item.Time="{ item }">
                      {{ moment(item.Time).format("LLL") }}
                    </template>
                  </v-data-table>
                </v-card>
              </v-row>
            </v-container></v-form
          >
        </v-card>
      </v-tab-item>
      <v-tab-item key="apps">
        <v-card flat color="bg">
          <v-card-title>{{$t("App List")}}</v-card-title>
          <v-dialog v-model="dialogDelete" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-title class="headline">Are you sure you want to delete {{deleteAppItem.appName}}?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="closeDelete">Cancel</v-btn>
              <v-btn color="primary"  @click="deleteAppConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
          <v-data-table
            :headers="appsHead"
            :items="apps"
            :items-per-page="10"
            :loading="appsLoading"
            :sort-by.sync="appsSort"
            :sort-desc.sync="appsSortDesc"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:item.imageUrl="{ item }">
              <v-img
                max-height="40"
                max-width="40"
                :src="item.imageUrl"
              ></v-img>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon small class="mr-2" @click="reinstallItem(item)">
                mdi-refresh
              </v-icon>
              <v-icon  v-if="item.privateApp == 1" small @click="deleteApp(item)"> mdi-delete </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
      <v-tab-item key="devices">
        <v-card flat color="bg">
          <v-card-title>{{$t("Devices")}}</v-card-title>
          <v-data-table
            :headers="devicesHead"
            :items="devices"
            :items-per-page="10"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:item.isOnline="{ item }">
              <v-chip
                v-if="item.isOnline"
                class="ma-2"
                color="success"
                text-color="white"
              >
                {{$t("Online")}}
              </v-chip>
              <v-chip
                v-if="!item.isOnline && item.isActive"
                class="ma-2"
                color="warning"
              >
                {{$t("Offline")}}
              </v-chip>
              <v-chip
                v-if="!item.isActive"
                class="ma-2"
                color="error"
                text-color="white"
              >
                {{$t("Disabled")}}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
              v-if="item.isOnline"
              small
              color="primary"
              dark
              class="ma-1"
              @click="endSession(item)"
            >
              {{$t("End Session")}}
            </v-btn>
            <v-btn
              v-else-if="item.isActive "
              small
              color="primary"
              dark
              class="ma-1"
              @click="disableDevice(item)"
            >
              {{$t("Disable")}}
            </v-btn>
            <v-btn
              v-else
              small
              color="primary"
              dark
              class="ma-1"
              @click="enableDevice(item)"
            >
              {{$t("Enable")}}
            </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
      <v-tab-item key="groups">
        <v-card flat color="bg">
          <v-card-title>{{ $t("Groups") }}</v-card-title>
          <v-data-table
            :headers="groupHeaders"
            :items="groupRows"
            class="elevation-1 ma-4 bg"
          >
            
            <template v-slot:item.adDomain="{ item }">
              <div v-if="item.groupName == 'All'">{{$t("Automatic")}}</div>
              <div v-else-if="item.adDomain == ''">{{$t("Manual")}}</div>
              <div v-else>{{$t("Active Directory")}}</div>
            </template>
            
          </v-data-table>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
                {{ snackbarText }}

                <template v-slot:action="{ attrs }">
                  <v-btn
                    color="blue"
                    text
                    v-bind="attrs"
                    @click="snackbarSave = false"
                  >
                    Close
                  </v-btn>
                </template>
              </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
const moment = require("moment");

export default {
  name: "Profile",
  components: {
    //HelloWorld
  },
  data: () => ({
    details: {},
    tab: {},
    appData,
    saveLoading: false,
    snackbarSave: false,
    snackbarText: "",
    moment: moment,
    logsHead: [],
    logsRows: [],
    logsLoading: true,
    logsSort: "Time",
    logsSortDesc: true,
    appsHead: [],
    apps: [],
    appsLoading: true,
    appsSort: "appName",
    appsSortDesc: false,
    dialogDelete: false,
    deleteAppItem: {},
    devicesHead: [],
    devices: [],
    groupHeaders: [],
    groupRows: [],
  }),
  methods: {
    deleteApp: function(app) {
      
      this.deleteAppItem = app;
      this.dialogDelete = true;
    },
    deleteAppConfirm : function() {
      console.log(this.deleteAppItem);
      this.dialogDelete = false;
      appUtils
        .get({
          url:
            `api/apps/${encodeURIComponent(this.deleteAppItem.packageName)}/deleteFromProfiles?email=${encodeURIComponent(this.details.email)}`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            
            this.snackbarText = "App deleted";
            this.snackbarSave = true;
            this.loadDetails();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {

        });
    },
    closeDelete: function() {
      this.dialogDelete = false;
    },
    reinstallItem: function(app) {
      console.log("reinstallItem..");
      appUtils
      .get({
          url:
            `api/apps/${encodeURIComponent(app.packageName)}/install?email=${encodeURIComponent(this.details.email)}`+
            `&privateApp=${encodeURIComponent(app.privateApp)}` +
            `&appStoreOnly=0`,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            
            this.snackbarText = "App re-installed";
            this.snackbarSave = true;
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {

        });
    },
    endSession: function(item) {
      appUtils
      .post({
          url:
            `api/devices/${encodeURIComponent(this.details.email)}/${encodeURIComponent(item.IMEI)}`,
          data: {
            action: "endSession"
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            
            this.snackbarText = this.$t("Session closed");
            this.snackbarSave = true;
            this.loadDetails();

          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {

        });
    },
    disableDevice: function(item) {
      appUtils
      .post({
          url:
            `api/devices/${encodeURIComponent(this.details.email)}/${encodeURIComponent(item.IMEI)}`,
          data: {
            action: "disable"
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1 || response.data.status == 0) {
            console.log("Success");
            
            this.snackbarText = this.$t("Device disabled");
            this.snackbarSave = true;
            this.loadDetails();

          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {

        });
    },
    enableDevice: function(item) {
      appUtils
      .post({
          url:
            `api/devices/${encodeURIComponent(this.details.email)}/${encodeURIComponent(item.IMEI)}`,
          data: {
            action: "enable"
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            
            this.snackbarText = this.$t("Device enabled");
            this.snackbarSave = true;
            this.loadDetails();

          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => {

        });
    },
    loadDetails: function() {
      appUtils
      .get({
        url:
          "/api/profiles/" +
          encodeURIComponent(this.$route.params.id),
      })
      .then((response) => {
        console.log(response.data);
        if (response.data.status == 1) {
          console.log("Success");
          this.details = response.data.details;
          this.details.email = this.$route.params.id;
          let m = moment(this.details.lastActivityTime);
          if (m.isValid()) {
            this.details.lastActivityTimeFormat = m.format("LLL");
          } else {
            this.details.lastActivityTimeFormat = "";
          }
          m = moment(this.details.subscriptionUpdateDate);
          if (m.isValid()) {
            this.details.subscriptionUpdateDateFormat = m.format("LLL");
          } else {
            this.details.subscriptionUpdateDateFormat = "";
          }
          this.apps = response.data.apps;
          this.appsHead = [
            {
              text: this.$t("Icon"),
              value: "imageUrl",
              sortable: false
            },
            { text: this.$t("Name"), value: "appName" },
            { text: this.$t("Package"), value: "packageName" },
            { text: 'Actions', value: 'actions', sortable: false },
          ];
          this.appsLoading = false;

          this.devices = response.data.devices;
          this.devicesHead = [
            {
              text: this.$t("Name"),
              value: "deviceName"
            },
            { text: this.$t("ID"), value: "IMEI" },
            { text: this.$t("Created"), value: "insertTime" },
            { text: this.$t("Online"), value: "isOnline" },
            { text: this.$t("Platform"), value: "platform" },
            { text: this.$t("Gateway"), value: "gateway" },
            { text: 'Actions', value: 'actions', sortable: false },
          ];

          this.groupRows = response.data.groups;
          this.groupHeaders = [
            {
              text: this.$t("Group Name"),
              value: "groupName",
            },
            { text: this.$t("Group Type"), value: "adDomain" },
           
          ];
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

      appUtils
        .post({
          url:
          "/api/profiles/" +
          encodeURIComponent(this.$route.params.id),
          data: {
            first: this.details.firstname,
            last: this.details.lastname,
            manager: this.details.manager,
            country: this.details.country,
            officePhone: this.details.officePhone,
            mobilePhone: this.details.mobilePhone,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.saveLoading = false;
            this.snackbarText = "Saved";
            this.snackbarSave = true;
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");

            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.saveLoading = false));
    },
    notificationTest: function () {
      console.log("notificationTest");
      appUtils
        .put({
          url:
            "api/notifications",
          data: {
            email: this.details.email,
            titleText: "Test",
            notifyTime: "Test Notification",
            notifyLocation: "Test Notification",
            appName: "test",
            authKey: "test"
          }
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.snackbarText = "Notification Sent";
            this.snackbarSave = true;
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = "Notification Error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    resetLogin: function () {
      console.log("resetLogin");
    },
  },
  created: function () {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        href: "/#/",
        disabled: false,
      },
      {
        text: this.$t("Profiles"),
        href: "/#/Profiles",
        disabled: false,
      },
      {
        text: this.$route.params.id,
        href: "/#/Profile/" + this.$route.params.id,
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    //
    this.loadDetails();
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);

      if (newVal == 1) {
        // activities yab
        this.logsHead = [
          {
            text: this.$t("Time"),
            value: "Time",
          },
          { text: this.$t("Component"), value: "ComponentType" },
          { text: this.$t("Message"), value: "Message" },
        ];
        let s = Math.round(new Date().getTime() / 1000 - 60 * 60 * 24 * 5);
        this.logsLoading = true;
        appUtils
          .get({
            url:
              "api/logs?u=" +
              encodeURIComponent(this.details.email) +
              `&mtype=important&limit=200` +
              `&s=${s}`
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              console.log("Success");
              if (response.data.logs) {
                this.logsRows = response.data.logs;
                this.logsLoading = false;
              }
            } else {
              console.log(`status: ${response.data.status}`);
              //this.$router.push("/Login");

              this.snackbarText = "Error";
              this.snackbarSave = true;
            }
          })
          .catch((error) => console.log(error))
          .finally(() => (this.saveLoading = false));
      }
    },
  },
};
</script>
