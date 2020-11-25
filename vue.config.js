module.exports = {
    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                args[0].title = 'Nubo - Control Panel'
                return args
            })
    },

    "transpileDependencies": [
        "vuetify"
    ],

    pluginOptions: {
        i18n: {
            locale: 'en',
            fallbackLocale: 'en',
            localeDir: 'locales',
            enableInSFC: true
        },
        moment: {
            locales: [
                ''
            ]
        }
    },
    publicPath: process.env.NODE_ENV === 'production' ? '/html/admin/' : '/'

}