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
          <v-tab key="approval"> Device approval </v-tab>
          <v-tab key="auth"> Authentication </v-tab>
          <v-tab key="rules" v-if="appData.isMobile()" > Device Rules </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="approval">
        <v-card flat class="ma-0" color="bg" tile>
          <v-card-title>{{ $t("Device approval options") }}</v-card-title>
          <v-form ref="formApproval" v-model="validFormApproval">
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
                
                v-on="on"
              ></v-radio>
              <v-radio
                label="Both"
                value="2"
                
                v-on="on"
              ></v-radio>
            </v-radio-group>

            <v-sheet color="bg" v-if="deviceApproval.deviceApprovalType != '0'">
              <v-card-title>{{ $t("Notify admins by:") }}</v-card-title>
              <v-radio-group
                v-model="notifType"
                @change="notifTypeChange"
                column
                class="mx-4 my-0"
              >
                <v-radio
                  :label="$t('Push notification to admins devices')"
                  class="mb-4"
                  value="pushnotif"
                ></v-radio>
                <v-radio
                  :label="$t('Email to a dedicated email address')"
                  value="emailnotif"
                  
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
              @click="updateDeviceApproval"
              v-bind:loading="updateDeviceApprovalLoading"
              >Save
            </v-btn>
          </v-form>
        </v-card>
      </v-tab-item>

      <v-tab-item key="auth">
        <v-card flat class="ma-0" color="bg">
          <v-form ref="formAuth" v-model="validFormAuth">
            <v-select
            class="ma-4"
              :items="authFactors"
              :label="$t('Authentication methods')"
              v-model="authentication.clientauthtype"
            ></v-select>
            <v-container v-if="authentication.clientauthtype == 1 || authentication.clientauthtype == 3 || authentication.clientauthtype == 4">
            <v-card-subtitle>{{ $t("Password options") }}</v-card-subtitle>
            <v-radio-group
              v-model="authentication.passcodeType"
              column
              class="mx-4 my-0"
            >
              <v-radio
                :label="$t('Passcode (digits)')"
                class="mb-4"
                value="0"
              ></v-radio>
              <v-radio
                :label="$t('Password (contains characters)')"
                class="mb-4"
                value="1"
              >
              </v-radio>
            </v-radio-group>
            <v-container v-if="authentication.passcodeType == '1'">
              <v-card-subtitle>{{ $t("Password requirements") }}</v-card-subtitle>
              <v-card-text class="shrink">
                <div>
                  {{$t('- Use upper-case or lower-case letters (case sensitive)')}}
                </div>
                <div>{{$t('- Include one or more numerical digits')}}</div>
                <div>
                  {{$t('- Include one or more special characters:')}}
                  &#62;&#60;)(&#38;$+;:=?@#|.^*_~{}%!-'
                </div>
              </v-card-text>
              </v-container>

            <v-sheet color="bg">
              <v-card-subtitle>{{ $t("Password minimum length") }}</v-card-subtitle>

              <v-row class="mx-4 my-0">
                <v-col cols="12" sm="3" md="2">
                  <v-text-field
                    dense
                    v-model="authentication.passcodeMinChars"
                    :rules="passLengthRules"
                    class="shrink"
                    required
                    :label="$t('Password length')"
                  />
                  <!--
                <v-select
                  :items="Passlenval"
                  :menu-props="{ top: true, offsetY: true }"
                  label="Passcode length"
                ></v-select> -->
                </v-col>
              </v-row>

              <v-card-subtitle>{{ $t("Set Expiration Time") }}</v-card-subtitle>
              <v-card-subtitle>{{
                $t(
                  "Ask users to change password every (insert 0 for unlimited)"
                )
              }}</v-card-subtitle>
              <v-row class="mx-4 my-0">
                <v-col cols="12" sm="3" md="2">
                  <number-input :step="1" inline controls></number-input>
                  <v-text-field
                    dense
                    v-model="authentication.passcodeExpirationDays"
                    :rules="numberRules"
                    class="shrink>"
                    required
                    :label="$t('Expiration days')"
                  >
                  </v-text-field>
                </v-col>
              </v-row>
              
            </v-sheet>
            </v-container>
            <v-container  v-if="authentication.clientauthtype == 2 || authentication.clientauthtype == 3 || authentication.clientauthtype == 4">
              <v-select
            class="ma-4"
              :items="secondFactorMethods"
              :label="$t('Second factor authentication methods')"
              v-model="authentication.secondauthmethod"
            ></v-select>
              
            </v-container>

            <v-container  v-if="(authentication.clientauthtype == 2 || authentication.clientauthtype == 3 || authentication.clientauthtype == 4) && (authentication.secondauthmethod > 1)">
              <v-select
            class="ma-4"
              :items="otpTypes"
              :label="$t('OTP methods')"
              v-model="authentication.otptype"
            ></v-select>
              
            </v-container>

            <v-btn
              color="primary"
              class="ma-4"
              @click="updateAuthentication"
              v-bind:loading="loadingUpdateAuth"
              >Save
            </v-btn>
          </v-form>
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
              
              <v-icon
                small
                @click="deleteDeviceRule(item, $event)"
                class="mx-2"
              >
                mdi-delete
              </v-icon>
              
            </template>
          </v-data-table>

          <v-dialog v-model="ruleDialog" overlay-color="bg" max-width="800px">
            <v-card color="bg">
              <v-card-title>{{$t('Add Rule')}}</v-card-title>
              <v-form ref="formAddRule" v-model="validFormAddRule">
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field
                      v-model="addRuleTitle"
                      label="Rule Title"
                      class="mx-8 my-0"
                      :rules="reqRules"
                      required
                    >
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field
                      v-model="addRuleFilter"
                      label="Filter"
                      class="mx-8 my-0"
                      :rules="reqRules"
                      required
                    >
                    </v-text-field>
                  </v-col>
                </v-row>
                 <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <v-btn
                      color="primary"
                      class="ma-4"
                      @click="addDeviceRule"
                      v-bind:loading="addRuleLoading"
                      >Save
                    </v-btn>
                  </v-col>
                 </v-row>
              </v-form>
            </v-card>
          </v-dialog>
        </v-card>
      </v-tab-item>

      
    </v-tabs-items>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="690"
    >
      
      <v-card>
        <v-card-title >
          {{$t('WarningPasswordOptionChange')}}
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          
          <v-btn
            color="error darken-1"
            text
            @click="dialog = false"
          >
            {{$t('No')}}
          </v-btn>
          <v-btn
            color="success darken-1"
            text
            @click="dialog = false"
          >
            {{$t('Yes')}}
          </v-btn>
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
    approveType: "selfapprove",
    notifType: "pushnotif",
    emailRules: [],
    numberRules: [],
    passLengthRules: [],
    deviceRulesHead: [],
    search: "",
    ruleDialog: false,
    updateDeviceApprovalLoading: false,
    validFormApproval: null,
    loadingUpdateAuth: false,
    validFormAuth: null,
    dialog: false,
    validFormAddRule: false,
    addRuleTitle: "",
    addRuleFilter: "",
    addRuleLoading: false,
    reqRules: [],
    appData,
  }),
  methods: {
    notifTypeChange: function (newVal) {
      if (newVal == "pushnotif") {
        this.deviceApproval.notifierAdmin = "PUSH@nubo.local";
      } else if (this.deviceApproval.notifierAdmin == "PUSH@nubo.local") {
        this.deviceApproval.notifierAdmin = "";
      }
    },
    refresh: function () {
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
            if (
              this.authentication.passcodeType == 1 ||
              this.authentication.passcodeType == "1"
            ) {
              this.authentication.passcodeType = "1";
            } else {
              this.authentication.passcodeType = "0";
            }
            
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
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    updateDeviceApproval: function () {
      this.$refs.formApproval.validate();
      if (!this.validFormApproval) {
        return;
      }
      this.updateDeviceApprovalLoading = true;
      appUtils
        .post({
          url: "api/security/deviceApproval",
          data: this.deviceApproval,
        })
        .then((response) => {
          this.updateDeviceApprovalLoading = false;
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
    
    updateAuthentication: function () {
      this.$refs.formAuth.validate();
      if (!this.validFormAuth) {
        return;
      }
      this.loadingUpdateAuth = true;
      let data = {
        passcodeType: this.authentication.passcodeType,
        minChars: this.authentication.passcodeMinChars,
        expirationDays: this.authentication.passcodeExpirationDays.toString(10),
        clientauthtype: this.authentication.clientauthtype,
        secondauthmethod: this.authentication.secondauthmethod,
        otptype: this.authentication.otptype,
      };
      console.log("updateAuthentication: "+JSON.stringify(data));
      appUtils
        .post({
          url: "api/security/authentication",
          data: data,
        })
        .then((response) => {
          this.loadingUpdateAuth = false;
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
    addDeviceRule: function () {
      this.$refs.formAddRule.validate();
      if (!this.validFormAddRule) {
        return;
      }
      let data = {
        ruleName: this.addRuleTitle,
        filterName: this.addRuleFilter,
      };
      this.addRuleLoading = true;
      appUtils
        .put({
          url: "api/security/deviceRules",
          data: data,
        })
        .then((response) => {
          console.log(
            `addDeviceRule: ${JSON.stringify(response.data, null, 2)}`
          );
          this.addRuleLoading = false;
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Device rule was added");
            this.snackbarSave = true;
            this.refresh();
            this.addRuleTitle = "";
            this.addRuleFilter = "";
            this.ruleDialog = false;
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
    updateDeviceRule: function (ruleID, ruleFilter) {
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
    deleteDeviceRule: function (item) {
      let data = {
        ruleid: item.ruleId,
        ruleName: item.ruleName,
        filterName: item.filterName,
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
  },

  created: function () {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Security Settings"),
        to: "/Security",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    this.reqRules = [
      (v) => !!v || this.$t("Field is required")
    ];

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
      { text: this.$t('Actions'), value: 'actions', sortable: false },
    ];

    this.authFactors = [
      { text: this.$t("None"), value: 0},
      { text: this.$t("Password only"), value: 1},
      { text: this.$t("Biometric/OTP only"), value: 2},
      { text: this.$t("Both password and biometric/OTP"), value: 3},
      { text: this.$t("Password or biometric/OTP"), value: 4},
    ];
    this.secondFactorMethods = [
      { text: this.$t("Biometric only"), value: 1},
      { text: this.$t("OTP only"), value: 2},
      { text: this.$t("Biometric or OTP"), value: 3},
    ];
    this.otpTypes = [
      { text: this.$t("Time-based One-time Password (TOTP)"), value: 0},
      { text: this.$t("SMS"), value: 1},
    ];

    this.refresh();
  },
};

export default page;
</script>
