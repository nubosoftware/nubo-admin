<template>
  <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title>
        {{ $t("Security Settings") }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-slot:extension>
        <v-tabs align-with-title v-model="tab" flat>
          <v-tabs-slider color="primary"></v-tabs-slider>
          <v-tab key="approval">
            Device approval
          </v-tab>
          <v-tab key="auth">
            Authentication
          </v-tab>
          <v-tab key="rules">
            Device Rules
          </v-tab>
          <v-tab key="other">
            Other
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="approval">
        <v-card flat class="ma-0" color="bg" tile>
          <v-card-title>{{ $t("Device approval options") }}</v-card-title>
          <v-radio-group
            v-model="deviceApproval.deviceApprovalType"
            column
            class="mx-4 my-0"
          >
            <v-radio
              label="Automatically approve/reset devices"
              class="mb-4"
              value="0"
            ></v-radio>
            <v-radio
              label="Manualy approve/reset devices"
              class="mb-4"
              value="1"
              v-bind="attrs"
              v-on="on"
            ></v-radio>
            <v-radio label="Both" value="2" v-bind="attrs" v-on="on"></v-radio>
          </v-radio-group>

          <v-sheet color="bg" v-if="approveType != '0'">
            <v-card-title>{{ $t("Notify admins by:") }}</v-card-title>
            <v-radio-group
              v-model="notifType"
              @change="notifTypeChange"
              column
              class="mx-4 my-0"
            >
              <v-radio
                label="Push notification to admins devices"
                class="mb-4"
                value="pushnotif"
              ></v-radio>
              <v-radio
                label="Email to a dedicated email address:"
                value="emailnotif"
                v-bind="attrs"
                v-on="on"
              ></v-radio>
            </v-radio-group>
            <v-text-field
              v-model="deviceApproval.notifierAdmin"
              label="Email"
              class="mx-8 my-0"
              :rules="emailRules"
              required
              v-if="notifType == 'emailnotif'"
            >
            </v-text-field>
          </v-sheet>

          <v-btn
            color="primary"
            class="ma-4"
            @click="saveDetails"
            v-bind:loading="loading"
            >Save
          </v-btn>
        </v-card>
      </v-tab-item>

      <v-tab-item key="auth">
        <v-card flat class="ma-0" color="bg">
          <v-card-title>{{ $t("Authentication options") }}</v-card-title>
          <v-radio-group v-model="column" column class="mx-4 my-0">
            <v-radio label="Passcode" class="mb-4" value="passcode"></v-radio>
            <v-radio label="Password" class="mb-4" value="password"> </v-radio>
          </v-radio-group>

          <v-sheet color="bg">
            <v-card-title>{{ $t("Password strength values") }}</v-card-title>
            <v-card-subtitle>{{
              $t("Ask users to change password every (incert 0 for unlimited)")
            }}</v-card-subtitle>

            <v-row class="mx-4 my-0">
              <v-col cols="12" sm="3" md="2">
                <v-text-field
                  dense
                  :rules="passLengthRules"
                  class="shrink"
                  required
                  :label="$t('Passcode length')"
                />
                <!--
                <v-select
                  :items="Passlenval"
                  :menu-props="{ top: true, offsetY: true }"
                  label="Passcode length"
                ></v-select> -->
              </v-col>
            </v-row>

            <v-card-title>{{ $t("Set Expiration Time") }}</v-card-title>
            <v-row class="mx-4 my-0">
              <v-col cols="12" sm="3" md="2">
                <number-input :step="1" inline controls></number-input>
                <v-text-field
                  dense
                  :rules="numberRules"
                  class="shrink>"
                  required
                  :label="$t('Expiration days')"
                >
                </v-text-field>
              </v-col>
            </v-row>

            <v-card-title>{{ $t("Password requirements") }}</v-card-title>
            <v-card-text class="shrink">
              <div>- Use upper-case or lower-case letters (case sensitive)</div>
              <div>- Inclusion of one or more numerical digits</div>
              <div>
                - Inclusion of one or more special characters:
                &#62;&#60;)(&#38;$+;:=?@#|.^*_~{}%!-'
              </div>
            </v-card-text>
          </v-sheet>

          <v-btn
            color="primary"
            class="mr-4"
            @click="saveDetails"
            v-bind:loading="loading"
            >Save
          </v-btn>
        </v-card>
      </v-tab-item>
      <!--
        
        -->

      <v-tab-item key="rules" class="bg">
        <v-card color="bg">
          <v-card-title>
            {{ $t("Rules List") }}
            <v-spacer></v-spacer>
            <v-text-field 
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            color="bg"
            :headers="deviceRulesHead"
            :items="deviceRules.blockedDevices"
            :search="search"
            :loading="loading"
            class="ma-4 bg"
            @click:row="rowClick"
          >
            <template v-slot:top>
              <v-toolbar flat color="bg">
                <v-btn
                  class="ma-4"
                  color="primary"
                  @click="ruleDialog = true"
                  >{{ $t("New Rule") }}</v-btn
                >
              </v-toolbar>
            
            
            
            </template>

            <template v-slot:item.actions="{ item }">
              <v-icon small @click="rowClick(item, $event)">mdi-pencil</v-icon>
              <v-icon small @click="deleteDeviceRule(item, $event)" class="mx-2"> mdi-delete </v-icon>
              >
            </template>
          </v-data-table>

          <v-dialog v-model="ruleDialog" overlay-color="bg" max-width="800px">
            <v-card color="bg">
              <v-card-title>Rule Dialog</v-card-title>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>

      <v-tab-item key="other">
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
      </v-tab-item>
    </v-tabs-items>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="info" text v-bind="attrs" @click="snackbarSave = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
  <!--<v-btn @click="refresh">Refresh</v-btn>-->
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "EmailSetup",
  data: () => ({
    tab: {},
    deviceApproval: {},
    authentication: {},
    deviceRules: {},
    loading: true,

    snackbarSave: false,
    snackbarText: "",
    deviceApprovalStr: "",
    authenticationStr: "",
    deviceRulesStr: "",
    approveType: "selfapprove",
    notifType: "pushnotif",
    emailRules: [],
    numberRules: [],
    passLengthRules: [],
    deviceRulesHead: [],
    search: "",
    ruleDialog: false,
    appData,
  }),
  methods: {
    notifTypeChange: function(newVal) {
      if (newVal == "pushnotif") {
        this.deviceApproval.notifierAdmin = "PUSH@nubo.local";
      } else if (this.deviceApproval.notifierAdmin == "PUSH@nubo.local") {
        this.deviceApproval.notifierAdmin = "";
      }
    },
    refresh: function() {
      appUtils
        .get({
          url: "api/security/deviceApproval",
        })
        .then((response) => {
          console.log(
            `deviceApproval: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.deviceApproval = response.data;
            this.deviceApproval.deviceApprovalType = this.deviceApproval.deviceApprovalType.toString(
              10
            );
            if (this.deviceApproval.notifierAdmin == "PUSH@nubo.local") {
              this.notifType = "pushnotif";
            } else {
              this.notifType = "emailnotif";
            }
            this.deviceApprovalStr = JSON.stringify(
              this.deviceApproval,
              null,
              2
            );
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
      appUtils
        .get({
          url: "api/security/authentication",
        })
        .then((response) => {
          console.log(
            `authentication: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.authentication = response.data;
            this.authenticationStr = JSON.stringify(
              this.authentication,
              null,
              2
            );
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));

      appUtils
        .get({
          url: "api/security/deviceRules",
        })
        .then((response) => {
          console.log(`deviceRules: ${JSON.stringify(response.data, null, 2)}`);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.deviceRules = response.data;
            this.deviceRulesStr = JSON.stringify(this.deviceRules, null, 2);
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateDeviceApproval: function() {
      appUtils
        .post({
          url: "api/security/deviceApproval",
          data: this.deviceApproval,
        })
        .then((response) => {
          console.log(
            `updateDeviceApproval: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device approval updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateAuthentication: function() {
      let data = {
        passcodeType: this.authentication.passcodeType ? "1" : "0",
        minChars: this.authentication.passcodeMinChars,
        expirationDays: this.authentication.passcodeExpirationDays,
      };
      appUtils
        .post({
          url: "api/security/authentication",
          data: data,
        })
        .then((response) => {
          console.log(
            `updateAuthentication: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Authentication method updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    addDeviceRule: function(ruleTitle, ruleFilter) {
      let data = {
        ruleName: ruleTitle,
        filterName: ruleFilter,
      };
      appUtils
        .put({
          url: "api/security/deviceRules",
          data: data,
        })
        .then((response) => {
          console.log(
            `addDeviceRule: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was added");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateDeviceRule: function(ruleID, ruleFilter) {
      let data = {
        ruleid: ruleID,
        filterName: ruleFilter,
      };
      appUtils
        .post({
          url: "api/security/deviceRules",
          data: data,
        })
        .then((response) => {
          console.log(
            `updateDeviceRule: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was updated");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    deleteDeviceRule: function(ruleID, ruleTitle, ruleFilter) {
      let data = {
        ruleid: ruleID,
        ruleName: ruleTitle,
        filterName: ruleFilter,
      };
      appUtils
        .delete({
          url: "api/security/deviceRules",
          data: data,
        })
        .then((response) => {
          console.log(
            `deleteDeviceRule: ${JSON.stringify(response.data, null, 2)}`
          );
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was deleted");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText =
              this.$t("Error") + " - " + response.data.message;
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
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
        disabled: false,
      },
      {
        text: this.$t("Security Settings"),
        href: "/#/Security",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    this.emailRules = [
      (v) => !!v || this.$t("Email is required"),
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        this.$t("Email must be valid"),
    ];

    this.numberRules = [
      (v) => !isNaN(v) || this.$t("Please enter a valid number"),
    ];

    this.passLengthRules = [
      (v) => !isNaN(v) || this.$t("Please enter a valid number"),
      (v) => (v >= 6 && v <= 18) || this.$t("Valid range: 6 - 18"),
    ];

    this.deviceRulesHead = [
      { text: this.$t("Title"), value: "ruleName" },
      { text: this.$t("Filter"), value: "filterName" },
    ];

    this.refresh();
  },
};

export default page;
</script>
