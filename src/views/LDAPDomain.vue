<template>
  <v-card>
    <v-toolbar color="cyan" dark flat>
      <v-toolbar-title>{{ $t("LDAP Domain") }}: {{ addomain }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="yellow"></v-tabs-slider>

          <v-tab key="setup"> Setup </v-tab>
          <v-tab key="ous" :disabled="disableOUs"> Organization Units </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item key="setup">
        <v-card flat>
          <v-form ref="form" v-model="formValid">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('LDAP Domain')"
                    v-model="ldapDetails.addomain"
                    :disabled="addominReadonly"
                    :rules="[(v) => !!v || $t('Required')]"
                    @change="addomainChanged"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Host')"
                    v-model="ldapDetails.host"
                    :rules="[(v) => !!v || $t('Required')]"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Port')"
                    v-model="ldapDetails.port"
                    :disabled="portReadonly"
                    :rules="[
                      (v) => !!v || $t('Required'),
                      (v) => /^[0-9]{1,5}$/.test(v) || 'Port must be a number',
                    ]"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-select
                    :items="connectionTypeItems"
                    :label="$t('Connection Type')"
                    :value="connectionType"
                    @change="connectionTypeChanged"
                    :rules="[(v) => !!v || $t('Required')]"
                  ></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('User Name')"
                    v-model="ldapDetails.username"
                    :rules="[(v) => !!v || $t('Required')]"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Password')"
                    v-model="ldapDetails.password"
                    :rules="[(v) => !!v || $t('Password is required')]"
                    :type="showPass ? 'text' : 'password'"
                    :append-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPass = !showPass"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    :label="$t('Base DN')"
                    v-model="ldapDetails.basedn"
                    :rules="[(v) => !!v || $t('Required')]"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    :disabled="!formValid"
                    color="success"
                    class="mr-4"
                    @click="saveForm"
                    v-bind:loading="saveLoading"
                  >
                    {{ $t("Save") }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card>
      </v-tab-item>
      <v-tab-item key="ous">
        <v-card flat>
          <v-treeview
            selectable
            item-disabled="locked"
            selection-type="leaf"
            :items="items"
            :value="value"
            open-all
            @input="input"
          ></v-treeview>
          <v-btn
            color="success"
            class="ma-4"
            v-bind:loading="saveOULoading"
            @click="saveOUs"
            :disabled="disableOUs"
          >
            Save OUs
          </v-btn>
        </v-card>
      </v-tab-item>
    </v-tabs-items>

    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbarSave = false">
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
  name: "LDAP",
  data: () => ({
    createLDAP: false,
    tab: {},
    addomain: {},
    ldapDetails: {},
    items: [],
    ousList: [],
    value: [],
    inputValues: [],
    formValid: true,
    showPass: false,
    connectionTypeItems: [],
    connectionType: "auto",
    snackbarSave: false,
    snackbarText: "",
    saveLoading: false,
    saveOULoading: false,
    portReadonly: false,
    addominReadonly: false,
    disableOUs: true,
    appData,
  }),
  watch: {
    "ldapDetails.addomain": function (newVal) {
      console.log("ldapDetails.addomain: " + newVal);
      if (this.createLDAP && newVal.length > 0) {
        let arr = newVal.split(".");
        for (let i = 0; i < arr.length; i++) {
          arr[i] = "DC=" + arr[i];
        }
        this.ldapDetails.basedn = arr.join(",");
      }
    },
  },
  methods: {
    input: function (val) {
      console.log(`input: ${val}`);
      //this.$router.push("/Group/" + val.groupName + "/" + val.adDomain);
      this.inputValues = val;
    },

    connectionTypeChanged: function (val) {
      console.log(`connectionTypeChanged: ${val}`);
      if (val == "auto") {
        this.portReadonly = true;
      } else {
        this.portReadonly = false;
        if (val == "ldaps://") {
          console.log("Change port to 636");
          this.ldapDetails.port = "636";
        } else {
          console.log("Change port to 389");
          this.ldapDetails.port = "389";
        }
        this.$forceUpdate();
      }
    },

    saveForm: function () {
      this.$refs.form.validate();
      if (this.formValid) {
        this.saveLoading = true;
        appUtils
          .put({
            url: "api/ldap/" + encodeURIComponent(this.ldapDetails.addomain),
            data: {
              host: this.ldapDetails.host,
              user: this.ldapDetails.username,
              password: this.ldapDetails.password,
              port: this.ldapDetails.port,
              baseDN: this.ldapDetails.basedn,
              sync: true,
              SSL: this.connectionType
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status == 1) {
              console.log("Success");
              this.saveLoading = false;
              this.snackbarText = "Saved";
              this.snackbarSave = true;
              this.addomain = this.ldapDetails.addomain;
              this.createLDAP = false;
              this.addominReadonly = true;
              this.refresh();

            } else {
              console.log(`status: ${response.data.status}`);
              this.saveLoading = false;
              if (response.data.message) {
                if (response.data.message.message && response.data.message.name) {
                  this.snackbarText = `${this.$t("Error")}: ${response.data.message.name} - ${response.data.message.message}`;
                } else {
                  this.snackbarText = `${this.$t("Error")}: ${response.data.message}`;
                }
              } else {
                this.snackbarText = "Error";
              }
              this.snackbarSave = true;
            }
          })
          .catch((error) => console.log(error))
          .finally(() => (this.loading = false));
      } else {
        console.log("Invalid!");
      }
    },

    addomainChanged: function (val) {
      console.log(`addomainChanged: ${val}`);
    },

    saveOUs: function () {
      let orgUnits = [];
      for (let i = 0; i < this.inputValues.length; i++) {
        let ind = this.inputValues[i];
        orgUnits.push(this.ousList[ind].key);
      }
      console.log("Selected orgUnits: " + JSON.stringify(orgUnits));
      this.saveOULoading = true;
      appUtils
        .post({
          url: "api/ldap/" + encodeURIComponent(this.addomain),
          data: {
            orgUnits,
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.saveOULoading = false;
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
        .finally(() => (this.loading = false));
    },
    refresh: function () {
      this.disableOUs = true;
      appUtils
        .get({
          url: "api/ldap",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            response.data.ldapDomains.forEach((ldapDetails) => {
              if (ldapDetails.addomain == this.addomain) {
                this.addominReadonly = true;
                //this.ldapDetails = ldapDetails;
                let arr = ldapDetails.connectionurl.split("://");
                if (arr.length == 2) {
                  let arr2 = arr[1].split(":");
                  this.ldapDetails.host = arr2[0];
                  this.ldapDetails.port = arr2[1];
                  if (arr[0] == "ldaps" || arr[0] == "ldap") {
                    this.connectionType = arr[0] + "://";
                  }
                }
                this.ldapDetails.password = ldapDetails.password;
                this.ldapDetails.addomain = ldapDetails.addomain;
                this.ldapDetails.username = ldapDetails.username;
                this.ldapDetails.basedn = ldapDetails.basedn;
              }
            });
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));

      appUtils
        .get({
          url: "api/ldap/" + encodeURIComponent(this.addomain),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            //this.rows = response.data.ldapDomains;
            console.log(`status: ${response.data.status}`);
            this.ousList = response.data.ousList;
            let ous = {};
            this.items = [];
            this.value = [];
            for (let i = 0; i < this.ousList.length; i++) {
              let ou = this.ousList[i];
              let item = {
                id: i,
                name: ou.ouName,
                children: [],
              };
              //console.log("Item: " + JSON.stringify(item, null, 2));
              ous[ou.key] = item;
              if (ou.checked) {
                this.value.push(i);
              }
              if (ou.level == 0) {
                this.items.push(item);
                this.disableOUs = false;
              } else {
                let arr = ou.key.split(",");
                arr.shift();
                let parentKey = arr.join(",");
                let parent = ous[parentKey];
                if (parent) {
                  parent.children.push(item);
                } else {
                  console.log("Parent not found: " + parentKey);
                }
              }
            }
            //console.log("Items: " + JSON.stringify(this.items, null, 2));
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
  },
  created: function () {
    if (this.$route.params.addomain != "CREATELDAP") {
      this.addomain = this.$route.params.addomain;
    } else {
      this.addomain = "";
      this.createLDAP = true;
      this.addominReadonly = false;
      this.ldapDetails = {
        addomain: "",
        port: "389",
        host: "",
        username: "",
        basedn: "",
      };
    }
    let bcItems = [
      {
        text: this.$t("control-panel"),
        href: "/#/",
        disabled: false,
      },
      {
        text: this.$t("LDAP"),
        href: "/#/LDAP",
        disabled: false,
      },
      {
        text: this.addomain,
        href: "/#/LDAP/" + encodeURIComponent(this.addomain),
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    this.connectionTypeItems = [
      { text: this.$t("Automatic"), value: "auto" },
      { text: this.$t("LDAP Over SSL"), value: "ldaps://" },
      { text: this.$t("LDAP"), value: "ldap://" },
    ];
    if (!this.createLDAP) {
      this.refresh();
    }
  },
};

export default page;
</script>