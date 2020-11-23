const axios = require('axios');
const fsPromises = require('fs').promises;



var argv = require('optimist')
    .usage('Usage: $0  [options]')
    .demand(['url'])
    .describe('data', 'Post data in JSON format')
    .describe('method', 'HTTP method (default is get)')
    .string('url')
    .string('method')
    .string('data')
    .argv;

async function main() {
    try {

        try {
            let settingsStr = await fsPromises.readFile("./apitestSettings.json");
        } catch (err) {
            console.log("Error reading settings file: apitestSettings.json", err);
            return;
        }

        //console.log(settingsStr);
        let settings = JSON.parse(settingsStr);

        if (!settings.username || !settings.password || !settings.apiurl) {
            console.log("Please set username, password, and apiurl parameters in apitestSettings.json");
            return;
        }

        const apiurl = settings.apiurl;
        let response = await axios({
            method: "post",
            url: apiurl + "/api/auth",
            data: {
                userName: settings.username,
                password: settings.password,
                deviceid: "APITest",
                deviceName: "API",
                activationkey: settings.activationkey //"0837e76290cf554edd2203d24702c83e7c7d3f538fc61e6025d586c31bf43db72d2961331819b7bd2f4453cdd0b04c73"
            }
        });
        if (response.data.status == 200) {
            console.log("Please activate admin login");
            if (response.data.activationkey && response.data.activationkey != settings.activationkey) {
                settings.activationkey = response.data.activationkey;
                await fsPromises.writeFile("./apitestSettings.json", JSON.stringify(settings, null, 2));
            }
        }
        if (response.data.status != 1) {
            console.log("Error on auth: " + JSON.stringify(response.data, null, 2));
            return;
        }
        let loginToken = response.data.loginToken;
        let options = {
            method: (argv.method ? argv.method : "get"),
            url: apiurl + argv.url,
            headers: {
                "Authorization": `OAuth ${loginToken}`
            },
        };
        if (argv.data) {
            options.data = JSON.parse(argv.data);
            console.log("data: " + JSON.stringify(options.data, null, 2));
        }
        //console.log("Options: "+JSON.stringify(options,null,2));
        response = await axios(options);
        console.log(JSON.stringify(response.data, null, 2));

        //
    } catch (err) {
        console.error(err);
    }
}



main();