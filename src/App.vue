<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title"
            >Admin Control Panel</v-list-item-title
          >
          <!--<v-list-item-subtitle>{{ appData.orgname }}</v-list-item-subtitle>-->
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
    
        <v-select
          :items="appData.orgs"
          :label="$t('Organization')"
          item-text="domainName"
          item-value="maindomain"
          :value="appData.mainDomain"
          @change="orgChanged"
        ></v-select>
      </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          link
          :to="item.link"
        >
         
          <v-list-item-icon>
           
            <v-icon >{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app>
      <v-breadcrumbs :items="items" divider=">"></v-breadcrumbs>
      <v-spacer></v-spacer>
      <v-menu
        v-if="appData.isAuthenticated"
        :close-on-content-click="true"
        :nudge-width="200"
        offset-x
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon large color="blue darken-2">mdi-account</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-list>
            <v-list-item>
              <v-list-item-avatar>
                <v-icon large color="darken-2">mdi-account</v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title
                  >{{ appData.firstname }}
                  {{ appData.lastname }}</v-list-item-title
                >
                <v-list-item-subtitle>{{ appData.email }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list>
            <v-list-item @click="logoutClick">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main>
      <!--  -->
      <router-view @updatePage="updatePage"></router-view>
    </v-main>
  </v-app>
</template>

<script>
import appData from "./modules/appData";
import appUtils from "./modules/appUtils";

export default {
  data: () => ({
    drawer: true,
    moduleName: "Control Panel",
    menuItems: [
      { title: "Profiles", icon: "mdi-account-multiple-outline", link: "/Profiles" },
      { title: "Groups", icon: "mdi-account-group", link: "/Groups" },
      { title: "Apps", icon: "mdi-apps", link: "/Apps" },
      { title: "Exchange", icon: "mdi-email" },
      { title: "Active Directory", icon: "mdi-microsoft" , link: "/LDAP" },
      { title: "Administrators", icon: "mdi-account-tie" , link: "/Admins" },
      { title: "Security", icon: "mdi-shield-account", link: "/Security" },
      { title: "Dashboard and Reports", icon: "mdi-chart-bar" },
    ],
    items: [
      {
        text: "Text",
        href: "/",
      },
    ],
    appData,
  }),
  methods: {
    updatePage: function (items) {
      //this.moduleName = moduleName;
      console.log("updatePage: items: " + items);
      if (Array.isArray(items)) {
        this.items = items;
      } else {
        this.items = this.defItems;
      }
    },
    orgChanged: function (val) {
      console.log("orgChanged: "+val);
      appUtils
        .put({
          url: "api/orgs/" + encodeURIComponent(val),
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log("Success");
            this.appData.mainDomain = val;
            this.appData.commit();
            location.reload();
          } else {
            console.log(`status: ${response.data.status}`);
            //this.$router.push("/Login");
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    logoutClick: function () {
      appData.logout();
      this.$router.push("/Login");
    },
  },
  created: function () {
    this.items = [{
      text: this.$t("control-panel"),
      href: "/#/",
      disabled: false,
    }];
    this.defItems = this.items;
    console.log("created: items: " + this.items);
  },
};
</script>
