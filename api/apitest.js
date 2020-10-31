const axios = require('axios');

const username = "a@jpdc.local";
const password = "123654";
const apiurl = "http://labil.nubosoftware.com:8080";
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
        let response = await axios({
            method: "post",
            url: apiurl + "/api/auth",
            data: {
                userName: username,
                password: password
            }
        });
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