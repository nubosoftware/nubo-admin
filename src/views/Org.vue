<template>
  <v-card color="bg">
    <v-card-title>
      {{ $t("Organization") }}
    </v-card-title>
    <v-form 
            ref="form"
            v-model="valid" >
      <v-container>
        <v-row >
          <v-col class="py-2">
             <v-text-field
                    :label="$t('Domain')"
                    v-model="details.maindomain"
                    :readonly="!newOrg"
                    :rules="requiredRules"
                  />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
             <v-text-field
                    :label="$t('Organization Name')"
                    v-model="details.orgname"
                  />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
             <v-text-field
                    :label="$t('Invite Profile URL')"
                    v-model="details.inviteurl"
                  />
          </v-col>
        </v-row>
        <v-row >
          <v-col class="py-2">
             <v-text-field
                    :label="$t('Watermark')"
                    v-model="details.watermark"
                  />
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
  name: "Org",
  data: () => ({
    domain: "",
    newOrg: true,
    snackbarSave: false,
    snackbarText: "",
    details: {},
    valid: true,
    appData
  }),
  methods: {
    
    saveDetails: function () {
      this.$refs.form.validate();
      if (!this.valid) {
        return;
      }
      if (this.newOrg) {
          this.domain = this.details.maindomain;
      }

      let details = this.details;
      
      this.saveLoading = true;
      console.log(details);
      appUtils.post({
        url: "api/orgs/" + encodeURIComponent(this.domain),
        data: details
      }).then((response) => {
        this.saveLoading = false;
        console.log(response.data);
        if (response.data.status == 1) {
          
          this.snackbarText = this.$t("Saved");
          if (this.newOrg) {
              this.newOrg = false;
              this.snackbarText = this.$t("Domain added");
              this.snackbarSave = true;
              this.updatePageHead();
              this.$router.replace("/Org/" + encodeURIComponent(this.domain));
              this.refreshAppDataOrgs();
            }
          this.snackbarSave = true;
          this.refresh();
        } else {
          console.log(`status: ${response.data.status}`);
          this.snackbarSave = true;
          this.snackbarText = this.$t("Error");
        }

      }).catch((error) => console.log(error))
    },
    refresh: function () {
      if (this.newOrg) {
        return;
      }
      console.log(`domain: ${this.domain}`);
      appUtils
        .get({
          url: "api/orgs/" + encodeURIComponent(this.domain),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            if (response.data.orgs && response.data.orgs.length == 1) {
                this.details = response.data.orgs[0];
            } else {
                this.details = {};
            }
            
            
            

          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    refreshAppDataOrgs: function() {
        appUtils
        .get({
          url: "api/orgs" ,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.orgs;
            if (this.rows) {
                appData.resetOrgs(this.rows);
            }
            

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
          text: this.$t("Organizations"),
          to: "/Orgs",
          disabled: false,
        },
        {
          text: this.domain,
          to: "/Org/" + this.domain,
          disabled: false,
        },
      ];
      this.$emit("updatePage", bcItems);
    },
  },
  created: function () {
    this.domain = this.$route.params.domain;

    if (!this.domain) {
      this.domain = "";
    }
    if (this.domain == "") {
      this.newOrg = true;
    } else {
      this.newOrg = false;
    }

    this.requiredRules = [
      (v) => !!v || this.$t("Field is required"),
    ];

    this.updatePageHead();

    this.refresh();
  },
  watch: {
    
  }
};

export default page;
</script>
