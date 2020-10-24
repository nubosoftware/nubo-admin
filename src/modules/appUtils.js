import appData from "./appData";
import axios from "axios";

const appUtils = {
    post: (options) => {
        if (appData.postURL && appData.postURL != "") {
            options.url = appData.postURL + options.url;
        }
        if (appData.proxyURL && appData.proxyURL != "") {
            options.url = appData.proxyURL + options.url;
        }
        if (!options.method) {
            options.method = "post";
        }

        return axios(options);

    }
}

export default appUtils