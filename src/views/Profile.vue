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

      <!-- <v-dialog v-model="dialogMassAdd" max-width="500px" color="bg">
        <v-card color="bg">
          <v-card-title>{{$t('Mass Add Users')}}</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="massAddCount"
              type="number"
              :label="$t('Number of Users')"
              :rules="[v => v > 0 || $t('Must be greater than 0')]"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="warning" @click="dialogMassAdd = false">{{$t('Cancel')}}</v-btn>
            <v-btn
              color="primary"
              @click="startMassAdd"
              :loading="massAddLoading"
              :disabled="massAddCount <= 0"
            >{{$t('Start')}}</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog> -->

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
                  <v-checkbox
                    class="py-0 my-0"
                    v-model="details.isActive"
                    :label="$t('Enabled')"
                  ></v-checkbox>
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
                    <template v-slot:[`item.Time`]="{ item }">
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
            <template v-slot:[`item.imageUrl`]="{ item }">
              <v-img
                max-height="40"
                max-width="40"
                :src="item.imageUrl"
              ></v-img>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
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
          <v-dialog v-model="dialogDeleteDevice" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-title class="headline">{{$t('Are you sure you want to delete device?')}}</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogDeleteDevice = false;">{{$t('Cancel')}}</v-btn>
              <v-btn color="primary"  @click="deleteDeviceConfirm">{{$t('OK')}}</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
          <v-data-table
            :headers="devicesHead"
            :items="devices"
            :items-per-page="10"
            class="elevation-1 ma-4 bg"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn  v-if="appData.checkPermission('/profiles','w')" color="primary" dark class="mb-2" @click="addDeviceDialog = true">
                  {{ $t("Add Device") }}
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:[`item.isOnline`]="{ item }">
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
            <template v-slot:[`item.actions`]="{ item }">
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
            <v-btn
              v-if="!item.isOnline && appData.checkPermission('/profiles','w')"
              small
              color="primary"
              dark
              class="ma-1"
              @click="deleteDevice(item)"
            >
              {{$t("Delete")}}
            </v-btn>
            </template>
          </v-data-table>
          <v-dialog v-model="addDeviceDialog" max-width="800px" overlay-color="bg">
            <v-card color="bg">
              <v-card-title>
                {{ $t("Add Device") }}
              </v-card-title>
              <v-form ref="addDeviceForm" v-model="addDeviceForm">
                <v-container>
                  <v-row>
                    <v-col cols="24" sm="12" md="6">
                      <v-text-field
                        :label="$t('Name')"
                         :rules="requiredRules"
                        v-model="addDeviceName"
                      />
                    </v-col>
                    <v-col cols="24" sm="12" md="6">
                      <v-text-field
                        :label="$t('Unique ID')"
                         :rules="uidRules"
                        v-model="addDeviceUID"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" sm="6" md="3">
                      <v-btn
                        color="primary"
                        class="mr-4"
                        @click="addDevice"
                      >
                        Save
                      </v-btn>
                    </v-col>
                  </v-row>
            </v-container></v-form
          >
            </v-card>
          </v-dialog>
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

            <template v-slot:[`item.adDomain`]="{ item }">
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
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

