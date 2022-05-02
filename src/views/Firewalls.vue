<template>
  <v-card color="bg"> 
    <v-card-title>
      {{ $t("Firewalls") }}
      
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :items-per-page="10"
      :search="search"
      class="ma-4 bg"
      @click:row="rowClick"
    >
    <template v-slot:top>
        <v-toolbar flat color="bg">
          <v-btn            
            class="ma-4"
            color="primary" @click="dialogNew = true">{{
            $t("New Firewall")
          }}</v-btn>
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
    
    <template v-slot:[`item.actions`]="{ item }">
      <v-icon small @click="deleteFirewall(item,$event)" class="mx-2"> mdi-delete </v-icon>
    </template>
    </v-data-table>
    <v-dialog v-model="dialogDelete" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("Remove Firewall") }}</v-card-title>
        <v-card-subtitle class="mt-4">{{
          $t("Are you sure you want to remove the selected firewall? \n All resules will be deleted.")
        }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="dialogDelete = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            @click="dialogDelete = false | removeFirewall()"
            >{{ $t("Remove Firewall") }}</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
     <v-dialog v-model="dialogNew" max-width="500px" overlay-color="bg">
      <v-card color="bg">
        <v-card-title>{{ $t("New Firewall") }}</v-card-title>
         <v-container class="ma-4">
          <v-form ref="addForm" v-model="addValid">
              <v-text-field
                :label="$t('Firewall Name')" 
                :rules="requiredRules"               
                v-model="addFirewallName"
              />
          </v-form>
         </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" @click="dialogNew = false">{{
            $t("Cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            @click="addFirewall()"
            >{{ $t("Add Firewall") }}</v-btn
          >
          <v-spacer></v-spacer>
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
          {{$t("Close")}}
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

let page = {
  name: "Groups",
  data: () => ({
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    dialogDelete: false,
    removeItem: null,
    snackbarSave: false,
    snackbarText: "",
    addFirewallName: "",
    dialogNew: false,
    requiredRules: [],
    addValid: true,
    appData
  }),
  methods: {
    rowClick: function(val) {
      console.log(`rowClick: ${val.firewall_id}`);
      this.$router.push("/Firewall/" + val.firewall_id );
    },
    addFirewall: function() {
      let v = this.$refs.addForm.validate();
      if (!this.addValid) {
        console.log(`addValid: ${this.addValid}, v: ${v}`);
        return;
      }
      this.dialogNew = false;
      appUtils
        .put({
          url: `api/firewall`,
          data: {
              firewall_name: this.addFirewallName
          }
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Firewall Added");
            this.snackbarSave = true;
            this.addFirewallName = "";
            this.refresh();
            this.$router.push("/Firewall/" + response.data.firewall.firewall_id );
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },
    deleteFirewall: function(val,event) {
      console.log(`deleteFirewall: ${val.firewall_id}`);
      event.stopPropagation();
      this.dialogDelete = true;
      this.removeItem = val;
      return false;
    },
    removeFirewall : function() {
      let firewall_id = this.removeItem.firewall_id;
     
      console.log("firewall_id: "+firewall_id);
      appUtils
        .delete({
          url: `api/firewall/${encodeURIComponent(firewall_id)}`
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.snackbarText = this.$t("Firewall removed");
            this.snackbarSave = true;
            this.dialogDelete = false;
            this.refresh();
          } else {
            console.log(`status: ${response.data.status}`);
            this.snackbarText = this.$t("Error");
            this.snackbarSave = true;
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    },

    refresh: function() {
      appUtils
        .get({
          url: "api/firewall"
        })
        .then(response => {
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.results;
          } else {
            console.log(`status: ${response.data.status}`);
            this.$router.push("/Login");
          }
        })
        .catch(error => console.log(error))
        .finally(() => (this.loading = false));
    }
  },
  created: function() {
    let bcItems = [
      {
        text: this.$t("control-panel"),
        to: "/",
        disabled: false
      },
      {
        text: this.$t("Firewalls"),
        to: "/Firewalls",
        disabled: false
      }
    ];
    this.$emit("updatePage", bcItems);
    this.requiredRules = [
      (v) => !!v || this.$t("Field is required"),
    ];
    this.headers = [
      {
        text: this.$t("Name"),
        value: "firewall_name"
      },      
      { text: this.$t('Actions'), value: 'actions', sortable: false }
    ];
    this.refresh();
  }
};

export default page;
</script>
