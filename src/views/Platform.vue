<template>
  <v-card color="bg">
    <v-card-title>
        
      <v-text-field
        v-model="platID"
        :label="$t('Platform ID')"
        :readonly=true
      ></v-text-field>
      
     
    </v-card-title>
    <v-container>
    <v-row v-if="details.platform_type != ''"> 
      <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="staticIP"
                :label="$t('Static IP')"
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3"  >
            <v-text-field
                v-model="vmName"
                :label="$t('VM Name')"
            ></v-text-field>
        </v-col>
         <v-col cols="12" sm="6" md="3" >
            <v-btn
              color="primary"
              class="mr-4"
              @click="saveStaticParams"
            >
              {{$t('Save')}}
            </v-btn>
        </v-col>
    </v-row>
    <v-row>
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.platform_status"
                :label="$t('Status')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3" v-if="details.startTime" >
            <v-text-field
                v-model="details.uptime"
                :label="$t('Up Time')"
                :readonly=true
            ></v-text-field>
        </v-col>
         <v-col cols="12" sm="6" md="3" v-if="details.startTime">
            <v-text-field
                v-model="details.startTime"
                :label="$t('Start Time')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3" v-if="details.startTime">
            <v-text-field
                v-model="details.platform_ip"
                :label="$t('IP Address')"
                :readonly=true
            ></v-text-field>
        </v-col>
    </v-row>
    <v-row v-if="details.startTime">
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.lastCheckTime"
                :label="$t('Last Check Time')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.lastCheckStatus"
                :label="$t('Last Check Status')"
                :readonly=true
            ></v-text-field>
        </v-col>
      
    </v-row>
    <v-row v-if="details.startTime">
         <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.currentLoad"
                :label="$t('CPU Load')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.memTotal"
                :label="$t('Total Memory')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.memActive"
                :label="$t('Active Memory')"
                :readonly=true
            ></v-text-field>
        </v-col>
       <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.memAvailable"
                :label="$t('Available Memory')"
                :readonly=true
            ></v-text-field>
        </v-col>
    </v-row>
    <v-row v-if="details.startTime">
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="details.created_sessions_cnt"
                :label="$t('Created Sessions')"
                :readonly=true
            ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="3">
            <v-text-field
                v-model="rows.length"
                :label="$t('Current Sessions')"
                :readonly=true
            ></v-text-field>
        </v-col>
       
    </v-row>
    </v-container>
    <v-data-table v-if="rows.length > 0"
      :headers="headers"
      :items="rows"
      :items-per-page="100"
      :loading="loading"
      class="ma-4 bg"
    >

    <template v-slot:[`item.actions`]="{ item }">
             <v-icon  small @click="killSession(item,$event)" class="mx-2"> mdi-stop </v-icon>
    </template>
      
    </v-data-table>
    
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
const moment = require("moment");

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

let page = {
  name: "Group",
  data: () => ({
    headers: [],
    rows: [],
    platID: "",
    search: "",
    totalItems: 0,
    loading: true,
    staticIP: "",
    vmName: "",
    options: {},
    details: {},
    appData,
    refreshTimeout: null,
    snackbarSave: false,
    snackbarText: "",

  }),
  methods: {
    printMem: function(bytes) {
      if (isNaN(bytes)) {
        return "";
      }
      const kb = bytes / 1024;
      if (kb<1) {
        return `${bytes} bytes`;
      }
      const mb = kb / 1024;
      if (mb<1) {
        return `${kb.toFixed(1)} kb`;
      }
      const gb = mb / 1024;
      if (gb<1) {
        return `${mb.toFixed(1)} mb`;
      }
      return `${gb.toFixed(1)} gb`;
    },
    saveStaticParams: function() {
      appUtils.post({
            url: "api/platforms/"+ encodeURIComponent(this.platID),
            data: {
                ip: this.staticIP,
                vmname: this.vmName
            }
        }).then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
                console.log("Success");
                
                this.snackbarText = this.$t("Static Parameters Saved");
                this.snackbarSave = true;
                this.loadDetails();

            } else {
                console.log(`status: ${response.data.status}`);

                this.snackbarText = this.$t("Error");
                this.snackbarSave = true;
            }
            this.refresh();
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    killSession: function(item,event) {
        event.stopPropagation();
        appUtils.post({
            url:
                `api/devices/${encodeURIComponent(item.email)}/${encodeURIComponent(item.imei)}`,
            data: {
                action: "endSession"
            }
        }).then((response) => {
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
            this.refresh();
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refresh: function() {
      console.log(`platID: ${this.platID}`);
      if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
          this.refreshTimeout = null;
      }
      const firstTime = (!this.details.platform_type);
      appUtils
        .get({
          url: "api/platforms/" + encodeURIComponent(this.platID),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.sessions;
            this.details = response.data;
            if (this.details.params) {
                if (this.details.params.startTime) {
                    this.details.uptime = moment(this.details.params.startTime).fromNow();
                    this.details.startTime = moment(this.details.params.startTime).format("LLL");
                }
                if (!isNaN(this.details.params.currentLoad)) {
                    this.details.currentLoad = `${(this.details.params.currentLoad * 1).toFixed(1)}%`;
                } else {
                    this.details.currentLoad = "";
                }
                this.details.memTotal = this.printMem(this.details.params.memTotal);
                this.details.memAvailable = this.printMem(this.details.params.memAvailable);
                this.details.memActive = this.printMem(this.details.params.memActive);
                this.details.lastCheckTime = this.details.params.lastCheckTime ? moment(this.details.params.lastCheckTime).format("LLL") : "";
                this.details.lastCheckStatus = this.details.params.lastCheckStatus ? this.details.params.lastCheckStatus.toUpperCase() : "";
                if (this.details.platform_type != '' && firstTime) {
                  this.staticIP = this.details.params.ip;
                  this.vmName = this.details.params.vmname;

                }
            }
            this.details.platform_status = capitalize(this.details.platform_status);
            this.refreshTimeout = setTimeout(this.refresh,10000);
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    
    
    updatePageHead: function() {
      let bcItems = [
        {
          text: this.$t("control-panel"),
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Platforms"),
          to: "/Platforms",
          disabled: false,
        },
        {
          text: this.platID,
          to: "/Platform/" + this.platID,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
    
  },
  created: function() {
    this.platID = this.$route.params.platID;
    
    this.updatePageHead();
    this.headers = [
      {
        text: this.$t("First Name"),
        value: "user.firstname",
      },
      {
        text: this.$t("Last Name"),
        value: "user.lastname",
      },
      {
        text: this.$t("Email"),
        value: "email",
      },
      {
        text: this.$t("Device ID"),
        value: "imei",
      },
      {
        text: this.$t("Device Name"),
        value: "devicename",
      },
      { text: 'Actions', value: 'actions', sortable: false }
    ];
    
    this.refresh();
  },
  beforeDestroy: function() {
    console.log('lifecycle: beforeDestroy');
    if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
          this.refreshTimeout = null;
    }
  }
};

export default page;
</script>
