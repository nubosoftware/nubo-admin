<template>
  <v-container fluid fill-height class="bg">
    <v-layout flex align-center justify-center color="bg">
      <v-flex xs12 sm4 elevation-6 color="bg">
        <v-card color="bg">
          <v-card-text class="pt-4">
            <div v-if="messageText != ''">
              <v-alert :type="msgType">
                {{ messageText }}
              </v-alert>
            </div>
            <div >
              <v-form v-model="valid" ref="form" v-if="!validationWait" autocomplete="off">
                <v-text-field
                 v-if="!setPassword"
                  :label="$t('Enter your email address')"
                  v-model="email"
                  :rules="emailRules"
                  autocomplete="off"
                  required
                ></v-text-field>
                <v-text-field
                  v-if="!resetPassword"
                  :label="$t('Enter your password')"
                  v-model="password"
                  min="8"
                  :append-icon="e1 ? 'mdi-eye' : 'mdi-eye-off'"
                  :append-icon-cb="() => (e1 = !e1)"
                  @click:append="() => (showPassword = !showPassword)"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="passwordRules"
                  counter
                  required
                  autocomplete="new-password"
                  :name="'pwd_' + Math.random().toString(36)"
                ></v-text-field>
                <v-text-field
                  v-if="!resetPassword && setPassword"
                  :label="$t('Re-enter your password')"
                  v-model="passwordCheck"
                  min="8"
                  :append-icon="e2 ? 'mdi-eye' : 'mdi-eye-off'"
                  :append-icon-cb="() => (e2 = !e2)"
                  @click:append="() => (showPasswordCheck = !showPasswordCheck)"
                  :type="showPasswordCheck ? 'text' : 'password'"
                  :rules="checkPasswordRules"
                  counter
                  required
                  autocomplete="new-password"
                  :name="'pwd_' + Math.random().toString(36)"
                ></v-text-field>
                <v-layout justify-space-between  v-if="!resetPassword">
                  <v-btn
                    @click="submit"
                    :disabled="!valid"
                    :class="{
                      'blue darken-4 white--text': valid,
                      disabled: !valid,
                    }"
                    >{{ $t("login") }}</v-btn
                  >
                  <a href="#" @click="resetPasswordClick">{{ $t("Forgot Password") }}</a>
                </v-layout>
                <v-layout v-if="resetPassword">
                  <v-btn
                    class="ma-4"
                    color="primary"
                    @click="resetPasswordSubmit"
                    >{{ $t("Reset Password") }}</v-btn>
                   <v-btn
                    class="ma-4"
                    color="warning"
                    @click="resetPassword = false"
                    >{{ $t("Cancel") }}</v-btn>
                </v-layout>
              </v-form>
              <v-layout v-else justify-space-between>
                  <v-btn
                    @click="validationWait=false"
                    color="warning"
                    >{{ $t("Cancel") }}</v-btn
                  >
                  <v-btn
                    v-if="accountLocked"
                    @click="resendUnlockEmail"
                    color="primary"
                    >{{ $t("Resend Unlock Email") }}</v-btn
                  >
                </v-layout>
            </div>
          </v-card-text>
        </v-card>

      </v-flex>
    </v-layout>
    <!--<v-banner v-else :sticky="sticky" coloe="bg">
          A verification messaage has been sent to your email address.<br>
          Please click the verification link in that email.

          <template v-slot:actions>
            <v-btn text color="deep-purple accent-4"> Send email again </v-btn>
          </template>
        </v-banner>-->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t("Active Session Detected") }}</v-card-title>
        <v-card-text>
          {{ $t("You are already logged in another session. Would you like to proceed and logout the other session?") }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="showLogoutDialog = false">
            {{ $t("Cancel") }}
          </v-btn>
          <v-btn color="primary" @click="submitWithLogout">
            {{ $t("Proceed") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<style>

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
import CryptoJS from 'crypto-js';

export default {
  name: "LoginPage",
  data: () => ({
    validationWait: false,
    resetPassword: false,
    setPassword: false,
    messageText: "",
    msgType: "info",
    valid: false,
    e1: true,
    e2: true,
    showPassword: false,
    showPasswordCheck: false,
    passwordStore: new Uint8Array(0),
    passwordCheckStore: new Uint8Array(0),
    passwordRules: [(v) => !!v || "Password is required"],
    checkPasswordRules: [
      (v) => !!v || "Password is required",
      (v) => (!v || v === this.password) || "Passwords do not match"
    ],
    email: "",
    emailRules: [
      (v) => !!v || "Email is required",
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        "Email must be valid",
    ],
    appData,
    showLogoutDialog: false,
    deleteCurrentLogin: false,
    accountLocked: false,
  }),
  computed: {
    password: {
      get() {
        return this.passwordStore?.length ? String.fromCharCode.apply(null, this.passwordStore) : '';
      },
      set(value) {
        this.passwordStore = new Uint8Array(value.split('').map(char => char.charCodeAt(0)));
      }
    },
    passwordCheck: {
      get() {
        return this.passwordCheckStore?.length ? String.fromCharCode.apply(null, this.passwordCheckStore) : '';
      },
      set(value) {
        this.passwordCheckStore = new Uint8Array(value.split('').map(char => char.charCodeAt(0)));
      }
    }
  },
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
              if (response.data.status == 200 || response.data.status == 202 || response.data.status == 4) {
                console.log("Pending...");
                if (thisPage.validationWait) {
                  thisPage.checkValidationLoop();
                }
              } else if (response.data.status == 201) {
                console.log("Validatd!");
                thisPage.accountLocked = false;
                if (response.data.adminSecurityConfig) {
                  appData.adminSecurityConfig = response.data.adminSecurityConfig;
                } else {
                  appData.adminSecurityConfig = {};
                }
                if (response.data.resetpasscode != 1) {
                  thisPage.validationWait = false;
                  thisPage.messageText = thisPage.$t("Log in to the Admin Control Panel");
                  thisPage.msgType = "info";
                  thisPage.submit();
                } else {
                    console.log("Reset passcode");
                    thisPage.messageText = thisPage.$t("Please select new password");
                    thisPage.password = "";
                    thisPage.passwordCheck = "";
                    thisPage.validationWait = false;
                    thisPage.setPassword = true;
                    thisPage.generatePasswordRules();
                }
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
    resetPasswordClick: function() {
      this.resetPassword = true;
      this.messageText = this.$t("Reset password");
    },
    resetPasswordSubmit: function() {
      console.log("resetPasswordSubmit..");
      appUtils
        .post({
          url: "api/auth/reset",
          data: {
            userName: this.email,
            deviceid: appData.deviceid,
            deviceName: appData.deviceName,
            activationkey: appData.activationkey,
          },
        })
        .then((response) => {
          console.log(response.data);
          this.resetPassword = false;
          if (response.data.status == 200) {
            appData.activationkey = response.data.activationkey;
            appData.email = this.email;
            this.validationWait = true;
            this.messageText = this.$t("A verification messaage has been sent to your email address. Please click the verification link in that email.");
            this.checkValidationLoop();
          } else {
            this.messageText = this.$t(
              "Reset password error"
            );
            this.msgType = "error";
            console.log("Error");

          }
        }).catch((error) => console.log(error));
    },
    getSalt: async function(userName) {
      try {
        const response = await appUtils.post({
          url: "api/auth/salt",
          data: {
            userName,
            activationkey: appData.activationkey,
            deviceid: appData.deviceid,
            selectedDomain: appData.mainDomain
          }
        });
        return response.data.salt;
      } catch (error) {
        console.error('Error getting salt:', error);
        throw error;
      }
    },
    hashPassword: function(password, salt) {
      if (salt && salt.length > 0) {
        return CryptoJS.HmacSHA512(password, salt).toString();
      }
      return password;
    },
    submit: async function () {
      console.log("submit. password length: " + this.password?.length);
      if (!this.password) {
        return;
      }
      this.messageText = this.$t("Checking login information");
      this.msgType = "info";

      try {
        let salt = "";
        if (!this.setPassword) {
          salt = await this.getSalt(this.email);
        } else {
          salt = this.email;
        }

        const passwordHash = this.hashPassword(this.password, salt);

        let data = {
          userName: this.email,
          passwordHash,
          deviceid: appData.deviceid,
          deviceName: appData.deviceName,
          activationkey: appData.activationkey,
          selectedDomain: appData.mainDomain
        };

        if (this.setPassword) {
          data.setPassword = this.hashPassword(this.passwordCheck, salt);
          data.setSalt = salt;
        }

        if (this.deleteCurrentLogin) {
          data.deleteCurrentLogin = true;
        }

        setTimeout(() => {
          appUtils
            .post({
              url: "api/auth",
              data,
            })
            .then((response) => {
              console.log(response.data);
              this.setPassword = false;
              this.clearSensitiveData();

              if (response.data.status == 200) {
                appData.activationkey = response.data.activationkey;
                appData.email = this.email;
                this.validationWait = true;
                this.messageText = this.$t("A verification messaage has been sent to your email address. Please click the verification link in that email.");
                this.checkValidationLoop();

              } else if (response.data.status == 203) {
                this.showLogoutDialog = true;
              } else if (response.data.status == 4) {
                this.messageText = this.$t("Account is locked");
                this.password = "";
                this.validationWait = true;
                this.accountLocked = true;
                this.messageText = this.$t("Account is locked. An unlock verification link has been sent to your email address. Please click the link in that email to unlock your account.");
                this.msgType = "error";
                this.checkValidationLoop();
              } else if (response.data.status == 37) {
                this.messageText = this.$t("Can't reuse the same password");
                this.setPassword = true;
                this.msgType = "error";
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
                appData.resetOrgs(response.data.orgs);

                appData.siteAdmin = response.data.siteAdmin;
                appData.siteAdminDomain = response.data.siteAdminDomain;
                try {
                  appData.permissions =  JSON.parse(response.data.permissions);
                } catch (err) {
                  console.log("Error parse permissions",err);
                  appData.permissions = {};
                }
                console.log(
                  "appData.permissions: " + JSON.stringify(appData.permissions, null, 2)
                );
                appData.orgname =
                  response.data.orgname && response.data.orgname != ""
                    ? response.data.orgname
                    : response.data.mainDomain;
                appData.edition = response.data.edition;
                if (!appData.edition) {
                   appData.edition = "enterprise"; // default value for old systems
                }
                if (response.data.pluginsEnabled != undefined  && typeof response.data.pluginsEnabled == "boolean") {
                  appData.pluginsEnabled = response.data.pluginsEnabled;
                } else {
                  appData.pluginsEnabled = false;
                }
                appData.productName = response.data.productName;
                if (!appData.productName) {
                  // if (appData.pluginsEnabled)
                  //   appData.productName = this.$t("workspace-hub");
                  // else
                  appData.productName = this.$t("control-panel");
                }
                appData.deviceTypes = response.data.deviceTypes;
                if (!appData.deviceTypes) {
                  appData.deviceTypes = ["mobile"]; // default value for old systems
                }
                appData.commit();
                this.$emit("checkLoginLoop", response.data.loginToken);
                this.$emit("updatePermissions");
                this.$router.push("/");
              }
            })
            .catch((error) => {
              this.clearSensitiveData();
              console.log(error);
            })
            .finally(() => (this.loading = false));
        }, 100);
      } catch (error) {
        console.error('Authentication error:', error);
        this.messageText = this.$t("Authentication error occurred");
        this.msgType = "error";
        this.clearSensitiveData();
      }
    },
    submitWithLogout: function() {
      this.showLogoutDialog = false;
      this.deleteCurrentLogin = true;
      this.submit();
    },
    clearSensitiveData() {
      if (this.passwordStore?.length) {
        this.passwordStore.fill(0);
        this.passwordStore = new Uint8Array(0);
      }
      if (this.passwordCheckStore?.length) {
        this.passwordCheckStore.fill(0);
        this.passwordCheckStore = new Uint8Array(0);
      }
    },
    generateSalt: function(length) {
      const randomWords = CryptoJS.lib.WordArray.random(length);
      return randomWords.toString(CryptoJS.enc.Hex).slice(0, length);
    },
    generatePasswordRules() {
      const rules = [(v) => !!v || this.$t("Password is required")];

      if (appData.adminSecurityConfig) {
        const config = appData.adminSecurityConfig;

        // Check minimum length
        if (config.minLength) {
          rules.push((v) =>
            !v || v.length >= config.minLength ||
            this.$t("Password must be at least {0} characters long", [config.minLength])
          );
        }

        // Check required character types
        if (config.requiredCharacterTypes) {
          if (config.requiredCharacterTypes.includes('uppercase')) {
            rules.push((v) =>
              !v || /[A-Z]/.test(v) ||
              this.$t("Password must contain at least one uppercase letter")
            );
          }
          if (config.requiredCharacterTypes.includes('lowercase')) {
            rules.push((v) =>
              !v || /[a-z]/.test(v) ||
              this.$t("Password must contain at least one lowercase letter")
            );
          }
          if (config.requiredCharacterTypes.includes('number')) {
            rules.push((v) =>
              !v || /\d/.test(v) ||
              this.$t("Password must contain at least one number")
            );
          }
          if (config.requiredCharacterTypes.includes('special')) {
            rules.push((v) =>
              !v || /[!@#$%^&*(),.?":{}|<>]/.test(v) ||
              this.$t("Password must contain at least one special character")
            );
          }
        }

        // Check if password contains username
        if (config.avoidUserId) {
          rules.push((v) => {
            const emailPrefix = this.email.split('@')[0].toLowerCase();
            return !v || !v.toLowerCase().includes(emailPrefix) ||
              this.$t("Password cannot contain your email username");
          });
        }

        // Check for repeated characters
        if (config.noRepeatedChars) {
          rules.push((v) =>
            !v || !/(.)\1{2,}/.test(v) ||
            this.$t("Password cannot contain repeated characters")
          );
        }

        // Check for sequential characters
        if (config.noSequentialChars) {
          rules.push((v) => {
            const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789'];
            // Add common keyboard sequences
            const keyboardSequences = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty', 'asdfgh'];
            const reverseSequences = sequences.map(seq => seq.split('').reverse().join(''));
            const reverseKeyboardSequences = keyboardSequences.map(seq => seq.split('').reverse().join(''));
            const allSequences = [...sequences, ...reverseSequences, ...keyboardSequences, ...reverseKeyboardSequences];
            return !v || !allSequences.some(seq => v.toLowerCase().includes(seq.substring(0, 3))) ||
              this.$t("Password cannot contain sequential characters or keyboard patterns");
          });
        }
      }

      this.passwordRules = rules;
    },
    resendUnlockEmail: function() {
      appUtils
        .post({
          url: "api/auth/validate",
          data: {
            email: this.email,
            deviceid: appData.deviceid,
            activationkey: appData.activationkey,
            resendEmail: true
          },
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 200 || response.data.status == 4) {
            this.messageText = this.$t("Unlock email has been resent. Please check your inbox.");
            // this.msgType = "info";
          } else {
            this.messageText = this.$t("Failed to resend unlock email. Please try again.");
            this.msgType = "error";
          }
        })
        .catch((error) => {
          console.log(error);
          this.messageText = this.$t("Error sending unlock email. Please try again.");
          this.msgType = "error";
        });
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
    this.checkPasswordRules = [
      (v) => !!v || this.$t("Password is required"),
      (v) => (!v || v === this.password) || this.$t("Passwords do not match")
    ];
    this.emailRules = [
      (v) => !!v || this.$t("Email is required"),
      (v) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(v) ||
        this.$t("Email must be valid"),
    ];
    this.$emit("updatePage", "Login");
  },
  beforeDestroy() {
    this.clearSensitiveData();
  },
};
</script>