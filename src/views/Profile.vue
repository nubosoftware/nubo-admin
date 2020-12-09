<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title v-if="!newProfile"
        >{{ details.firstname }} {{ details.lastname }}</v-toolbar-title>
       <v-toolbar-title v-else
        >{{ $t("New Profile") }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <!--
      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>-->
      <v-menu
        bottom
        left
        v-if="!newProfile && appData.checkPermission('/profiles','w')"
       
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            dark
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="sendInvitation()"
          >
            <v-list-item-title>{{ $t('Send invitation') }}</v-list-item-title>
            
          </v-list-item>
          <v-list-item @click="dialogDeleteProfile = true">
            <v-list-item-title>{{ $t('Delete profile') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-dialog v-model="dialogDeleteProfile" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-subtitle class="headline">{{$t('Are you sure you want to delete profile',{profileName: details.firstname+' '+details.lastname })}}</v-card-subtitle>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogDeleteProfile = false">{{$t('Cancel')}}</v-btn>
              <v-btn color="error"  @click="deleteProfile()">{{$t('OK')}}</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title >
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="details"> {{$t("Details")}} </v-tab>
          <v-tab key="activity" v-if="!newProfile"> {{$t("Activity")}} </v-tab>
          <v-tab key="apps" v-if="!newProfile"> {{$t("Apps")}} </v-tab>
          <v-tab key="devices" v-if="!newProfile"> {{$t("Devices")}} </v-tab>
          <v-tab key="groups" v-if="!newProfile"> {{$t("Groups")}} </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab" >
      <v-tab-item key="details" >
        <v-card flat class="ma-0" color="bg">
          <v-form 
            ref="form"
            v-model="valid" >
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('First Name')"
                    v-model="details.firstname"
                    :rules="requiredRules"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field :label="$t('Last Name')" v-model="details.lastname"
                    :rules="requiredRules"
                   />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Office Phone')"
                    v-model="details.officePhone"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Mobile Phone')"
                    v-model="details.mobilePhone"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field :label="$t('Manager')" v-model="details.manager" />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field :label="$t('Country')" v-model="details.country" />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Email')"
                    v-model="details.email"
                    :readonly="!newProfile"
                    :rules="emailRules"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('User Name')"
                    v-model="details.userName"
                    readonly />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    color="primary"
                    class="mr-4"
                    @click="saveDetails"
                    v-bind:loading="saveLoading"
                    v-if="appData.checkPermission('/profiles','w')"
                  >
                    {{$t('Save')}}
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
                    :label="$t('Last Login')"
                    v-model="details.lastActivityTimeFormat"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Data Center')"
                    v-model="details.dataCenter"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Storage Usage')"
                    v-model="details.storageUsage"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('EWS Subscription')"
                    v-model="details.subscriptionUpdateDateFormat"
                    readonly
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn v-if="appData.checkPermission('/profiles','w')" @click="notificationTest" color="primary" >{{$t('Notification Test')}}</v-btn>
                </v-col>
              </v-row>

              <v-row>
                <v-card class="mt-6" color="bg">
                  <v-card-title>{{$t('Activity Log')}}</v-card-title>
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
            <v-card-title class="headline">{{$t('Are you sure you want to delete',{deleteAppName: deleteAppItem.appName })}}</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="closeDelete">{{$t('Cancel')}}</v-btn>
              <v-btn color="primary"  @click="deleteAppConfirm">{{$t('OK')}}</v-btn>
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
              <v-icon v-if="appData.checkPermission('/apps','i')" small class="mr-2" @click="reinstallItem(item)">
                mdi-refresh
              </v-icon>
              <v-icon  v-if="item.privateApp == 1 && appData.checkPermission('/apps','i')" small @click="deleteApp(item)"> mdi-delete </v-icon>
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
              v-if="item.isOnline && appData.checkPermission('/profiles','w')"
              small
              color="primary"
              dark
              class="ma-1"
              @click="endSession(item)"
            >
              {{$t("End Session")}}
            </v-btn>
            <v-btn
              v-else-if="item.isActive && appData.checkPermission('/profiles','w')"
              small
              color="primary"
              dark
              class="ma-1"
              @click="disableDevice(item)"
            >
              {{$t("Disable")}}
            </v-btn>
            <v-btn
              v-else-if="appData.checkPermission('/profiles','w')"
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
                    {{$t('Close')}}
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
    newProfile: false,
    profileID: null,
    emailRules: [],
    requiredRules: [],
    dialogDeleteProfile: false,
    valid: true,
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
      if (this.newProfile) {
        console.log("loadDetails new profile..");
        return;
      }
      console.log("Loading details...");
      appUtils
      .get({
        url:
          "api/profiles/" +
          encodeURIComponent(this.profileID),
      })
      .then((response) => {
        console.log(response.data);
        if (response.data.status == 1) {
          console.log("Success");
          this.details = response.data.details;
          this.details.email = this.profileID;
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
        }
      })
      .catch((error) => console.log(error))
      .finally(() => (this.loading = false));
    },
    sendInvitation : function () {
      console.log("sendInvitation");
      appUtils
        .put({
          url:
          "/api/profiles/" +
          encodeURIComponent(this.profileID)+"/invite",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.saveLoading = false;
            this.snackbarText = this.$t("Invitation sent");
            this.snackbarSave = true;
          } else {
            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        }).catch((err) => {
          this.snackbarText = "Error";
          this.snackbarSave = true;
          console.log(err);
        });
    },
    deleteProfile: function () {
      console.log("deleteProfile");
      appUtils
        .delete({
          url:
          "/api/profiles/" +
          encodeURIComponent(this.profileID),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.saveLoading = false;
            this.snackbarText = this.$t("Profile deleted");
            this.snackbarSave = true;
            this.$router.push("/Profiles");
          } else {
            this.snackbarText = "Error";
            this.snackbarSave = true;
          }
        }).catch((err) => {
          this.snackbarText = "Error";
          this.snackbarSave = true;
          console.log(err);
        });
    },
    saveDetails: function () {

      this.$refs.form.validate();
      if (!this.valid) {
        return;
      }
      let method;
      if (this.newProfile) {
        this.profileID = this.details.email;
        method = "put";
      } else {
        method = "post";
      }
      this.saveLoading = true;

      appUtils
        .req({
          method,
          url:
          "/api/profiles/" +
          encodeURIComponent(this.profileID),
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
            this.snackbarText = this.$t("Profile saved");
            this.snackbarSave = true;
            if (this.newProfile) {
              this.newProfile = false;
              this.snackbarText = this.$t("Profile added");
              this.updatePageHead();
              this.$router.replace("/Profile/" + encodeURIComponent(this.profileID));
              this.loadDetails();
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
    updatePageHead : function () {
      console.log("updatePageHead");
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
          text: (this.profileID != "" ? this.profileID : this.$t("New Profile")),
          href: "/#/Profile/" + this.profileID,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
  },
  created: function () {
    this.profileID = this.$route.params.id;
    if (!this.profileID || this.profileID == "") {
      this.profileID = "";
      this.newProfile = true;
    } else {
      this.newProfile = false;
    }
    this.updatePageHead();
    //
    this.emailRules = [
      (v) => !!v || this.$t("Field is required"),
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        this.$t("Email must be valid"),
    ];
    this.requiredRules = [
      (v) => !!v || this.$t("Field is required"),
    ];
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
            //url: `api/logs?s=${s}`
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
