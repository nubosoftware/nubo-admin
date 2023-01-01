<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Permissions") }}
    </v-card-title>
    <v-form>
      <v-container>
        <v-row v-if="appData.mainDomain == appData.siteAdminDomain && appData.siteAdmin">
          <v-col class="py-2">
            <v-checkbox
              class="py-0 my-0"
              v-model="siteAdmin"
              :label="$t('Site administrator')"
            ></v-checkbox>
          </v-col>
        </v-row>
        <v-row v-if="!siteAdmin">
          <v-col class="py-2">
            <v-checkbox
              class="py-0 my-0"
              v-model="domainAdmin"
              :label="$t('Domain administrator')"
            ></v-checkbox>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-if="!domainAdmin && !siteAdmin">  
        <v-row  >
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-checkbox
            class="py-0 my-0"
              v-model="profiles"
              :label="$t('Profiles')"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-select
              class="py-0 my-0"
              :items="accessTypes"
              :label="$t('Access type')"
              v-model="permissions['/profiles']"
              :disabled="!permissions['/profiles']"
            ></v-select>
          </v-col>
        </v-row>
        <v-row >
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-checkbox
             class="py-0 my-0"
              v-model="groups"
              :label="$t('Groups')"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-select
              class="py-0 my-0"
              :items="accessTypes"
              :label="$t('Access type')"
              v-model="permissions['/groups']"
              :disabled="!permissions['/groups']"
            ></v-select>
          </v-col>
        </v-row>
        <v-row >
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-checkbox
             class="py-0 my-0"
              v-model="apps"
              :label="$t('Apps')"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-select
              class="py-0 my-0"
              :items="accessTypesApps"
              :label="$t('Access type')"
              v-model="permissions['/apps']"
              :disabled="!permissions['/apps']"
            ></v-select>
          </v-col>
        </v-row>
        <v-row >
          <v-col cols="12" sm="6" md="3" class="py-0">
            <v-checkbox
             class="py-0 my-0"
              v-model="reports"
              :label="$t('Reports')"
            ></v-checkbox>
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              class="mr-4"
              @click="saveDetails"
              v-bind:loading="saveLoading"
            >
              {{$t('Save')}}
            </v-btn>
          </v-col>
        </v-row>
      </v-container></v-form
    >

    <v-dialog
      v-model="dialog"
      persistent
      max-width="290"
    >
      
      <v-card>
        <v-card-title >
          {{$t('Please select atleast one permission')}}
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          
          <v-btn
            color="green darken-1"
            text
            @click="dialog = false"
          >
            {{$t('Close')}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbarSave" :timeout="2000">
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbarSave = false"
        >
          {{ $t("Close") }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Group",
  data: () => ({
    email: "",
    newadmin: true,
    snackbarSave: false,
    snackbarText: "",
    details: null,
    siteAdmin: false,
    domainAdmin: false,
    permissions: {},
    saveLoading: false,
    accessTypes: [],
    accessTypesApps: [],
    profiles: false,
    groups: false,
    apps: false,
    reports: false,
    dialog: false,
    appData
  }),
  methods: {
    checkboxChanged: function (item,value) {
      console.log(`checkboxChanged. item: ${item}, value: ${value}`);
      if (value) {
        if (!this.permissions[item]) {
          this.permissions[item] = "rw";
        }
      } else {
        delete this.permissions[item];
      }
    },
    saveDetails: function () {
      let permissions = this.permissions;
      if (Object.keys(permissions).length == 0) {
        this.dialog = true;
        return
      }
      this.saveLoading = true;
      appUtils.put({
        url: "api/admins/" + encodeURIComponent(this.email),
        data: {
          permissions: JSON.stringify(permissions)
        }
      }).then((response) => {
        this.saveLoading = false;
        console.log(response.data);
        if (response.data.status == 1) {
          this.snackbarSave = true;
          this.snackbarText = this.$t("Saved");
          this.refresh();
        } else {
          console.log(`status: ${response.data.status}`);
          this.snackbarSave = true;
          this.snackbarText = this.$t("Error");
        }

      }).catch((error) => console.log(error))
    },
    refresh: function () {
      console.log(`admin: ${this.email}`);
      appUtils
        .get({
          url: "api/admins/" + encodeURIComponent(this.email),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            this.details = response.data.details;
            if (this.details.admin && this.details.admin.permissions) {
              this.permissions =  JSON.parse(this.details.admin.permissions);
            } else {
              this.permissions = {};
            }
            this.siteAdmin = this.permissions["@/"] == "rw";
            this.domainAdmin = this.permissions["/"] == "rw";
            this.profiles = this.permissions["/profiles"] != undefined;
            this.groups = this.permissions["/groups"] != undefined;
            this.apps = this.permissions["/apps"] != undefined;
            this.reports = this.permissions["/reports"] != undefined;
            

          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },

    updatePageHead: function () {
      let bcItems = [
        {
          text: appData.productName,
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Admins"),
          to: "/Admins",
          disabled: false,
        },
        {
          text: this.email,
          to: "/Admin/" + this.email,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
  },
  created: function () {
    this.email = this.$route.params.email;

    if (!this.email) {
      this.email = "";
    }
    if (this.email == "") {
      this.newadmin = true;
    } else {
      this.newadmin = false;
    }

    this.updatePageHead();

    this.accessTypes = [
      { text: this.$t("Read only"), value: "r"},
      { text: this.$t("Read and Write"), value: "rw"}
    ];
    this.accessTypesApps = [...this.accessTypes,
      { text: this.$t("Read and Install/Uninstall"), value: "ri"}
    ];

    this.refresh();
  },
  watch: {
    profiles: function(newVal) {
      this.checkboxChanged("/profiles",newVal);
    },
    groups: function(newVal) {
      this.checkboxChanged("/groups",newVal);
    },
    apps: function(newVal) {
      this.checkboxChanged("/apps",newVal);
    },
    reports : function(newVal) {
      if (newVal) {
        if (!this.permissions["/reports"]) {
          this.permissions["/reports"] = "r";
        }
      } else {
        delete this.permissions["/reports"];
      }
    },
    domainAdmin: function(newVal) {
      if (newVal) {
        if (!this.permissions["/"]) {
          this.permissions = {};
          this.permissions["/"] = "rw";
          this.reports = false;
          this.apps = false;
          this.groups = false;
          this.profiles = false;
        }
      } else {
        delete this.permissions["/"];
      }
    },
    siteAdmin : function(newVal) {
      if (newVal) {
        if (!this.permissions["@/"]) {
          this.permissions = {};
          this.permissions["@/"] = "rw";
          this.domainAdmin = false;
          this.reports = false;
          this.apps = false;
          this.groups = false;
          this.profiles = false;
        }
      } else {
        delete this.permissions["@/"];
      }
    },
  }
};

export default page;
</script>
