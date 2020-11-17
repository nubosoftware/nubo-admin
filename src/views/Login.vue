<template>
  <v-container fluid fill-height class="bg">
    <v-layout v-if="!validationWait || true" flex align-center justify-center color="bg">
      <v-flex xs12 sm4 elevation-6 color="bg">
        <v-card color="bg">
          <v-card-text class="pt-4">
            <div v-if="messageText != ''">
              <v-alert :type="msgType">
                {{ messageText }}
              </v-alert>
            </div>
            <div >
              <v-form v-model="valid" ref="form" v-if="!validationWait">
                <v-text-field
                  :label="$t('Enter your email address')"
                  v-model="email"
                  :rules="emailRules"
                  required
                ></v-text-field>
                <v-text-field
                  :label="$t('Enter your password')"
                  v-model="password"
                  min="8"
                  :append-icon="e1 ? 'visibility' : 'visibility_off'"
                  :append-icon-cb="() => (e1 = !e1)"
                  @click:append="() => (e1 = !e1)"
                  :type="e1 ? 'password' : 'text'"
                  :rules="passwordRules"
                  counter
                  required
                ></v-text-field>
                <v-layout justify-space-between>
                  <v-btn
                    @click="submit"
                    :class="{
                      'blue darken-4 white--text': valid,
                      disabled: !valid,
                    }"
                    >{{ $t("login") }}</v-btn
                  >
                  <a href="">{{ $t("Forgot Password") }}</a>
                </v-layout>
              </v-form>
              <v-layout v-else justify-space-between>
                  <v-btn
                    @click="validationWait=false"
                    :class="{
                      'blue darken-4 white--text': valid,
                      disabled: !valid,
                    }"
                    >{{ $t("Re-send") }}</v-btn
                  >
                </v-layout>
            </div>
          </v-card-text>
        </v-card>
        
      </v-flex>
    </v-layout>
    <v-banner v-else :sticky="sticky" coloe="bg">
          A verification messaage has been sent to your email address.<br>
          Please click the verification link in that email.

          <template v-slot:actions>
            <v-btn text color="deep-purple accent-4"> Send email again </v-btn>
          </template>
        </v-banner>
  </v-container>
</template>


<style>
@import "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons";
.loginOverlay {
  background: rgba(33, 150, 243, 0.3);
}

.photoCredit {
  position: absolute;
  bottom: 15px;
  right: 15px;
}
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";

export default {
  name: "Login",
  data: () => ({
    validationWait: false,
    messageText: "",
    msgType: "info",
    valid: false,
    e1: true,
    password: "",
    passwordRules: [(v) => !!v || "Password is required"],
    email: "",
    emailRules: [
      (v) => !!v || "Email is required",
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        "Email must be valid",
    ],
    appData,
  }),
  methods: {
    checkValidationLoop: function(){
      let thisPage = this;
      setTimeout(function(){
        if (thisPage.validationWait) {
          appUtils
            .post({
              url: "api/auth/validate",
              data: {
                email: thisPage.email,
                deviceid: appData.deviceid,
                activationkey: appData.activationkey,
              },
            })
            .then((response) => {
              console.log(response.data);
              if (response.data.status == 200) {
                console.log("Pending...");
                if (thisPage.validationWait) {
                  thisPage.checkValidationLoop();
                }
              } else if (response.data.status == 201) {
                console.log("Validatd!");
                thisPage.validationWait = false;
                thisPage.messageText = thisPage.$t("Validated!");
                thisPage.submit();
              } else {
                console.log("Error");
                thisPage.validationWait = false;
                thisPage.messageText = thisPage.$t("Log in to the Admin Control Panel")
              }
            }).catch((error) => {
              console.log(error);
              if (thisPage.validationWait) {
                  thisPage.checkValidationLoop();
              }
            })
        }
      },1000);
    },
    submit: function () {
      //if (this.$refs.form.validate()) {
        console.log("submit");
        this.messageText = this.$t("Checking login information");
        this.msgType = "info";

        setTimeout(() => {
          appUtils
            .post({
              url: "api/auth",
              data: {
                userName: this.email,
                password: this.password,
                deviceid: appData.deviceid,
                deviceName: appData.deviceName,
                activationkey: appData.activationkey,
              },
            })
            .then((response) => {
              console.log(response.data);
              if (response.data.status == 200) {
                appData.activationkey = response.data.activationkey;
                appData.email = this.email;
                this.validationWait = true;
                this.messageText = this.$t("A verification messaage has been sent to your email address. Please click the verification link in that email.");
                this.checkValidationLoop();
                
              } else if (response.data.status != 1) {
                this.messageText = this.$t(
                  "Incorrect email address or password"
                );
                this.msgType = "error";
                console.log("Error");
              } else {
                this.messageText = this.$t("Login successful");
                this.msgType = "success";
                appData.isAuthenticated = true;
                appData.adminLoginToken = response.data.loginToken;
                appData.mainDomain = response.data.mainDomain;
                appData.firstname = response.data.firstname;
                appData.lastname = response.data.lastname;
                appData.imageurl = response.data.imageurl;
                appData.email = this.email;
                appData.orgs = response.data.orgs;
                appData.orgs.forEach((element) => {
                  if (!element.orgname || element.orgname == "") {
                    element.domainName = element.maindomain;
                  } else {
                    element.domainName = `${element.orgname} - ${element.maindomain}`;
                  }
                });
                console.log(
                  "appData.orgs: " + JSON.stringify(appData.orgs, null, 2)
                );
                appData.orgname =
                  response.data.orgname && response.data.orgname != ""
                    ? response.data.orgname
                    : response.data.mainDomain;
                appData.commit();
                this.$emit("checkLoginLoop", response.data.loginToken);
                this.$router.push("/");
              }
            })
            .catch((error) => console.log(error))
            .finally(() => (this.loading = false));
        }, 100);
      /*} else {
        console.log("Submit. form is not valid..");
      }*/
    },
  },
  watch: {
    "validationWait": function(newVal) {
      console.log(`validationWait: ${newVal}`);
      appData.validationWait = newVal;

    }
  },
  created: function () {
    this.validationWait = appData.validationWait;
    this.email = appData.email;
    if (this.validationWait) {
      this.messageText = this.$t("A verification messaage has been sent to your email address. Please click the verification link in that email.");
      this.checkValidationLoop();
    } else {
      this.messageText = this.$t("Log in to the Admin Control Panel");
    }
    this.passwordRules = [(v) => !!v || this.$t("Password is required")];
    this.emailRules = [
      (v) => !!v || this.$t("Email is required"),
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        this.$t("Email must be valid"),
    ];
    this.$emit("updatePage", "Login");
  },
};
</script>