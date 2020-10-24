<template>
  <v-container fluid fill-height class="loginOverlay">
    <v-layout flex align-center justify-center>
      <v-flex xs12 sm4 elevation-6>
        <v-card>
          <v-card-text class="pt-4">
            <div v-if="messageText != ''">
              <v-alert :type="msgType">
                {{ messageText }}
              </v-alert>
            </div>
            <div>
              <v-form v-model="valid" ref="form">
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
                  <a href="">{{ $t('Forgot Password')}}</a>
                </v-layout>
              </v-form>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
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
    messageText:  "",
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
    submit: function () {
      if (this.$refs.form.validate()) {
        console.log("submit");
        this.messageText = this.$t("Checking login information");
        this.msgType = "info";

        setTimeout(() => {
          appUtils.post({
            url:
              //"http://localhost:9080/http://localhost:8080/loginWebAdmin",
              //"http://localhost:9080/http://labil.nubosoftware.com:8080/loginWebAdmin",
              "loginWebAdmin",
            data: {
              userName: this.email,
              password: this.password,
            },
          })
            .then((response) => {
              console.log(response.data);
              if (response.data.status != 1) {
                this.messageText = this.$t("Incorrect email address or password");
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
                appData.orgname = (response.data.orgname && response.data.orgname != "" ? response.data.orgname :response.data.mainDomain )
                appData.commit();
                this.$router.push("/");
              }
            })
            .catch((error) => console.log(error))
            .finally(() => (this.loading = false));
        }, 100);
      }
    },
  },
  created: function () {
    this.messageText = this.$t("Log in to the Admin Control Panel");
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