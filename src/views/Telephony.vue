<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title> {{ $t("Telephony") }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="list"> {{ $t("Devices") }} </v-tab>
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
          show-select
          v-model="selectedDevices"
          item-key="item_key"
          @update:options="updateOptions"
          @click:row="rowClick"
        >
          <template v-slot:top>
            <v-toolbar flat color="bg">
              <v-btn
                v-if="selectedDevices.length > 0 && appData.checkPermission('/profiles','w')"
                class="ma-4"
                color="primary"
                @click="setExtension(true)"
                >{{ $t("Add Local Extension") }}
              </v-btn>
              <v-btn
                v-if="selectedDevices.length > 0 && appData.checkPermission('/profiles','w')"
                class="ma-4"
                color="primary"
                @click="dialogRemoveExtension = true"
                >{{ $t("Remove Local Extension") }}
              </v-btn>
              <v-btn
                v-if="selectedDevices.length == 1 && appData.checkPermission('@/','rw') && (!selectedDevices[0].assigned_phone_number || selectedDevices[0].assigned_phone_number == '')"
                class="ma-4"
                color="primary"
                @click="addExternalNumber()"
                >{{ $t("Add External Number") }}
              </v-btn>
              <v-btn
                v-if="selectedDevices.length == 1 && appData.checkPermission('@/','rw') && selectedDevices[0].assigned_phone_number && selectedDevices[0].assigned_phone_number != ''"
                class="ma-4"
                color="primary"
                @click="dialogRemoveExternal = true"
                >{{ $t("Remove External Number") }}
              </v-btn>
              
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
          <template v-slot:[`item.last_login`]="{ item }">
             {{ (  item.last_login ?  moment(item.last_login).format("LLL") : "") }}
          </template>
        </v-data-table>
      </v-tab-item>
       <v-tab-item key="settings" class="bg">
         
       </v-tab-item>
    </v-tabs-items>
    <v-dialog
      v-model="numberDialog"
      overlay-color="bg"
      max-width="800px"
    >
    <v-card color="bg">
      <v-card-title>
      {{$t("Select Number")}}
    </v-card-title>
    <v-data-table
      :headers="numberHeaders"
      :items="numberRows"
      :loading="numberLoading"
      
      class="elevation-1 ma-4 bg"
      :items-per-page="5"
      @click:row="numberClick"
      
    >
    </v-data-table>
    </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRemoveExternal" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-subtitle class="headline">{{$t('Are you sure you want to remove external number?')}}</v-card-subtitle>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogRemoveExternal = false">{{$t('Cancel')}}</v-btn>
              <v-btn color="error"  @click="removeNumber()">{{$t('OK')}}</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
    <v-dialog v-model="dialogRemoveExtension" max-width="500px" color="bg">
          <v-card color="bg">
            <v-card-subtitle class="headline">{{$t('Are you sure you want to remove local extensions?')}}</v-card-subtitle>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning"  @click="dialogRemoveExtension = false">{{$t('Cancel')}}</v-btn>
              <v-btn color="error"  @click="setExtension(false)">{{$t('OK')}}</v-btn>
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


<style>
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
const moment = require("moment");

let page = {
  name: "Telephony",
  data: () => ({
    tab: {},
    headers: [],
    rows: [],
    search: "",
    selectedDevices: [],
    totalItems: 0,
    loading: true,
    options: {
        sortBy: ["last_login"],
        sortDesc: [true],
    },
    numberDialog: false,
    c: [],
    numberRows: [],
    numberLoading: false,
    snackbarSave: false,
    dialogRemoveExternal: false,
    dialogRemoveExtension: false,
    appData,
    moment
  }),
  methods: {
    updateOptions() {
      //console.log("update:options", options);
      this.refresh();
    },

    rowClick: function (val) {
      console.log(`rowClick: ${val.email}`);
      this.$router.push("/Profile/" + val.email);
    },

    setExtension: async function(addFlag) {
        let action;
        if (addFlag) {
            action = "assignLocalExtension";
        } else {
            action = "removeLocalExtension";
            this.dialogRemoveExtension = false;
        }
        
        for (const device of this.selectedDevices) {
            await this.setExtensionToDevice(device,action);
        }
        this.selectedDevices = [];
        this.refresh();
    },
    setExtensionToDevice: async function(device,action) {
        try {
            let response = await appUtils.post({
                url: `api/telephony/${device.email}/${device.imei}`,
                data: {
                    action
                }    
            });

            
            console.log(response.data);
            if (response.data.status == 1) {
                //this.refresh();
                this.snackbarSave = true;
                this.snackbarText = this.$t("Saved");
            } else {
                console.log(`status: ${response.data.status}`);
                //this.$router.push("/Login");
                this.snackbarSave = true;
                this.snackbarText = this.$t("Error");
            }
        } catch (err) {
            console.error(err);
        }
    },
    addExternalNumber: async function() {
        try {
            const device = this.selectedDevices[0];
            this.numberLoading = true;
            this.numberDialog = true;
            this.numberRows = [];
            let response = await appUtils.post({
                url: `api/telephony/${device.email}/${device.imei}`,
                data: {
                    action: "getAvailableNumbers"
                }    
            });

            console.log(response.data);
            if (response.data.status == 1) {
                this.numberHeaders = [
                    { text: this.$t("Phone"), value: "phoneNumber" },
                ];
                this.numberRows = response.data.availablePhoneNumbers;
                this.numberLoading = false;
            } else {
                console.log(`status: ${response.data.status}`);
                this.snackbarSave = true;
                this.snackbarText = this.$t("Error");
            }
        } catch (err) {
            console.error(err);
            this.numberLoading = false;
            this.numberDialog = false;
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
        }
    },
    numberClick: async function(val) {
        try {
            const device = this.selectedDevices[0];
            
            let response = await appUtils.post({
                url: `api/telephony/${device.email}/${device.imei}`,
                data: {
                    action: "subscribeToNumber",
                    phoneNumber: val.phoneNumber
                }    
            });

            console.log(response.data);
            if (response.data.status == 1) {
                this.selectedDevices = [];
                this.snackbarSave = true;
                this.snackbarText = this.$t("Number Added");
                this.refresh();
            } else {
                console.log(`status: ${response.data.status}`);
                this.snackbarSave = true;
                this.snackbarText = this.$t("Error");
            }
            this.numberDialog = false;
        } catch (err) {
            console.error(err);
            this.numberLoading = false;
            this.numberDialog = false;
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
        }
    },
    removeNumber: async function() {
        try {
            this.dialogRemoveExternal = false;
            const device = this.selectedDevices[0];
            
            let response = await appUtils.post({
                url: `api/telephony/${device.email}/${device.imei}`,
                data: {
                    action: "removeNumber"
                }    
            });

            console.log(response.data);
            if (response.data.status == 1) {
                this.selectedDevices = [];
                this.snackbarSave = true;
                this.snackbarText = this.$t("Number Removed");
                this.refresh();
            } else {
                console.log(`status: ${response.data.status}`);
                this.snackbarSave = true;
                this.snackbarText = this.$t("Error");
            }
        } catch (err) {
            console.error(err);
            this.snackbarSave = true;
            this.snackbarText = this.$t("Error");
        }
    },
    
    refresh: function () {
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      console.log(this.options);
      appUtils
        .get({
          url: "api/devices",
          params: {
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.devices;
            this.rows.forEach(device => {
                device.item_key = `${device.email}:${device.imei}`;
            });
            this.totalItems = response.data.count;
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function () {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Telephony"),
        to: "/Telephony",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
        { text: this.$t("Connect Time"), value: "last_login" },
      {
        text: this.$t("Last Name"),
        value: "user.lastname",
      },
      { text: this.$t("First Name"), value: "user.firstname" },
      { text: this.$t("Email"), value: "email" },
      { text: this.$t("Device Name"), value: "devicename" },
      { text: this.$t("Device ID"), value: "imei" },
      { text: this.$t("Extension"), value: "local_extension" },
      { text: this.$t("External Number"), value: "assigned_phone_number" },
    ];
    //this.refresh();
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab: ${newVal}`);
    },
    search: function (newVal) {
      console.log(`search: ${newVal}`);
      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
      }
    },
  },
};

export default page;
</script>