<template>
    <div>
        <v-card flat color="bg" class="session-monitor-card pa-0 ma-0 elevation-0">
            <v-toolbar color="secondary" dark flat>
                <v-toolbar-title>{{ $t("Session Monitor") }}</v-toolbar-title>
                <v-spacer></v-spacer>

                <template v-slot:extension>
                    <v-tabs v-model="tab" align-with-title>
                        <v-tabs-slider color="primary"></v-tabs-slider>
                        <v-tab key="list">{{ $t("Session List") }}</v-tab>
                        <v-tab key="auth-keys">{{ $t("Auth Keys") }}</v-tab>
                        <v-tab key="alerts">{{ $t("Alerts") }}</v-tab>
                        <v-tab key="settings">{{ $t("Settings") }}</v-tab>
                    </v-tabs>
                </template>
            </v-toolbar>

            <v-tabs-items v-model="tab">
                <v-tab-item key="list" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="headers"
                        :items="rows"
                        :server-items-length="totalItems"
                        :items-per-page="10"
                        :loading="loading"
                        :options.sync="options"
                        :search="search"
                        class="bg session-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updateOptions"
                        @click:row="rowClick"
                    >
                      <template v-slot:top>
                        <v-toolbar flat color="bg" class="px-4">
                          <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('Session Monitor') }}</v-toolbar-title>
                          <v-spacer></v-spacer>
                          <v-menu
                            v-model="dateRangeMenu"
                            :close-on-content-click="false"
                            offset-y
                            max-width="300"
                          >
                            <template v-slot:activator="{ on, attrs }">
                              <v-btn
                                color="secondary"
                                small
                                v-bind="attrs"
                                v-on="on"
                                class="mr-2"
                              >
                                <v-icon left small>mdi-calendar-range</v-icon>
                                {{ getDateRangeText() }}
                              </v-btn>
                            </template>
                            <v-card>
                              <v-list dense>
                                <v-list-item-group
                                  v-model="selectedDateRange"
                                  mandatory
                                  @change="dateRangeChanged"
                                >
                                  <v-list-item v-for="(item, i) in dateRanges" :key="i" :value="item.value">
                                    <v-list-item-content>
                                      <v-list-item-title>{{ item.text }}</v-list-item-title>
                                    </v-list-item-content>
                                  </v-list-item>
                                </v-list-item-group>
                              </v-list>
                              <v-divider v-if="selectedDateRange === 'custom'"></v-divider>
                              <v-card-text v-if="selectedDateRange === 'custom'">
                                <v-row dense>
                                  <v-col cols="12">
                                    <v-menu
                                      v-model="fromDateMenu"
                                      :close-on-content-click="false"
                                      transition="scale-transition"
                                      offset-y
                                      min-width="290px"
                                    >
                                      <template v-slot:activator="{ on, attrs }">
                                        <v-text-field
                                          v-model="fromDateDisplay"
                                          label="From"
                                          readonly
                                          dense
                                          v-bind="attrs"
                                          v-on="on"
                                          prepend-icon="mdi-calendar"
                                        ></v-text-field>
                                      </template>
                                      <v-date-picker
                                        v-model="fromDate"
                                        @input="fromDateMenu = false"
                                        @change="customDateChanged"
                                      ></v-date-picker>
                                    </v-menu>
                                  </v-col>
                                  <v-col cols="12">
                                    <v-menu
                                      v-model="toDateMenu"
                                      :close-on-content-click="false"
                                      transition="scale-transition"
                                      offset-y
                                      min-width="290px"
                                    >
                                      <template v-slot:activator="{ on, attrs }">
                                        <v-text-field
                                          v-model="toDateDisplay"
                                          label="To"
                                          readonly
                                          dense
                                          v-bind="attrs"
                                          v-on="on"
                                          prepend-icon="mdi-calendar"
                                        ></v-text-field>
                                      </template>
                                      <v-date-picker
                                        v-model="toDate"
                                        @input="toDateMenu = false"
                                        @change="customDateChanged"
                                      ></v-date-picker>
                                    </v-menu>
                                  </v-col>
                                </v-row>
                              </v-card-text>
                              <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn
                                  text
                                  color="primary"
                                  @click="dateRangeMenu = false"
                                >
                                  Close
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </v-menu>
                          <v-text-field
                            v-model="search"
                            append-icon="mdi-magnify"
                            label="Search"
                            single-line
                            hide-details
                            dense
                            class="search-field mr-4"
                            style="max-width: 300px;"
                          ></v-text-field>
                          <v-btn color="primary" small @click="refresh" class="ml-2">
                            <v-icon left small>mdi-refresh</v-icon>
                            {{ $t('Refresh') }}
                          </v-btn>
                        </v-toolbar>
                      </template>

                        <template v-slot:[`item.start_time`]="{ item }">
                          {{ moment(item.start_time).format("LLL") }}
                        </template>
                        <template v-slot:[`item.duration`]="{ item }">
                          {{ formatDuration(item) }}
                        </template>
                        <template v-slot:[`item.sessionTitle`]="{ item }">
                          <v-tooltip bottom max-width="300">
                            <template v-slot:activator="{ on, attrs }">
                              <span v-bind="attrs" v-on="on" class="session-title">{{ item.sessionTitle }}</span>
                            </template>
                            <span>{{ getSessionSummary(item) }}</span>
                          </v-tooltip>
                        </template>
                        <template v-slot:[`item.security_threat_severity`]="{ item }">
                          <v-chip
                            v-if="item.security_threat_severity"
                            :color="getSeverityColor(item.security_threat_severity)"
                            :text-color="item.security_threat_severity.toLowerCase() === 'low' ? 'black' : 'white'"
                            small
                            class="font-weight-medium"
                          >
                            {{ item.security_threat_severity }}
                          </v-chip>
                        </template>
                        <template v-slot:[`item.it_issues_severity`]="{ item }">
                          <v-chip
                            v-if="item.it_issues_severity"
                            :color="getSeverityColor(item.it_issues_severity)"
                            :text-color="item.it_issues_severity.toLowerCase() === 'low' ? 'black' : 'white'"
                            small
                            class="font-weight-medium"
                          >
                            {{ item.it_issues_severity }}
                          </v-chip>
                        </template>
                        <template v-slot:[`item.status`]="{ item }">
                          <v-chip
                            small
                            :color="getStatusColor(item.status)"
                            text-color="white"
                            class="status-chip"
                          >
                            {{ item.status }}
                          </v-chip>
                        </template>
                        <template v-slot:loading>
                          <v-skeleton-loader
                            type="table-row@6"
                            class="my-2"
                          ></v-skeleton-loader>
                        </template>
                        <template v-slot:no-data>
                          <div class="text-center py-4">
                            <v-icon large color="grey lighten-1">mdi-database-off</v-icon>
                            <p class="mt-2 grey--text">{{ $t('No sessions found') }}</p>
                          </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- Auth Keys Tab -->
                <v-tab-item key="auth-keys" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="[
                            { text: $t('Auth Key'), value: 'auth_key', width: '60%' },
                            { text: $t('Created'), value: 'createdAt', width: '25%' },
                            { text: $t('Actions'), value: 'actions', sortable: false, width: '15%' }
                        ]"
                        :items="authKeys"
                        :loading="authKeysLoading"
                        class="ma-4 bg"
                        :items-per-page="10"
                        :footer-props="{
                            'items-per-page-options': [5, 10, 25, 50]
                        }"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('API Authentication Keys') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-btn
                                    color="primary"
                                    small
                                    @click="createAuthKey"
                                    :loading="authKeysLoading"
                                    :disabled="!appData.checkPermission('/','w')"
                                >
                                    <v-icon left small>mdi-plus</v-icon>
                                    {{ $t('Add New Key') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.auth_key`]="{ item }">
                            <div class="d-flex align-center">
                                <code class="text-truncate mr-2" style="max-width: 300px;">{{ item.auth_key }}</code>
                                <v-btn
                                    icon
                                    small
                                    @click="copyAuthKey(item)"
                                    :title="$t('Copy to clipboard')"
                                >
                                    <v-icon small>mdi-content-copy</v-icon>
                                </v-btn>
                            </div>
                        </template>

                        <template v-slot:[`item.createdAt`]="{ item }">
                            {{ moment(item.createdAt).format("LLL") }}
                        </template>

                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="error"
                                @click="deleteAuthKey(item)"
                                :disabled="!appData.checkPermission('/','w')"
                                :title="$t('Delete key')"
                            >
                                <v-icon small>mdi-delete</v-icon>
                            </v-btn>
                        </template>

                        <template v-slot:loading>
                            <v-skeleton-loader
                                type="table-row@3"
                                class="my-2"
                            ></v-skeleton-loader>
                        </template>

                        <template v-slot:no-data>
                            <div class="text-center py-4">
                                <v-icon large color="grey lighten-1">mdi-key-off</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No auth keys found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- Alerts Tab (formerly Notifications) -->
                <v-tab-item key="alerts" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="alertHeaders"
                        :items="alertRows"
                        :server-items-length="alertTotalItems"
                        :items-per-page="10"
                        :loading="alertLoading"
                        :options.sync="alertOptions"
                        class="ma-4 bg"
                        @update:options="updateAlertOptions"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg">
                                <v-btn
                                    v-if="appData.checkPermission('/','w')"
                                    class="ma-4"
                                    color="primary"
                                    @click="openAlertDialog()"
                                >{{ $t("New Alert") }}</v-btn>
                                <v-spacer></v-spacer>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.notify_method`]="{ item }">
                            <v-chip small>{{ item.notify_method }}</v-chip>
                        </template>

                        <template v-slot:[`item.condition_prompt`]="{ item }">
                            <v-tooltip bottom max-width="300">
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on" class="condition-prompt text-truncate">
                                        {{ item.condition_prompt }}
                                    </span>
                                </template>
                                <span>{{ item.condition_prompt }}</span>
                            </v-tooltip>
                        </template>

                        <template v-slot:[`item.actions`]="{ item }">
                            <v-icon
                                v-if="appData.checkPermission('/','w')"
                                small
                                class="mr-2"
                                @click="editAlert(item)"
                            >
                                mdi-pencil
                            </v-icon>
                            <v-icon
                                v-if="appData.checkPermission('/','w')"
                                small
                                @click="deleteAlert(item)"
                            >
                                mdi-delete
                            </v-icon>
                        </template>
                    </v-data-table>

                    <!-- Alert Dialog -->
                    <v-dialog v-model="alertDialog" max-width="600px">
                        <v-card>
                            <v-card-title>
                                <span class="headline">{{ editingAlert ? $t('Edit Alert') : $t('New Alert') }}</span>
                            </v-card-title>
                            <v-card-text>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12">
                                            <v-text-field
                                                v-model="alertForm.title"
                                                :label="$t('Title') + ' *'"
                                                required
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-textarea
                                                v-model="alertForm.condition_prompt"
                                                :label="$t('Condition Prompt') + ' *'"
                                                rows="3"
                                                required
                                                :hint="$t('Example: Trigger when security_threat_severity is at least high or it_issues_severity is at least high on mobile device sessions')"
                                                persistent-hint
                                            ></v-textarea>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-select
                                                v-model="alertForm.notify_method"
                                                :items="['email', 'sms']"
                                                :label="$t('Notification Method') + ' *'"
                                                required
                                            ></v-select>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-text-field
                                                v-model="alertForm.notify_users"
                                                :label="$t('Notify Users (comma separated emails)') + (alertForm.notify_entities ? '' : ' *')"
                                                :hint="$t('At least one recipient (Users or Entities) is required')"
                                                persistent-hint
                                            ></v-text-field>
                                            <v-btn
                                                small
                                                color="primary"
                                                class="ml-2"
                                                @click="openProfileSelector"
                                            >
                                                <v-icon left small>mdi-account-search</v-icon>
                                                {{ $t('Browse Profiles') }}
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-text-field
                                                v-model="alertForm.notify_entities"
                                                :label="$t('Notify Entities (comma separated)') + (alertForm.notify_users ? '' : ' *')"
                                                :hint="$t('At least one recipient (Users or Entities) is required')"
                                                persistent-hint
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-text-field
                                                v-model="alertForm.notify_subject"
                                                :label="$t('Notification Subject') + (alertForm.notify_method === 'email' ? ' *' : '')"
                                                :required="alertForm.notify_method === 'email'"
                                                :hint="$t('You can use variables like {sessionTitle}, {email}, {sessionId}, etc.')"
                                                persistent-hint
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-textarea
                                                v-model="alertForm.notify_text"
                                                :label="$t('Notification Text') + ' *'"
                                                rows="8"
                                                required
                                                :hint="$t('You can use variables like {email}, {deviceTitle}, {sessionId}, {securitySeverity}, {itSeverity}, {sessionSummary}, {overallAssessment}, {sessionUrl}')"
                                                persistent-hint
                                            ></v-textarea>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="blue darken-1" text @click="closeAlertDialog">{{ $t('Cancel') }}</v-btn>
                                <v-btn color="blue darken-1" text @click="saveAlert">{{ $t('Save') }}</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>

                    <!-- Delete Confirmation Dialog -->
                    <v-dialog v-model="deleteDialog" max-width="400">
                        <v-card>
                            <v-card-title class="headline">{{ $t('Delete Alert') }}</v-card-title>
                            <v-card-text>{{ $t('Are you sure you want to delete this alert?') }}</v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="grey darken-1" text @click="deleteDialog = false">{{ $t('Cancel') }}</v-btn>
                                <v-btn color="red darken-1" text @click="confirmDeleteAlert">{{ $t('Delete') }}</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>



                    <!-- Profile selector dialog -->
                    <v-dialog v-model="profileSelectorDialog" max-width="800px">
                        <v-card>
                            <v-card-title>
                                <span class="headline">{{ $t('Select Profiles') }}</span>
                                <v-spacer></v-spacer>
                                <v-text-field
                                    v-model="profileSearch"
                                    append-icon="mdi-magnify"
                                    :label="$t('Search Profiles')"
                                    single-line
                                    hide-details
                                    dense
                                    class="ml-4"
                                    style="max-width: 300px;"
                                ></v-text-field>
                            </v-card-title>
                            <v-card-text>
                                <v-data-table
                                    :headers="profileHeaders"
                                    :items="profileRows"
                                    :search="profileSearch"
                                    :loading="profileLoading"
                                    :items-per-page="profileOptions.itemsPerPage"
                                    show-select
                                    v-model="selectedProfiles"
                                    item-key="email"
                                    class="elevation-1"
                                    :options.sync="profileOptions"
                                    :server-items-length="profileTotalItems"
                                    @update:options="profileOptionsUpdated"
                                    :footer-props="{
                                        'items-per-page-options': [5, 10, 25, 50]
                                    }"
                                >
                                </v-data-table>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="grey darken-1" text @click="profileSelectorDialog = false">{{ $t('Cancel') }}</v-btn>
                                <v-btn color="primary" text @click="addSelectedProfiles">{{ $t('Add Selected') }}</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                </v-tab-item>

                <!-- Settings Tab -->
                <v-tab-item key="settings" class="bg">
                    <div class="bg-white">
                        <div class="px-6 pt-6 pb-4">
                            <div class="text-h6">{{ $t('Session Monitor Settings') }}</div>
                        </div>

                        <div class="px-6 py-3">
                            <div class="mb-6">
                                <v-textarea
                                    v-model="settingsForm.securityAnalystCustomInstructions"
                                    class="bg-white"
                                    outlined
                                    rows="8"
                                    hide-details="auto"
                                    placeholder="Security Analyst Custom Instructions"
                                ></v-textarea>
                                <div class="text-caption grey--text mt-1">
                                    {{ $t('Additional instructions for the security analysis of sessions') }}
                                </div>
                            </div>

                            <div class="mb-6">
                                <v-textarea
                                    v-model="settingsForm.frameAnalyzerCustomInstructions"
                                    class="bg-white"
                                    outlined
                                    rows="8"
                                    hide-details="auto"
                                    placeholder="Frame Analyzer Custom Instructions"
                                ></v-textarea>
                                <div class="text-caption grey--text mt-1">
                                    {{ $t('Additional instructions for the frame analysis component') }}
                                </div>
                            </div>

                            <div v-if="settingsForm.updatedAt" class="text-caption grey--text mb-4">
                                {{ $t('Last updated') }}: {{ moment(settingsForm.updatedAt).format("LLL") }}
                            </div>

                            <div class="d-flex">
                                <v-btn
                                    color="error"
                                    text
                                    small
                                    @click="resetSettings"
                                    :loading="settingsLoading"
                                    :disabled="!appData.checkPermission('/','w')"
                                >
                                    {{ $t('RESET TO DEFAULT') }}
                                </v-btn>
                                <v-spacer></v-spacer>
                                <v-btn
                                    color="primary"
                                    dark
                                    small
                                    class="rounded-0 text-uppercase"
                                    @click="saveSettings"
                                    :loading="settingsLoading"
                                    :disabled="!appData.checkPermission('/','w')"
                                >
                                    {{ $t('SAVE SETTINGS') }}
                                </v-btn>
                            </div>
                                                </div>
                    </div>
                </v-tab-item>
            </v-tabs-items>
        </v-card>

        <!-- Auth Key Delete Confirmation Dialog -->
        <v-dialog v-model="authKeyDeleteDialog" max-width="400">
            <v-card>
                <v-card-title class="headline">{{ $t('Delete Auth Key') }}</v-card-title>
                <v-card-text>
                    {{ $t('Are you sure you want to delete this authentication key?') }}
                    <br>
                    <code class="mt-2 d-block" v-if="authKeyToDelete">{{ authKeyToDelete.auth_key }}</code>
                    <div class="mt-2 error--text">{{ $t('This action cannot be undone.') }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey darken-1" text @click="authKeyDeleteDialog = false">{{ $t('Cancel') }}</v-btn>
                    <v-btn color="red darken-1" text @click="confirmDeleteAuthKey">{{ $t('Delete') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Error Snackbar -->
        <v-snackbar v-model="snackbarSave" :timeout="3000" :color="snackbarColor">
            {{ snackbarText }}
            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="snackbarSave = false">
                    {{ $t('Close') }}
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>


<style>
.session-monitor-card {
  border-radius: 0;
}

.session-table {
  border-radius: 0;
}

.session-title {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.condition-prompt {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.status-chip {
  min-width: 75px;
  justify-content: center;
}

.search-field .v-input__slot {
  min-height: 36px !important;
}

.input-combobox {
  height: 40px;
  font-size: 10pt;
}

.v-label {
  height: 40px;
  font-size: 10pt;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.025em;
}
</style>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

let page = {
  name: "SessionMonitorList",
  mixins: [contextUpdater],
  data: () => ({
    tab: null,
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    moment,
    appData,
    dateRangeMenu: false,
    selectedDateRange: "last24hours",
    fromDateMenu: false,
    toDateMenu: false,
    dateRanges: [
      { text: "Last 15 minutes", value: "last15min" },
      { text: "Last hour", value: "last1hour" },
      { text: "Last 4 hours", value: "last4hours" },
      { text: "Last 24 hours", value: "last24hours" },
      { text: "Last 7 days", value: "last7days" },
      { text: "Last 30 days", value: "last30days" },
      { text: "This month", value: "thisMonth" },
      { text: "Last month", value: "lastMonth" },
      { text: "This year", value: "thisYear" },
      { text: "Last year", value: "lastYear" },
      { text: "Custom", value: "custom" }
    ],
    fromDate: null,
    toDate: null,
    fromDateDisplay: null,
    toDateDisplay: null,
    dateRange: {
      from: null,
      to: null
    },

    // Alert related data (formerly Notification)
    alertHeaders: [],
    alertRows: [],
    alertTotalItems: 0,
    alertLoading: false,
    alertOptions: {},
    alertDialog: false,
    deleteDialog: false,
    editingAlert: null,
    alertToDelete: null,
    snackbarSave: false,
    snackbarText: "",
    snackbarColor: "",
    alertForm: {
      title: "",
      condition_prompt: "",
      notify_method: "email",
      notify_users: "",
      notify_entities: "",
      notify_text: "",
      notify_subject: ""
    },

    // Profile selector related data
    profileSelectorDialog: false,
    profileSearch: "",
    profileHeaders: [],
    profileRows: [],
    profileLoading: false,
    selectedProfiles: [],
    profileSearchTimeout: null,
    profileOptions: {
      itemsPerPage: 10,
      page: 1,
      sortBy: ['lastName'],
      sortDesc: [false]
    },
    profileTotalItems: 0,

    // Settings related data
    settingsLoading: false,
    settingsForm: {
      securityAnalystCustomInstructions: "",
      frameAnalyzerCustomInstructions: "",
      updatedAt: null
    },

    // Auth keys related data
    authKeys: [],
    authKeysLoading: false,
    authKeyDeleteDialog: false,
    authKeyToDelete: null
  }),
  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`,this,['search','options','selectedDateRange','fromDate','toDate','tab','alertOptions']);

      // Update context when page state is saved
      this.updateContext({
        view: 'list',
        searchTerm: this.search,
        sortOptions: this.options,
        dateRange: this.dateRange,
        sessionCount: this.rows.length,
        totalSessions: this.totalItems
      });
    },
    formatDuration: function(item) {
      if (!item.end_time || !item.start_time) return "0 seconds";
      const seconds = moment(item.end_time).diff(moment(item.start_time), 'seconds');
      console.log('Duration:', seconds,"start",item.start_time,"end",item.end_time);
      if (!seconds) return "0 seconds";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      let result = "";
      if (hours > 0) {
        result += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      }
      if (minutes > 0) {
        if (result) result += ", ";
        result += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
      if (remainingSeconds > 0 || result === "") {
        if (result) result += ", ";
        result += `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
      }

      return result;
    },
    getSessionSummary(item) {
      if (item.sessionSummary) {
        return item.sessionSummary;
      }
      if (item.metadata) {
        const metadata = JSON.parse(item.metadata);
        if (metadata.sessionSummary) {
          item.sessionSummary = metadata.sessionSummary;
          return metadata.sessionSummary;
        }
      }
      return this.$t("No summary available");
    },
    getSeverityColor(severity) {
      if (!severity) return '';

      switch(severity.toLowerCase()) {
        case 'low': return 'gray';
        case 'medium': return 'orange';
        case 'high': return 'deep-orange';
        case 'critical': return 'red';
        default: return '';
      }
    },
    getStatusColor(status) {
      if (!status) return 'grey';

      switch(status.toLowerCase()) {
        case 'completed': return 'success';
        case 'error': return 'error';
        default: return 'info';
      }
    },
    updateOptions(options) {
      console.log("update:options", options);
      this.refresh();
      this.savePage();
    },

    rowClick: function (val) {
      console.log(`rowClick: ${val.id}`);

      // Update context before navigating to session view
      this.updateContext({
        view: 'selecting',
        selectedSession: {
          id: val.id,
          email: val.email,
          start_time: val.start_time,
          duration: this.formatDuration(val),
          sessionTitle: val.sessionTitle,
          deviceTitle: val.deviceTitle,
          status: val.status
        }
      });

      this.$router.push({ name: 'SessionView', params: { id: val.id } });
    },

    refresh: function () {
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      console.log(`refresh..`);

      // Calculate the date range before making the request
      this.calculateDateRange();

      // Update context with loading state
      this.updateContext({
        view: 'loading',
        searchTerm: this.search,
        sortOptions: this.options,
        dateRange: this.dateRange,
        loading: true
      });

      appUtils
        .post({
          url: "api/memsy-session",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
            from: this.dateRange.from,
            to: this.dateRange.to
          },
        })
        .then((response) => {
          console.log(`refresh reponse..`);
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.sessions;
            this.totalItems = response.data.count;

            // Update context with successful data fetch
            this.updateContext({
              view: 'list',
              searchTerm: this.search,
              sortOptions: this.options,
              dateRange: this.dateRange,
              sessionCount: this.rows.length,
              totalSessions: this.totalItems,
              sessions: this.rows.map(session => ({
                id: session.id,
                email: session.email,
                start_time: session.start_time,
                deviceTitle: session.deviceTitle,
                status: session.status,
                sessionTitle: session.sessionTitle,
                security_threat_severity: session.security_threat_severity,
                it_issues_severity: session.it_issues_severity
              })),
              lastFetched: new Date().toISOString(),
              loading: false
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'error',
              error: `Failed to fetch sessions (status: ${response.data.status})`,
              loading: false
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'error',
            error: `Error fetching sessions: ${error}`,
            loading: false
          });
        })
        .finally(() => (this.loading = false));
    },

    refreshAlerts: function () {
      this.alertLoading = true;

      appUtils
        .get({
          url: "api/memsy-notification",
        })
        .then((response) => {
          console.log("alerts response:", response.data);
          if (response.data.status == 1) {
            this.alertRows = response.data.notifications;
            this.alertTotalItems = response.data.count;

            // Update context with alert data
            this.updateContext({
              view: 'alerts',
              alertCount: this.alertRows.length,
              lastFetched: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'error',
              error: `Failed to fetch alerts (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'error',
            error: `Error fetching alerts: ${error}`
          });
        })
        .finally(() => (this.alertLoading = false));
    },

    updateAlertOptions() {
      console.log("update alert options");
      this.savePage();
    },

    openAlertDialog(alert = null) {
      if (alert) {
        this.editingAlert = alert;
        this.alertForm = { ...alert };
      } else {
        this.editingAlert = null;
        this.alertForm = {
          title: "Security Alert",
          condition_prompt: "Trigger when security_threat_severity is at least 'high' or it_issues_severity is at least 'high'",
          notify_method: "email",
          notify_users: "",
          notify_entities: "",
          notify_text: `Dear Security Team,

A session has been flagged for your immediate attention based on our automated monitoring system.

Session Details:
- User: {email}
- Device: {deviceTitle}
- Session ID: {sessionId}
- Security Severity: {securitySeverity}
- IT Issues Severity: {itSeverity}

Summary of Activity:
{sessionSummary}

Overall Assessment:
{overallAssessment}

This session was automatically flagged because it matches criteria for potentially suspicious activity. Please review the complete session details and take appropriate action according to your security protocols.

You can view the full session details and timeline at:
{sessionUrl}

This is an automated notification from the Memsy Security Monitoring System.

Thank you,
Security Operations`,
          notify_subject: "SECURITY ALERT: {sessionTitle}"
        };
      }
      this.alertDialog = true;
    },

    closeAlertDialog() {
      this.alertDialog = false;
      this.editingAlert = null;
    },

    saveAlert() {
      // Validate required fields
      const errors = [];

      // Validate common required fields
      if (!this.alertForm.title) errors.push('Title is required');
      if (!this.alertForm.condition_prompt) errors.push('Condition Prompt is required');
      if (!this.alertForm.notify_text) errors.push('Notification Text is required');

      // Validate email subject is required for email notifications
      if (this.alertForm.notify_method === 'email' && !this.alertForm.notify_subject) {
        errors.push('Notification Subject is required for email notifications');
      }

      // Validate at least one recipient (users or entities)
      if (!this.alertForm.notify_users && !this.alertForm.notify_entities) {
        errors.push('At least one recipient (Users or Entities) is required');
      }

      // Show errors if validation failed
      if (errors.length > 0) {
        this.snackbarText = errors.join(', ');
        this.snackbarColor = "error";
        this.snackbarSave = true;
        return;
      }

      if (this.editingAlert) {
        // Update existing alert
        appUtils
          .req({
            method: "PUT",
            url: `api/memsy-notification/${this.editingAlert.id}`,
            data: this.alertForm
          })
          .then((response) => {
            if (response.data.status == 1) {
              console.log("Alert updated successfully");
              this.refreshAlerts();
              this.closeAlertDialog();

              // Show success message
              this.snackbarText = this.$t("Alert updated successfully");
              this.snackbarColor = "success";
              this.snackbarSave = true;
            } else {
              console.error("Failed to update alert:", response.data);

              // Show error message
              this.snackbarText = this.$t("Failed to update alert");
              this.snackbarColor = "error";
              this.snackbarSave = true;
            }
          })
          .catch((error) => {
            console.error("Error updating alert:", error);

            // Show error message
            this.snackbarText = this.$t("Error updating alert");
            this.snackbarColor = "error";
            this.snackbarSave = true;
          });
      } else {
        // Create new alert
        appUtils
          .post({
            url: "api/memsy-notification",
            data: this.alertForm
          })
          .then((response) => {
            if (response.data.status == 1) {
              console.log("Alert created successfully");
              this.refreshAlerts();
              this.closeAlertDialog();

              // Show success message
              this.snackbarText = this.$t("Alert created successfully");
              this.snackbarColor = "success";
              this.snackbarSave = true;
            } else {
              console.error("Failed to create alert:", response.data);

              // Show error message
              this.snackbarText = this.$t("Failed to create alert");
              this.snackbarColor = "error";
              this.snackbarSave = true;
            }
          })
          .catch((error) => {
            console.error("Error creating alert:", error);

            // Show error message
            this.snackbarText = this.$t("Error creating alert");
            this.snackbarColor = "error";
            this.snackbarSave = true;
          });
      }
    },

    editAlert(alert) {
      this.openAlertDialog(alert);
    },

    deleteAlert(alert) {
      this.alertToDelete = alert;
      this.deleteDialog = true;
    },

    confirmDeleteAlert() {
      if (!this.alertToDelete) return;

      appUtils
        .req({
          method: "DELETE",
          url: `api/memsy-notification/${this.alertToDelete.id}`
        })
        .then((response) => {
          if (response.data.status == 1) {
            console.log("Alert deleted successfully");
            this.refreshAlerts();
          } else {
            console.error("Failed to delete alert:", response.data);
          }
        })
        .catch((error) => {
          console.error("Error deleting alert:", error);
        })
        .finally(() => {
          this.deleteDialog = false;
          this.alertToDelete = null;
        });
    },

    logLevelChanged: function(val) {
      console.log(val);
      this.logLevel = val.value;
      this.refresh();
    },
    compChanged: function(val) {
      console.log(val);
      this.comp = val;
      this.refresh();
    },
    serverNameChanged: function(val) {
      console.log(val);
      this.serverName = val;
      this.refresh();
    },
    getDateRangeText() {
      const found = this.dateRanges.find(range => range.value === this.selectedDateRange);
      if (found) {
        if (this.selectedDateRange === 'custom' && this.fromDate && this.toDate) {
          return `${this.fromDateDisplay || this.fromDate} - ${this.toDateDisplay || this.toDate}`;
        }
        return found.text;
      }
      return 'Select date range';
    },
    calculateDateRange() {
      const now = moment();

      switch(this.selectedDateRange) {
        case 'last15min':
          this.dateRange = {
            from: moment().subtract(15, 'minutes').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last1hour':
          this.dateRange = {
            from: moment().subtract(1, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last4hours':
          this.dateRange = {
            from: moment().subtract(4, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last24hours':
          this.dateRange = {
            from: moment().subtract(24, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last7days':
          this.dateRange = {
            from: moment().subtract(7, 'days').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last30days':
          this.dateRange = {
            from: moment().subtract(30, 'days').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'thisMonth':
          this.dateRange = {
            from: moment().startOf('month').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'lastMonth':
          this.dateRange = {
            from: moment().subtract(1, 'months').startOf('month').toISOString(),
            to: moment().subtract(1, 'months').endOf('month').toISOString()
          };
          break;
        case 'thisYear':
          this.dateRange = {
            from: moment().startOf('year').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'lastYear':
          this.dateRange = {
            from: moment().subtract(1, 'years').startOf('year').toISOString(),
            to: moment().subtract(1, 'years').endOf('year').toISOString()
          };
          break;
        case 'custom':
          if (this.fromDate && this.toDate) {
            this.dateRange = {
              from: moment(this.fromDate).startOf('day').toISOString(),
              to: moment(this.toDate).endOf('day').toISOString()
            };
          }
          break;
        default:
          this.dateRange = {
            from: null,
            to: null
          };
      }

      // Update display values for custom date picker
      if (this.fromDate) {
        this.fromDateDisplay = moment(this.fromDate).format('YYYY-MM-DD');
      }
      if (this.toDate) {
        this.toDateDisplay = moment(this.toDate).format('YYYY-MM-DD');
      }

      return this.dateRange;
    },

    dateRangeChanged(value) {
      this.selectedDateRange = value;

      if (value === 'custom') {
        if (!this.fromDate) {
          this.fromDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
        }
        if (!this.toDate) {
          this.toDate = moment().format('YYYY-MM-DD');
        }
        this.fromDateDisplay = moment(this.fromDate).format('YYYY-MM-DD');
        this.toDateDisplay = moment(this.toDate).format('YYYY-MM-DD');
      } else {
        this.calculateDateRange();
        this.refresh();
        this.dateRangeMenu = false;
      }
    },

    customDateChanged() {
      if (this.fromDate && this.toDate) {
        this.calculateDateRange();
        this.refresh();
      }
    },

    openProfileSelector() {
      this.profileSelectorDialog = true;
      this.loadProfiles();
    },

    loadProfiles() {
      this.profileLoading = true;

      // Calculate pagination parameters
      let limit = this.profileOptions.itemsPerPage;
      let offset = (this.profileOptions.page - 1) * limit;

      appUtils
        .post({
          url: "api/profiles",
          data: {
            offset: offset,
            limit: limit,
            sortBy: this.profileOptions.sortBy,
            sortDesc: this.profileOptions.sortDesc,
            search: this.profileSearch,
          },
        })
        .then((response) => {
          console.log("profiles response:", response.data);
          if (response.data.status == 1) {
            this.profileRows = response.data.profiles;
            this.profileTotalItems = response.data.totalItems;

            // Pre-select profiles already in the notify_users field
            this.preSelectProfiles();
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => {
          console.log("Error loading profiles:", error);
        })
        .finally(() => {
          this.profileLoading = false;
        });
    },

    preSelectProfiles() {
      // Clear previous selections
      this.selectedProfiles = [];

      // Get the list of emails from notify_users
      if (!this.alertForm.notify_users) return;

      const emails = this.alertForm.notify_users.split(',').map(email => email.trim());

      // Find matching profiles and add them to selectedProfiles
      emails.forEach(email => {
        const profile = this.profileRows.find(p => p.email === email);
        if (profile) {
          this.selectedProfiles.push(profile);
        }
      });
    },

    addSelectedProfiles() {
      if (!this.selectedProfiles.length) {
        this.profileSelectorDialog = false;
        return;
      }

      // Extract emails from selected profiles
      const selectedEmails = this.selectedProfiles.map(profile => profile.email);

      // Get existing emails
      let existingEmails = [];
      if (this.alertForm.notify_users) {
        existingEmails = this.alertForm.notify_users
          .split(',')
          .map(email => email.trim())
          .filter(email => email); // Remove empty entries
      }

      // Merge existing and new emails (remove duplicates)
      const allEmails = [...new Set([...existingEmails, ...selectedEmails])];

      // Update the notify_users field
      this.alertForm.notify_users = allEmails.join(', ');

      this.profileSelectorDialog = false;
    },

    profileOptionsUpdated(options) {
      console.log("profileOptionsUpdated", options);
      this.profileOptions = options;
      this.loadProfiles();
    },

    saveSettings() {
      this.settingsLoading = true;

      appUtils
        .req({
          method: "PUT",
          url: "api/monitor-settings",
          data: this.settingsForm
        })
        .then((response) => {
          console.log("Settings saved successfully", response.data);

          // Update updatedAt if available in response
          if (response.data && response.data.updatedAt) {
            this.settingsForm.updatedAt = response.data.updatedAt;
          } else {
            // If not provided, use current time
            this.settingsForm.updatedAt = new Date().toISOString();
          }

          // Show success message
          this.snackbarText = this.$t("Settings saved successfully");
          this.snackbarColor = "success";
          this.snackbarSave = true;

          // Update context
          this.updateContext({
            view: 'settings',
            settings: {
              hasSecurityAnalystInstructions: !!this.settingsForm.securityAnalystCustomInstructions,
              hasFrameAnalyzerInstructions: !!this.settingsForm.frameAnalyzerCustomInstructions,
              lastUpdated: this.settingsForm.updatedAt,
              wasSaved: true
            }
          });
        })
        .catch((error) => {
          console.error("Error saving settings:", error);

          // Show error message
          this.snackbarText = this.$t("Error saving settings");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    loadSettings() {
      this.settingsLoading = true;

      appUtils
        .get({
          url: "api/monitor-settings"
        })
        .then((response) => {
          console.log("Settings loaded:", response.data);
          if (response.data) {
            this.settingsForm.securityAnalystCustomInstructions = response.data.securityAnalystCustomInstructions || "";
            this.settingsForm.frameAnalyzerCustomInstructions = response.data.frameAnalyzerCustomInstructions || "";
            this.settingsForm.updatedAt = response.data.updatedAt || null;

            // Update context with settings
            this.updateContext({
              view: 'settings',
              settings: {
                hasSecurityAnalystInstructions: !!response.data.securityAnalystCustomInstructions,
                hasFrameAnalyzerInstructions: !!response.data.frameAnalyzerCustomInstructions,
                lastUpdated: response.data.updatedAt
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error loading settings:", error);

          // Show error message
          this.snackbarText = this.$t("Error loading settings");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    resetSettings() {
      // Ask for confirmation before resetting
      if (!confirm(this.$t('Are you sure you want to reset all settings to default? This cannot be undone.'))) {
        return;
      }

      this.settingsLoading = true;

      appUtils
        .req({
          method: "DELETE",
          url: "api/monitor-settings"
        })
        .then((response) => {
          console.log("Settings reset successfully:", response.data);

          // Reset form values
          this.settingsForm.securityAnalystCustomInstructions = "";
          this.settingsForm.frameAnalyzerCustomInstructions = "";

          // Show success message
          this.snackbarText = this.$t("Settings reset to default values");
          this.snackbarColor = "success";
          this.snackbarSave = true;

          // Update context
          this.updateContext({
            view: 'settings',
            settings: {
              hasSecurityAnalystInstructions: false,
              hasFrameAnalyzerInstructions: false,
              wasReset: true
            }
          });
        })
        .catch((error) => {
          console.error("Error resetting settings:", error);

          // Show error message
          this.snackbarText = this.$t("Error resetting settings");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    loadAuthKeys() {
      this.authKeysLoading = true;

      appUtils
        .get({
          url: "api/monitor-keys"
        })
        .then((response) => {
          console.log("Auth keys loaded:", response.data);
          if (response.data.status == 1) {
            this.authKeys = response.data.auth_keys || [];
          } else {
            console.error("Failed to load auth keys:", response.data);
            this.snackbarText = this.$t("Failed to load auth keys");
            this.snackbarColor = "error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => {
          console.error("Error loading auth keys:", error);
          this.snackbarText = this.$t("Error loading auth keys");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.authKeysLoading = false;
        });
    },

    createAuthKey() {
      this.authKeysLoading = true;

      appUtils
        .post({
          url: "api/monitor-keys",
          data: {}
        })
        .then((response) => {
          console.log("Auth key created:", response.data);
          if (response.data.status == 1) {
            // Reload auth keys to show the new one
            this.loadAuthKeys();

            // Show success message
            this.snackbarText = this.$t("Auth key created successfully");
            this.snackbarColor = "success";
            this.snackbarSave = true;
          } else {
            console.error("Failed to create auth key:", response.data);
            this.snackbarText = this.$t("Failed to create auth key");
            this.snackbarColor = "error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => {
          console.error("Error creating auth key:", error);
          this.snackbarText = this.$t("Error creating auth key");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.authKeysLoading = false;
        });
    },

    deleteAuthKey(authKey) {
      console.log("deleteAuthKey called with:", authKey);
      this.authKeyToDelete = authKey;
      this.authKeyDeleteDialog = true;
      console.log("Dialog should be visible, authKeyDeleteDialog =", this.authKeyDeleteDialog);
    },

        confirmDeleteAuthKey() {
      if (!this.authKeyToDelete) {
        console.error("No auth key selected for deletion");
        return;
      }

      console.log("Deleting auth key:", this.authKeyToDelete.auth_key);
      this.authKeysLoading = true;

      appUtils
        .req({
          method: "DELETE",
          url: `api/monitor-keys/${this.authKeyToDelete.auth_key}`
        })
        .then((response) => {
          console.log("Delete auth key response:", response.data);
          if (response.data && response.data.status == 1) {
            // Reload auth keys to reflect the deletion
            this.loadAuthKeys();

            // Show success message
            this.snackbarText = this.$t("Auth key deleted successfully");
            this.snackbarColor = "success";
            this.snackbarSave = true;
          } else {
            console.error("Failed to delete auth key:", response.data);
            this.snackbarText = response.data.error || this.$t("Failed to delete auth key");
            this.snackbarColor = "error";
            this.snackbarSave = true;
          }
        })
        .catch((error) => {
          console.error("Error deleting auth key:", error);
          this.snackbarText = error.response?.data?.error || this.$t("Error deleting auth key");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        })
        .finally(() => {
          this.authKeysLoading = false;
          this.authKeyDeleteDialog = false;
          this.authKeyToDelete = null;
        });
    },

    copyAuthKey(authKey) {
      // Copy auth key to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(authKey.auth_key).then(() => {
          this.snackbarText = this.$t("Auth key copied to clipboard");
          this.snackbarColor = "success";
          this.snackbarSave = true;
        }).catch((error) => {
          console.error("Error copying to clipboard:", error);
          this.snackbarText = this.$t("Failed to copy auth key");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = authKey.auth_key;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this.snackbarText = this.$t("Auth key copied to clipboard");
          this.snackbarColor = "success";
          this.snackbarSave = true;
        } catch (error) {
          console.error("Error copying to clipboard:", error);
          this.snackbarText = this.$t("Failed to copy auth key");
          this.snackbarColor = "error";
          this.snackbarSave = true;
        }
        document.body.removeChild(textArea);
      }
    },
  },
  created: function () {
    let bcItems = [
      {
        text: appData.productName,
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("Session Monitor"),
        to: "/SessionMonitor",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);
    this.headers = [
      /*{
        text: this.$t("ID"),
        value: "ID",
      },*/

      { text: this.$t("Time"), value: "start_time" },
      { text: this.$t("Duration"), value: "duration" },
      { text: this.$t("User"), value: "email" },
      { text: this.$t("Summary"), value: "sessionTitle" },
      { text: this.$t("Device"), value: "deviceTitle" },
      { text: this.$t("Status"), value: "status" },
      { text: this.$t("Security Threat"), value: "security_threat_severity" },
      { text: this.$t("IT Issues"), value: "it_issues_severity" },
    ];

    // Setup alert headers (formerly notification headers)
    this.alertHeaders = [
      { text: this.$t("Title"), value: "title" },
      { text: this.$t("Method"), value: "notify_method" },
      { text: this.$t("Condition Prompt"), value: "condition_prompt" },
      { text: this.$t("Created By"), value: "create_user" },
      { text: this.$t("Actions"), value: "actions", sortable: false }
    ];

    // Setup profile headers
    this.profileHeaders = [
      { text: this.$t("Last Name"), value: "lastName" },
      { text: this.$t("First Name"), value: "firstName" },
      { text: this.$t("Email"), value: "email" }
    ];

    appUtils.loadPageData(page.name,this);

    // If date range wasn't loaded from saved state, set default
    if (!this.selectedDateRange) {
      this.selectedDateRange = "last24hours";
    }
    // Initialize date range
    this.calculateDateRange();

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'SessionMonitorList',
      headers: this.headers.map(h => h.text || h.value),
      dateRange: this.dateRange,
      permissions: {
        canView: appData.checkPermission('/', 'r')
      },
      lastInitialized: new Date().toISOString()
    });

    // Load initial data based on active tab
    if (this.tab === 1) { // Auth Keys tab
      this.loadAuthKeys();
    } else if (this.tab === 2) { // Alerts tab
      this.refreshAlerts();
    } else if (this.tab === 3) { // Settings tab
      this.loadSettings();
    } else {
      this.refresh(); // Default to loading sessions
    }
  },
  watch: {
    tab: function (newVal) {
      console.log(`tab change to:`, newVal);
      this.savePage();

      // Load auth keys data when switching to auth keys tab
      if (newVal === 1) { // Auth Keys tab index
        this.loadAuthKeys();
      }
      // Load alerts data when switching to alerts tab
      else if (newVal === 2) { // Alerts tab index
        this.refreshAlerts();
      }
      // Load settings data when switching to settings tab
      else if (newVal === 3) { // Settings tab index
        this.loadSettings();
      }
    },

    search: function (newVal) {
      console.log(`search: ${newVal}`);

      // Update context when search term changes
      this.updateContext({
        view: 'searching',
        searchTerm: newVal,
        isSearching: newVal.length > 0
      });

      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
        this.savePage();
      }
    },

    selectedDateRange: function (newVal) {
      console.log(`selectedDateRange: ${newVal}`);
      this.savePage();
    },

    // Watch for changes in date pickers when in custom mode
    fromDate: function () {
      if (this.selectedDateRange === 'custom' && this.toDate) {
        this.customDateChanged();
        this.savePage();
      }
    },

    toDate: function () {
      if (this.selectedDateRange === 'custom' && this.fromDate) {
        this.customDateChanged();
        this.savePage();
      }
    },

    profileSearch: function() {
      // Reload profiles when search term changes with debounce
      if (this.profileSearchTimeout) {
        clearTimeout(this.profileSearchTimeout);
      }

      this.profileSearchTimeout = setTimeout(() => {
        if (this.profileSelectorDialog) {
          // Reset to first page when search changes
          this.profileOptions.page = 1;
          this.loadProfiles();
        }
      }, 500); // 500ms debounce
    }
  },
};

export default page;
</script>