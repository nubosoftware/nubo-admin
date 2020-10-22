const appData = {
    isAuthenticated: false,
    moduleName: "",
    appName: "Control Panel Test",
    adminLoginToken: "",
    mainDomain: "",
    commit: () => {
        localStorage.setItem("isAuthenticated", appData.isAuthenticated);
        localStorage.setItem("adminLoginToken", appData.adminLoginToken);
        localStorage.setItem("mainDomain", appData.mainDomain);
    },
    load: () => {
        console.log("Loading app data..");
        appData.isAuthenticated = localStorage.getItem("isAuthenticated");
        appData.adminLoginToken = localStorage.getItem("adminLoginToken");
        appData.mainDomain = localStorage.getItem("mainDomain");
        console.log(`adminLoginToken: ${appData.adminLoginToken}`);
    }
};


appData.load();

export default appData