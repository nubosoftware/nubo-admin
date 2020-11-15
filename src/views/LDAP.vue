<template>
  <v-card color="bg">
    <v-card-title>{{$t("LDAP Domains")}}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="20"
      :loading="loading"
      
      class="elevation-1 ma-4 bg"
    >
    <template v-slot:top>
      <v-toolbar
        flat
        color="bg"
      >
        <v-btn
              color="primary"
              dark
              class="mb-2"
              @click="addLDAP"
            >
              {{$t("Add LDAP Domain")}}
            </v-btn>
      </v-toolbar>
    </template>
      <template v-slot:item.actions="{ item }">
             <v-icon small @click="rowClick(item)" class="mx-2"> mdi-pencil </v-icon>
              <v-icon small @click="deleteLDAP(item)" class="mx-2"> mdi-delete </v-icon>
            </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="290"
    >
      
      <v-card>
        <v-card-title >
          Delete {{deleteDomain}} LDAP Domain?
        </v-card-title>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="deleteOK"
          >
            OK
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
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "LDAP",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialog: false,
    deleteObj: null,
    deleteDomain: "",
    snackbarSave: false,
    snackbarText: "",
    appData,
  }),
  methods: {
    rowClick: function (val) {
      console.log(`rowClick: ${val.addomain}`);
      this.$router.push("/LDAP/" + val.addomain );
    },
    deleteLDAP: function (val) {
      
      this.deleteObj = val;
      this.deleteDomain = val.addomain;
      this.dialog = true;
    },
    deleteOK: function() {
      console.log(`deleteLDAP: ${this.deleteDomain}`);
      this.dialog = false;
      appUtils.delete({
        url: "api/ldap/"+encodeURIComponent(this.deleteDomain)
      }).then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Saved");
            this.snackbarSave = true;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    addLDAP: function () {
      this.$router.push("/LDAP/CREATELDAP" );
    },

    refresh: function () {
      appUtils
        .get({
          url: "api/ldap",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.ldapDomains;
          } else {
            console.log(`status: ${response.data.status}`);
            this.rows = [];
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
        href: "/#/",
        disabled: false,
      },
      {
        text: this.$t("LDAP"),
        href: "/#/LDAP",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      {
        text: this.$t("LDAP Domain"),
        value: "addomain",
      },
      {
        text: this.$t("URL"),
        value: "connectionurl",
      },
      {
        text: this.$t("Base DN"),
        value: "basedn",
      },
      { text: 'Actions', value: 'actions', sortable: false }
    ];
    this.refresh();
  },
};

export default page;
</script>