<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      app
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Admin Control Panel
          </v-list-item-title>
          <v-list-item-subtitle>
            admin@company.com
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list
        dense
        nav
      >
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          link
          :to="item.link"
        >
       
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
    
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app>
    
      <v-toolbar-title>{{moduleName}}</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <!--  -->
      <router-view @updatePage="updatePage"></router-view>
    </v-main>
  </v-app>
</template>

<script>
  import appData from "./modules/appData";


  export default {
    data: () => ({ 
      drawer: true,
      moduleName: "Control Panel",
      menuItems: [
          { title: 'Profiles', icon: 'mdi-view-dashboard' , link: '/about'},
          { title: 'Groups', icon: 'mdi-image' },
          { title: 'Apps', icon: 'mdi-help-box' },
          { title: 'Exchange', icon: 'mdi-view-dashboard' },
          { title: 'Active Directory', icon: 'mdi-view-dashboard' },
          { title: 'Administrators', icon: 'mdi-view-dashboard' },
          { title: 'Security', icon: 'mdi-view-dashboard' },
          { title: 'Dashboard and Reports', icon: 'mdi-view-dashboard' },
        ],
        appData,
    }),
    methods: {
      updatePage: function(moduleName) {
        this.moduleName = moduleName;
      }
    }
  }
</script>
