import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import appData from '../modules/appData'

Vue.use(VueRouter)

const routes = [{
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/Login',
        name: 'Login',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Login.vue'),
    },
    {
        path: '/Profiles',
        name: 'Profiles',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Profiles.vue'),
    },
    {
        path: '/Profile/:id',
        name: 'ProfileEdit',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Profile.vue'),
    },
    {
        path: '/Profile/',
        name: 'Profile',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Profile.vue'),
    },
    {
        path: '/Groups',
        name: 'Groups',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Groups.vue'),
    },
    {
        path: '/Group/:groupName/:adDomain',
        name: 'GroupAD',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Group.vue'),
    },
    {
        path: '/Group/:groupName',
        name: 'GroupName',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Group.vue'),
    },
    {
        path: '/Group/',
        name: 'Group',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Group.vue'),
    },

    {
        path: '/LDAP',
        name: 'LDAP',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/LDAP.vue'),
    },
    {
        path: '/LDAP/:addomain',
        name: 'LDAPDomain',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/LDAPDomain.vue'),
    },
    {
        path: '/Admins',
        name: 'Admins',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Admins.vue'),
    },
    {
        path: '/Admin/:email',
        name: 'Admin',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Admin.vue'),
    },
    {
        path: '/Apps',
        name: 'Apps',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Apps.vue'),
    },
    {
        path: '/App/:packageName',
        name: 'App',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/AppDetails.vue'),
    },
    {
        path: '/EmailSetup',
        name: 'EmailSetup',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/EmailSetup.vue'),
    },
    {
        path: '/Security',
        name: 'Security',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Security.vue'),
    },
    {
        path: '/Orgs',
        name: 'Orgs',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Orgs.vue'),
    },
    {
        path: '/Org/:domain',
        name: 'Org',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Org.vue'),
    },
    {
        path: '/Org/',
        name: 'Org',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Org.vue'),
    },
    {
        path: '/Reports/:reportCode',
        name: 'Report',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Reports.vue'),
    },
    {
        path: '/Reports',
        name: 'Reports',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Reports.vue'),
    },
    {
        path: '/Platforms',
        name: 'Platforms',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Platforms.vue'),
    },
    {
        path: '/Logs',
        name: 'Logs',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Logs.vue'),
    },
    {
        path: '/Telephony',
        name: 'Telephony',
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/Telephony.vue'),
    },
    {
        path: '/Message',
        name: 'Message',
        component: () =>
            import ('../views/Message.vue'),
        props: true,
    }
]

const router = new VueRouter({
    routes
})


const noLoginRoutes = {
    "About": 1,
    "Message": 1,
};

router.beforeEach((to, from, next) => {
    if (to.name !== 'Login' && !appData.isAuthenticated && !(noLoginRoutes[to.name])) {
        console.log("Detect no login in route: " + to.name);
        //console.log(to);
        next({ name: 'Login' })
    } else next()
})
export default router