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
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
            import ( /* webpackChunkName: "about" */ '../views/About.vue'),
        props: { newsletterPopup: false }
    }
]

const router = new VueRouter({
    routes
})

router.beforeEach((to, from, next) => {
    if (to.name !== 'Login' && !appData.isAuthenticated) next({ name: 'Login' })
    else next()
})
export default router