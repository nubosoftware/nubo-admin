<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Security Settings") }}
    </v-card-title>
    <v-form>
            <v-container>
              <v-row>
                <v-col>
                  <v-textarea
                    :label="$t('deviceApproval')"
                    v-model="deviceApprovalStr"
                  />
                </v-col>
              </v-row>
               <v-row>
                <v-col>
                  <v-textarea
                    :label="$t('authentication')"
                    v-model="authenticationStr"
                  />
                </v-col>
              </v-row>
               <v-row>
                <v-col>
                  <v-textarea
                    :label="$t('deviceRules')"
                    v-model="deviceRulesStr"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    color="primary"
                    class="mr-4"
                    @click="saveDetails"
                    v-bind:loading="loading"
                  >
                    Save
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
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

let page = {
  name: "EmailSetup",
  data: () => ({
    deviceApproval: {},
    authentication: {},
    deviceRules: {},
    loading: true,
    options: {},
    snackbarSave: false,
    snackbarText: "",

    deviceApprovalStr: "",
    authenticationStr: "",
    deviceRulesStr: "",
    appData
  }),
  methods: {
    

    refresh: function() {
      appUtils
        .get({
          url: "api/security/deviceApproval"
        })
        .then(response => {
          console.log(`deviceApproval: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.deviceApproval = response.data;
            this.deviceApprovalStr = JSON.stringify(this.deviceApproval,null,2);
          } else {
            console.log(`status: ${response.data.status}`);
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
      appUtils
        .get({
          url: "api/security/authentication"
        })
        .then(response => {
          console.log(`authentication: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.authentication = response.data;
            this.authenticationStr = JSON.stringify(this.authentication,null,2);
          } else {
            console.log(`status: ${response.data.status}`);
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));

      appUtils
        .get({
          url: "api/security/deviceRules"
        })
        .then(response => {
          console.log(`deviceRules: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.deviceRules = response.data;
            this.deviceRulesStr = JSON.stringify(this.deviceRules,null,2);
          } else {
            console.log(`status: ${response.data.status}`);
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateDeviceApproval: function() {
      appUtils
        .post({
          url: "api/security/deviceApproval",
          data: this.deviceApproval
        })
        .then(response => {
          console.log(`updateDeviceApproval: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device approval updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateAuthentication: function() {
      let data = {
        passcodeType: (this.authentication.passcodeType ? "1" : "0"),
        minChars: this.authentication.passcodeMinChars,
        expirationDays: this.authentication.passcodeExpirationDays
      };
      appUtils
        .post({
          url: "api/security/authentication",
          data: data
        })
        .then(response => {
          console.log(`updateAuthentication: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Authnetication method updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    addDeviceRule: function(ruleTitle,ruleFilter) {
      let data = {
        ruleName: ruleTitle,
        filterName: ruleFilter
      };
      appUtils
        .put({
          url: "api/security/deviceRules",
          data: data
        })
        .then(response => {
          console.log(`addDeviceRule: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was added");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateDeviceRule: function(ruleID,ruleFilter) {
      let data = {
        ruleid: ruleID,
        filterName: ruleFilter
      };
      appUtils
        .post({
          url: "api/security/deviceRules",
          data: data
        })
        .then(response => {
          console.log(`updateDeviceRule: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    deleteDeviceRule: function(ruleID,ruleTitle,ruleFilter) {
      let data = {
        ruleid: ruleID,
        ruleName: ruleTitle,
        filterName: ruleFilter
      };
      appUtils
        .delete({
          url: "api/security/deviceRules",
          data: data
        })
        .then(response => {
          console.log(`deleteDeviceRule: ${JSON.stringify(response.data,null,2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was deleted");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error")+" - "+response.data.message;
            this.snackbarSave = true;
            
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    saveDetails: function() {
      console.log("saveDetails");
      //this.deleteDeviceRule(3,"My Title","Test1234567");
      //this.authentication = JSON.parse(this.authenticationStr);
      //this.updateAuthentication();

      
    },
  },
  
  created: function() {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        href: "/#/",
        disabled: false
      },
      {
        text: this.$t("Security Settings"),
        href: "/#/Security",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);
    
    this.refresh();
  }
};

export default page;
</script>