export default {
  name: "ProfilePage",
  components: {
    //HelloWorld
  },
  mixins: [contextUpdater],
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
    addDeviceDialog: false,
    addDeviceForm: true,
    addDeviceName: "",
    addDeviceUID: "",
    dialogDeleteDevice: false,
    deleteDeviceItem: {},
    dialogMassAdd: false,
    massAddCount: 1,
    massAddLoading: false,
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
    deleteDevice: function(item) {
      this.dialogDeleteDevice  = true;
      this.deleteDeviceItem = item
    },
    deleteDeviceConfirm: async function() {
      try {

        await appUtils.delete({
          url:
            `api/devices/${encodeURIComponent(this.details.email)}/${encodeURIComponent(this.deleteDeviceItem.IMEI)}`
        });

        this.dialogDeleteDevice = false;
        this.snackbarText = "Deleted";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
        this.dialogDeleteDevice = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }

    },
    addDevice: async function() {
      let v = this.$refs.addDeviceForm.validate();
      if (!this.addDeviceForm) {
        console.log(`addDeviceForm: ${this.addDeviceForm}, v: ${v}`);
        return;
      }
      try {
        let imei = this.addDeviceUID;
        let devicename = this.addDeviceName;

        let data = {
            devicename,
        };

        await appUtils.put({
          url:
            `api/devices/${encodeURIComponent(this.details.email)}/${encodeURIComponent(imei)}`,
          data
        });

        this.addDeviceDialog = false;
        this.snackbarText = "Added";
        this.snackbarSave = true;
        this.loadDetails();
      } catch (err) {
        console.error(`Error: ${err}`,err);
        this.addDeviceDialog = false;
        this.snackbarText = "Error";
        this.snackbarSave = true;
      }

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

        // Update context for new profile
        this.updateContext({
          view: 'profile',
          mode: 'new',
          tab: this.tab,
          lastUpdated: new Date().toISOString()
        });

        return;
      }

      // Update context with loading state
      this.updateContext({
        view: 'profile',
        mode: 'view',
        tab: this.tab,
        loading: true,
        profileId: this.profileID
      });

      //console.log("Loading details...");
      appUtils
      .get({
        url:
          "api/profiles/" +
          encodeURIComponent(this.profileID),
      })
      .then((response) => {
        console.log(response.data);
        if (response.data.status == 1) {
          //console.log("Success");
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
            { text: this.$t("Local ID"), value: "localid" },
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

          // Update context with profile data
          this.updateContext({
            view: 'profile',
            mode: 'view',
            tab: this.tab,
            loading: false,
            profileData: {
              id: this.profileID,
              name: `${this.details.firstname} ${this.details.lastname}`,
              email: this.details.email,
              isActive: this.details.isActive,
              lastActivity: this.details.lastActivityTimeFormat,
              appCount: this.apps.length,
              deviceCount: this.devices.length,
              groupCount: this.groupRows.length
            },
            tabData: this.getContextDataForCurrentTab(),
            lastUpdated: new Date().toISOString()
          });
        } else {
          console.log(`status: ${response.data.status}`);

          // Update context with error
          this.updateContext({
            view: 'profile',
            mode: 'view',
            tab: this.tab,
            loading: false,
            error: `Failed to load profile (status: ${response.data.status})`,
            profileId: this.profileID
          });
        }
      })
      .catch((error) => {
        console.log(error);

        // Update context with error
        this.updateContext({
          view: 'profile',
          mode: 'view',
          tab: this.tab,
          loading: false,
          error: `Error loading profile: ${error}`,
          profileId: this.profileID
        });
      })
      .finally(() => (this.loading = false));
    },
    getContextDataForCurrentTab: function() {
      let tabData = {};

      if (this.tab === 0) { // Details tab
        tabData = {
          firstName: this.details.firstname,
          lastName: this.details.lastname,
          email: this.details.email,
          isActive: this.details.isActive
        };
      } else if (this.tab === 1) { // Activity tab
        tabData = {
          lastActivity: this.details.lastActivityTimeFormat,
          dataCenter: this.details.dataCenter,
          storageUsage: this.details.storageUsage,
          recentLogs: this.logsRows.slice(0, 3).map(log => ({
            time: log.Time,
            component: log.ComponentType,
            message: log.Message
          }))
        };
      } else if (this.tab === 2) { // Apps tab
        tabData = {
          appCount: this.apps.length,
          recentApps: this.apps.slice(0, 3).map(app => ({
            name: app.appName,
            package: app.packageName
          }))
        };
      } else if (this.tab === 3) { // Devices tab
        tabData = {
          deviceCount: this.devices.length,
          onlineDevices: this.devices.filter(d => d.isOnline).length,
          recentDevices: this.devices.slice(0, 3).map(device => ({
            name: device.deviceName,
            id: device.IMEI,
            isOnline: device.isOnline,
            platform: device.platform
          }))
        };
      } else if (this.tab === 4) { // Groups tab
        tabData = {
          groupCount: this.groupRows.length,
          groups: this.groupRows.map(group => ({
            name: group.groupName,
            type: group.adDomain ? 'Active Directory' : 'Manual'
          }))
        };
      }

      return tabData;
    },
    saveDetails: function () {
      this.$refs.form.validate();
      if (!this.valid) {
        return;
      }

      // Update context with saving state
      this.updateContext({
        view: 'profile',
        mode: this.newProfile ? 'new' : 'edit',
        tab: this.tab,
        loading: true,
        saving: true,
        profileId: this.profileID
      });

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
          "api/profiles/" +
          encodeURIComponent(this.profileID),
          data: {
            first: this.details.firstname,
            last: this.details.lastname,
            manager: this.details.manager,
            country: this.details.country,
            officePhone: this.details.officePhone,
            mobilePhone: this.details.mobilePhone,
            isActive: this.details.isActive,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.saveLoading = false;
            this.snackbarText = this.$t("Profile saved");
            this.snackbarSave = true;

            // Update context with success
            this.updateContext({
              view: 'profile',
              mode: this.newProfile ? 'new' : 'edit',
              tab: this.tab,
              loading: false,
              saving: false,
              saveSuccess: true,
              profileId: this.profileID,
              profileData: {
                id: this.profileID,
                name: `${this.details.firstname} ${this.details.lastname}`,
                email: this.details.email,
                isActive: this.details.isActive
              },
              lastUpdated: new Date().toISOString()
            });

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

            // Update context with error
            this.updateContext({
              view: 'profile',
              mode: this.newProfile ? 'new' : 'edit',
              tab: this.tab,
              loading: false,
              saving: false,
              saveSuccess: false,
              error: `Failed to save profile (status: ${response.data.status})`,
              profileId: this.profileID
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'profile',
            mode: this.newProfile ? 'new' : 'edit',
            tab: this.tab,
            loading: false,
            saving: false,
            saveSuccess: false,
            error: `Error saving profile: ${error}`,
            profileId: this.profileID
          });
        })
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
      //console.log("updatePageHead");
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
        {
          text: (this.profileID != "" ? this.profileID : this.$t("New Profile")),
          to: "/Profile/" + this.profileID,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
    sendInvitation : function () {
      console.log("sendInvitation");

      // Update context with sending invitation state
      this.updateContext({
        view: 'profile',
        mode: 'view',
        tab: this.tab,
        action: 'sending_invitation',
        profileId: this.profileID
      });

      appUtils
        .put({
          url:
          "api/profiles/" +
          encodeURIComponent(this.profileID)+"/invite",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.saveLoading = false;
            this.snackbarText = this.$t("Invitation sent");
            this.snackbarSave = true;

            // Update context with success
            this.updateContext({
              view: 'profile',
              mode: 'view',
              tab: this.tab,
              action: 'invitation_sent',
              success: true,
              profileId: this.profileID,
              lastUpdated: new Date().toISOString()
            });
          } else {
            this.snackbarText = "Error";
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'profile',
              mode: 'view',
              tab: this.tab,
              action: 'invitation_error',
              success: false,
              error: `Failed to send invitation (status: ${response.data.status})`,
              profileId: this.profileID,
              lastUpdated: new Date().toISOString()
            });
          }
        }).catch((err) => {
          this.snackbarText = "Error";
          this.snackbarSave = true;
          console.log(err);

          // Update context with error
          this.updateContext({
            view: 'profile',
            mode: 'view',
            tab: this.tab,
            action: 'invitation_error',
            success: false,
            error: `Error sending invitation: ${err}`,
            profileId: this.profileID,
            lastUpdated: new Date().toISOString()
          });
        });
    },

    deleteProfile: function () {
      console.log("deleteProfile");

      // Update context with deleting profile state
      this.updateContext({
        view: 'profile',
        mode: 'view',
        tab: this.tab,
        action: 'deleting_profile',
        profileId: this.profileID
      });

      appUtils
        .delete({
          url:
          "api/profiles/" +
          encodeURIComponent(this.profileID),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.saveLoading = false;
            this.snackbarText = this.$t("Profile deleted");
            this.snackbarSave = true;

            // Update context with success
            this.updateContext({
              view: 'profile',
              mode: 'view',
              tab: this.tab,
              action: 'profile_deleted',
              success: true,
              profileId: this.profileID,
              lastUpdated: new Date().toISOString()
            });

            this.$router.push("/Profiles");
          } else {
            this.snackbarText = "Error";
            this.snackbarSave = true;

            // Update context with error
            this.updateContext({
              view: 'profile',
              mode: 'view',
              tab: this.tab,
              action: 'delete_error',
              success: false,
              error: `Failed to delete profile (status: ${response.data.status})`,
              profileId: this.profileID,
              lastUpdated: new Date().toISOString()
            });
          }
        }).catch((err) => {
          this.snackbarText = "Error";
          this.snackbarSave = true;
          console.log(err);

          // Update context with error
          this.updateContext({
            view: 'profile',
            mode: 'view',
            tab: this.tab,
            action: 'delete_error',
            success: false,
            error: `Error deleting profile: ${err}`,
            profileId: this.profileID,
            lastUpdated: new Date().toISOString()
          });
        });
    },
  },
  created: function () {
    this.profileID = this.$route.params.id;
    if (!this.profileID || this.profileID == "") {
      this.profileID = "";
      this.newProfile = true;
      this.details.isActive = true; // default to enabled
    } else {
      this.newProfile = false;
    }
    this.updatePageHead();

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Profile',
      mode: this.newProfile ? 'new' : 'view',
      tab: this.tab,
      profileId: this.profileID,
      permissions: {
        canEdit: appData.checkPermission('/profiles','w')
      },
      lastInitialized: new Date().toISOString()
    });

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
    this.uidRules = [
      (v) => !!v || this.$t("Field is required"),
      (v) =>
      /^[0-9a-zA-Z\-:]+$/.test(v) ||
        this.$t("Invalid ID"),
    ];
    this.loadDetails();
  },
  watch: {
    tab: function (newVal) {
      // Update context when tab changes
      this.updateContext({
        view: 'profile',
        mode: this.newProfile ? 'new' : 'view',
        tab: newVal,
        tabLabel: ['details', 'activity', 'apps', 'devices', 'groups'][newVal],
        profileId: this.profileID,
        tabData: this.getContextDataForCurrentTab(),
        lastTabChange: new Date().toISOString()
      });

      //console.log(`tab: ${newVal}`);

      if (newVal == 1) {
        // activities tab
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

                // Update context with logs data
                this.updateContext({
                  view: 'profile',
                  mode: 'view',
                  tab: newVal,
                  tabLabel: 'activity',
                  profileId: this.profileID,
                  tabData: {
                    lastActivity: this.details.lastActivityTimeFormat,
                    recentLogs: this.logsRows.slice(0, 5).map(log => ({
                      time: log.Time,
                      component: log.ComponentType,
                      message: log.Message
                    }))
                  },
                  lastUpdated: new Date().toISOString()
                });
              }
            } else {
              console.log(`status: ${response.data.status}`);
              //this.$router.push("/Login");

              this.snackbarText = "Error";
              this.snackbarSave = true;

              // Update context with error
              this.updateContext({
                view: 'profile',
                mode: 'view',
                tab: newVal,
                tabLabel: 'activity',
                profileId: this.profileID,
                error: `Failed to load activity logs (status: ${response.data.status})`,
                lastUpdated: new Date().toISOString()
              });
            }
          })
          .catch((error) => {
            console.log(error);

            // Update context with error
            this.updateContext({
              view: 'profile',
              mode: 'view',
              tab: newVal,
              tabLabel: 'activity',
              profileId: this.profileID,
              error: `Error loading activity logs: ${error}`,
              lastUpdated: new Date().toISOString()
            });
          })
          .finally(() => (this.logsLoading = false));
      }
    },
  },
};
</script>
