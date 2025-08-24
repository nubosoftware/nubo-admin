<template>
  <div>
    <v-card color="bg">
    <v-toolbar color="secondary" dark flat>
      <v-toolbar-title> {{ $t("Logs") }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension>
        <v-tabs v-model="tab" align-with-title>
          <v-tabs-slider color="primary"></v-tabs-slider>

          <v-tab key="events"> {{ $t("Events") }} </v-tab>
          <v-tab key="list" v-if="appData.checkPermission('@/','r')"> {{ $t("Syslog") }} </v-tab>
          <v-tab key="files" v-if="appData.checkPermission('@/','r')"> {{ $t("Files") }} </v-tab>
          <v-tab key="versions" v-if="appData.checkPermission('@/','r')"> {{ $t("Versions") }} </v-tab>

        </v-tabs>
      </template>
    </v-toolbar>

    <v-tabs-items v-model="tab">

       <v-tab-item key="events" class="bg">
         <v-data-table
          color="bg"
          :headers="eventsHeaders"
          :items="eventsRows"
          :server-items-length="eventsTotalItems"
          :items-per-page="10"
          :loading="eventsLoading"
          :options.sync="eventsOptions"
          :search="eventsSearch"
          class="bg events-table"
          multi-sort
          :footer-props="{
            'items-per-page-options': [5, 10, 15, 20, 50],
            'items-per-page-text': 'Rows per page:',
            'show-first-last-page': true
          }"
          @update:options="updateEventsOptions"
          @click:row="rowClick"
        >
          <template v-slot:top>
            <v-toolbar flat color="bg" class="px-4">
              <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('System Events') }}</v-toolbar-title>
              <v-spacer></v-spacer>
              
              <!-- Event Type Filter -->
              <v-select
                v-model="eventsFilters.eventTypes"
                :items="eventTypeOptions"
                :label="$t('Event Type')"
                clearable
                multiple
                dense
                chips
                deletable-chips
                class="mr-2"
                style="max-width: 200px;"
                @change="refreshEvents"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip
                    v-if="index === 0"
                    small
                    :color="getEventTypeColor(item.value)"
                    text-color="white"
                    close
                    @click:close="removeEventTypeFilter(item.value)"
                  >
                    <span>{{ item.text }}</span>
                  </v-chip>
                  <span v-if="index === 1" class="grey--text caption">
                    (+{{ eventsFilters.eventTypes.length - 1 }} others)
                  </span>
                </template>
              </v-select>
              
              <!-- Level Filter -->
              <v-select
                v-model="eventsFilters.levels"
                :items="levelOptions"
                :label="$t('Level')"
                clearable
                multiple
                dense
                chips
                deletable-chips
                class="mr-2"
                style="max-width: 150px;"
                @change="refreshEvents"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip
                    v-if="index < 2"
                    small
                    :color="getLevelColor(item.value)"
                    :text-color="getLevelTextColor(item.value)"
                    close
                    @click:close="removeLevelFilter(item.value)"
                  >
                    {{ item.text }}
                  </v-chip>
                  <span v-if="index === 2" class="grey--text caption">
                    (+{{ eventsFilters.levels.length - 2 }} more)
                  </span>
                </template>
              </v-select>
              
              <!-- Category Filter -->
              <v-select
                v-model="eventsFilters.categories"
                :items="categoryOptions"
                :label="$t('Category')"
                clearable
                multiple
                dense
                chips
                deletable-chips
                class="mr-2"
                style="max-width: 180px;"
                @change="refreshEvents"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip
                    v-if="index === 0"
                    small
                    :color="getCategoryColor(item.value)"
                    text-color="white"
                    close
                    @click:close="removeCategoryFilter(item.value)"
                  >
                    <span>{{ item.text }}</span>
                  </v-chip>
                  <span v-if="index === 1" class="grey--text caption">
                    (+{{ eventsFilters.categories.length - 1 }} others)
                  </span>
                </template>
              </v-select>
              
              <!-- User Email Filter -->
              <v-combobox
                v-model="eventsFilters.userEmails"
                :label="$t('User Email')"
                multiple
                chips
                deletable-chips
                clearable
                dense
                class="mr-2"
                style="max-width: 200px;"
                @change="refreshEvents"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip
                    v-if="index === 0"
                    small
                    color="primary"
                    text-color="white"
                    close
                    @click:close="removeUserEmailFilter(item)"
                  >
                    {{ item }}
                  </v-chip>
                  <span v-if="index === 1" class="grey--text caption">
                    (+{{ eventsFilters.userEmails.length - 1 }} others)
                  </span>
                </template>
              </v-combobox>

              <!-- Date Range Menu -->
              <v-menu
                v-model="eventsDateRangeMenu"
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
                    {{ getEventsDateRangeText() }}
                  </v-btn>
                </template>
                <v-card>
                  <v-list dense>
                    <v-list-item-group
                      v-model="eventsSelectedDateRange"
                      mandatory
                      @change="eventsDateRangeChanged"
                    >
                      <v-list-item v-for="(item, i) in eventsDateRanges" :key="i" :value="item.value">
                        <v-list-item-content>
                          <v-list-item-title>{{ item.text }}</v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list-item-group>
                  </v-list>
                  <v-divider v-if="eventsSelectedDateRange === 'custom'"></v-divider>
                  <v-card-text v-if="eventsSelectedDateRange === 'custom'">
                    <v-row dense>
                      <v-col cols="12">
                        <v-menu
                          v-model="eventsFromDateMenu"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          offset-y
                          min-width="290px"
                        >
                          <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                              v-model="eventsFromDateDisplay"
                              label="From"
                              readonly
                              dense
                              v-bind="attrs"
                              v-on="on"
                              prepend-icon="mdi-calendar"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="eventsFromDate"
                            @input="eventsFromDateMenu = false"
                            @change="eventsCustomDateChanged"
                          ></v-date-picker>
                        </v-menu>
                      </v-col>
                      <v-col cols="12">
                        <v-menu
                          v-model="eventsToDateMenu"
                          :close-on-content-click="false"
                          transition="scale-transition"
                          offset-y
                          min-width="290px"
                        >
                          <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                              v-model="eventsToDateDisplay"
                              label="To"
                              readonly
                              dense
                              v-bind="attrs"
                              v-on="on"
                              prepend-icon="mdi-calendar"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            v-model="eventsToDate"
                            @input="eventsToDateMenu = false"
                            @change="eventsCustomDateChanged"
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
                      @click="eventsDateRangeMenu = false"
                    >
                      Close
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>

              <!-- Search Field -->
              <v-text-field
                v-model="eventsSearch"
                append-icon="mdi-magnify"
                label="Search in event details"
                single-line
                hide-details
                dense
                class="search-field mr-4"
                style="max-width: 300px;"
              ></v-text-field>
              
              <!-- Refresh Button -->
              <v-btn color="primary" small @click="refreshEvents" class="ml-2">
                <v-icon left small>mdi-refresh</v-icon>
                {{ $t('Refresh') }}
              </v-btn>
            </v-toolbar>
          </template>

          <!-- Event Type Column -->
          <template v-slot:[`item.eventTypeStr`]="{ item }">
            <v-chip
              small
              :color="getEventTypeColor(item.eventtype)"
              text-color="white"
              class="event-type-chip"
            >
              <v-icon left small>{{ getEventTypeIcon(item.eventtype) }}</v-icon>
              {{ item.eventTypeStr }}
            </v-chip>
          </template>
          
          <!-- Category Column -->
          <template v-slot:[`item.categoryStr`]="{ item }">
            <v-chip
              small
              :color="getCategoryColor(item.category)"
              text-color="white"
              class="category-chip"
            >
              <v-icon left small>{{ getCategoryIcon(item.category) }}</v-icon>
              {{ item.categoryStr || 'N/A' }}
            </v-chip>
          </template>

          <!-- Level Column -->
          <template v-slot:[`item.level`]="{ item }">
            <v-chip
              small
              :color="getLevelColor(item.level)"
              :text-color="getLevelTextColor(item.level)"
              class="level-chip"
            >
              <v-icon left small>{{ getLevelIcon(item.level) }}</v-icon>
              {{ getLevelText(item.level) }}
            </v-chip>
          </template>

          <!-- Time Column -->
          <template v-slot:[`item.time`]="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on">
                  {{ moment(item.time).format("MMM DD, HH:mm") }}
                </span>
              </template>
              <span>{{ moment(item.time).format("LLLL") }}</span>
            </v-tooltip>
          </template>

          <!-- User Email Column -->
          <template v-slot:[`item.email`]="{ item }">
            <div class="d-flex align-center">
              <v-icon small color="primary" class="mr-1">mdi-account</v-icon>
              {{ item.email || 'N/A' }}
            </div>
          </template>

          <!-- Extra Info Column -->
          <template v-slot:[`item.extrainfo`]="{ item }">
            <v-tooltip bottom max-width="400px">
              <template v-slot:activator="{ on, attrs }">
                <span 
                  v-bind="attrs" 
                  v-on="on" 
                  class="text-truncate event-info-text" 
                  style="max-width: 300px; display: inline-block; cursor: pointer;"
                >
                  {{ item.extrainfo || 'No additional information' }}
                </span>
              </template>
              <span>{{ item.extrainfo || 'No additional information' }}</span>
            </v-tooltip>
          </template>

          <!-- Actions Column -->
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              icon
              small
              color="primary"
              @click="viewEventDetails(item)"
              :title="$t('View Details')"
            >
              <v-icon small>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              small
              color="info"
              @click="exportEventData(item)"
              :title="$t('Export Event Data')"
            >
              <v-icon small>mdi-download</v-icon>
            </v-btn>
          </template>

          <template v-slot:loading>
            <v-skeleton-loader
              type="table-row@6"
              class="my-2"
            ></v-skeleton-loader>
          </template>
          
          <template v-slot:no-data>
            <div class="text-center py-4">
              <v-icon large color="grey lighten-1">mdi-calendar-alert</v-icon>
              <p class="mt-2 grey--text">{{ $t('No events found for the selected criteria') }}</p>
            </div>
          </template>
        </v-data-table>
       </v-tab-item>
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
          class="ma-4 bg"
          multi-sort
          @update:options="updateOptions"
          @click:row="rowClick"
        >
          <template v-slot:top>
            <v-toolbar flat color="bg">

              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
              ></v-text-field>
            </v-toolbar>
          </template>
          <template v-slot:[`header.ComponentType`]="{ header }">
            <v-combobox
              v-model="selectComponentType"
              :items="itemsComponentType"
              :label="header.text"
              class="input-combobox"
              @change="compChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`header.ServerName`]="{ header }">
            <v-combobox
              v-model="selectServerName"
              :items="itemsServerName"
              :label="header.text"
              class="input-combobox"
              @change="serverNameChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`header.LogLevel`]="{ header }">
            <v-combobox
              v-model="selectLogLevel"
              :items="itemsLogLevel"
              :label="header.text"
              class="input-combobox"
              @change="logLevelChanged"
            ></v-combobox>
          </template>
          <template v-slot:[`item.LogLevel`]="{ item }">
              <v-chip
                v-if="item.LogLevel <= 3"
                class="ma-2"
                color="error"
                text-color="white"
              >
                {{$t("Error")}}
              </v-chip>
              <v-chip
                v-else-if="item.LogLevel == 4"
                class="ma-2"
                color="warning"
                text-color="white"
              >
                {{$t("Warning")}}
              </v-chip>
              <v-chip
                v-else-if="item.LogLevel <= 6 "
                class="ma-2"
              >
                {{$t("Information")}}
              </v-chip>
              <v-chip
                v-else
                class="ma-2"

              >
                {{$t("Debug")}}
              </v-chip>

            </template>
            <template v-slot:[`item.Time`]="{ item }">
              {{ moment(item.Time).format("LLL") }}
            </template>
        </v-data-table>
      </v-tab-item>
      <v-tab-item key="file" class="bg">
        <v-data-table
          v-if="!filesError"
          :headers="fileHeaders"
          :items="files"
          :items-per-page="20"
          :loading="filesLoading"
          @click:row="downloadFile"
          :options.sync="fileOptions"
          @update:options="updateFileOptions"
          class="elevation-1 ma-4 bg"
        >
        <template v-slot:[`item.size`]="{ item }">
          {{ item.sizeStr }}
        </template>
        <template v-slot:[`item.lastModified`]="{ item }">
          {{ moment(item.lastModified).format("LLL") }}
        </template>
        </v-data-table>
        <v-alert
          v-else
          :value="true"
          :type=filesAlertType
          class="ma-4"
        >
          {{ filesError }}
        </v-alert>
      </v-tab-item>
      <v-tab-item key="versions" class="bg">
        <v-data-table
          v-if="!filesError"
          :headers="versionsHeaders"
          :items="versions"
          :items-per-page="20"
          :loading="filesLoading"
          :options.sync="versionsOptions"
          @update:options="updateVersionsOptions"
          class="elevation-1 ma-4 bg"
        >
          <template v-slot:[`item.componentName`]="{ item }">
            <v-icon class="mr-2">
              {{ getComponentIcon(item.componentName) }}
            </v-icon>
            {{ item.componentName }}
          </template>
          <template v-slot:[`item.buildTime`]="{ item }">
            {{ item.buildTime ? moment(item.buildTime).format("LLL") : '' }}
          </template>
          <template v-slot:[`item.componentIndex`]="{ item }">
            {{ ['android-nubo-platform', 'management' ,'mysql'].includes(item.componentName) ? '' : item.componentIndex }}
          </template>
        </v-data-table>
      </v-tab-item>

    </v-tabs-items>
  </v-card>

  <!-- Event Details Modal -->
  <v-dialog v-model="eventDetailsDialog.show" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="headline">
        <v-icon left color="primary">mdi-calendar-text</v-icon>
        {{ $t('Event Details') }}
        <v-spacer></v-spacer>
        <v-btn icon @click="eventDetailsDialog.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-0">
        <v-container class="py-4" v-if="eventDetailsDialog.item">
          <!-- Event Header -->
          <v-row class="mb-4">
            <v-col cols="12">
              <div class="d-flex flex-wrap align-center ga-2">
                <v-chip
                  :color="getEventTypeColor(eventDetailsDialog.item.eventtype)"
                  text-color="white"
                  class="font-weight-medium mr-2"
                >
                  <v-icon left small>{{ getEventTypeIcon(eventDetailsDialog.item.eventtype) }}</v-icon>
                  {{ eventDetailsDialog.item.eventTypeStr || 'Unknown Event' }}
                </v-chip>
                
                <v-chip
                  v-if="eventDetailsDialog.item.level"
                  :color="getLevelColor(eventDetailsDialog.item.level)"
                  :text-color="getLevelTextColor(eventDetailsDialog.item.level)"
                  class="mr-2"
                >
                  <v-icon left small>{{ getLevelIcon(eventDetailsDialog.item.level) }}</v-icon>
                  {{ getLevelText(eventDetailsDialog.item.level) }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <!-- Event Information -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-card flat outlined>
                <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                  <v-icon left small>mdi-information-outline</v-icon>
                  {{ $t('Event Information') }}
                </v-card-title>
                <v-card-text class="pa-3">
                  <div class="mb-2">
                    <strong>{{ $t('Event Type') }}:</strong><br>
                    <span class="text-body-2">{{ eventDetailsDialog.item.eventTypeStr || 'N/A' }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>{{ $t('Event ID') }}:</strong><br>
                    <span class="text-body-2">{{ eventDetailsDialog.item.eventtype || 'N/A' }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>{{ $t('Time') }}:</strong><br>
                    <span class="text-body-2">{{ moment(eventDetailsDialog.item.time).format("LLLL") }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>{{ $t('Level') }}:</strong><br>
                    <v-chip
                      v-if="eventDetailsDialog.item.level"
                      small
                      :color="getLevelColor(eventDetailsDialog.item.level)"
                      :text-color="getLevelTextColor(eventDetailsDialog.item.level)"
                    >
                      <v-icon left small>{{ getLevelIcon(eventDetailsDialog.item.level) }}</v-icon>
                      {{ getLevelText(eventDetailsDialog.item.level) }}
                    </v-chip>
                    <span v-else class="text-body-2 grey--text">N/A</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card flat outlined>
                <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                  <v-icon left small>mdi-account-outline</v-icon>
                  {{ $t('User Information') }}
                </v-card-title>
                <v-card-text class="pa-3">
                  <div class="mb-2">
                    <strong>{{ $t('User Email') }}:</strong><br>
                    <span class="text-body-2">{{ eventDetailsDialog.item.email || 'N/A' }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>{{ $t('Timestamp') }}:</strong><br>
                    <span class="text-body-2">{{ moment(eventDetailsDialog.item.time).format("YYYY-MM-DD HH:mm:ss") }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>{{ $t('Relative Time') }}:</strong><br>
                    <span class="text-body-2">{{ moment(eventDetailsDialog.item.time).fromNow() }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Additional Information -->
          <v-row class="mb-4">
            <v-col cols="12">
              <v-card flat outlined>
                <v-card-title class="text-subtitle-1 py-2 bg-primary white--text">
                  <v-icon left small color="white">mdi-text-box-outline</v-icon>
                  {{ $t('Additional Information') }}
                </v-card-title>
                <v-card-text class="pa-3">
                  <div class="text-body-1 event-details-text">
                    {{ eventDetailsDialog.item.extrainfo || 'No additional information available' }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      
      <v-card-actions>
        <v-btn
          color="info"
          @click="exportEventData(eventDetailsDialog.item)"
        >
          <v-icon left small>mdi-download</v-icon>
          {{ $t('Export Event Data') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="eventDetailsDialog.show = false"
        >
          {{ $t('Close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar for notifications -->
  <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor">
    {{ snackbarText }}
    <template v-slot:action="{ attrs }">
      <v-btn text v-bind="attrs" @click="snackbar = false">
        {{ $t('Close') }}
      </v-btn>
    </template>
  </v-snackbar>

  <!--<v-btn @click="refresh">Refresh</v-btn>-->
  </div>
</template>


<style>

.input-combobox {
  height: 40px;
  font-size: 10pt;
}
.v-label {
  height: 40px;
  font-size: 10pt;
}

/* Enhanced Events Table Styling */
.events-table {
  border-radius: 0;
}

.event-type-chip {
  min-width: 120px;
  justify-content: center;
}

.level-chip {
  min-width: 80px;
  justify-content: center;
}

.category-chip {
  min-width: 120px;
  justify-content: center;
}

.search-field .v-input__slot {
  min-height: 36px !important;
}

.event-info-text {
  cursor: pointer;
}

.event-info-text:hover {
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  padding: 2px 4px;
}

.event-details-text {
  word-break: break-word;
  white-space: pre-wrap;
}

/* Fix for filter overlapping issues */
.events-table .v-toolbar {
  z-index: 1;
  position: relative;
}

/* Ensure filter dropdowns appear above table content */
.events-table .v-select__selections,
.events-table .v-combobox__selections,
.events-table .v-menu__content {
  z-index: 10 !important;
}

.events-table .v-select .v-select__slot,
.events-table .v-combobox .v-select__slot {
  min-height: 36px !important;
}

/* Fix for overlapping menu content */
.v-menu__content {
  z-index: 2000 !important;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
              0 8px 10px 1px rgba(0, 0, 0, 0.14),
              0 3px 14px 2px rgba(0, 0, 0, 0.12) !important;
}

/* Ensure proper spacing for filter toolbar */
.events-table .v-toolbar {
  margin-top: 16px;
}

.events-table .v-toolbar .v-toolbar__content {
  padding: 8px 16px;
  min-height: 64px;
}

/* Fix for date range menu overlapping */
.v-menu--attached .v-menu__content {
  margin-top: 0 !important;
}

/* Ensure chips in filters don't overlap */
.events-table .v-select .v-chip {
  margin: 2px 4px 2px 0;
  max-width: 140px;
}

.events-table .v-combobox .v-chip {
  margin: 2px 4px 2px 0;
  max-width: 160px;
}

/* Data table header styling */
.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.025em;
  position: relative;
  z-index: 1;
}

/* Ensure data table content doesn't interfere with filters */
.v-data-table__wrapper {
  position: relative;
  z-index: 0;
}

/* Dialog styling enhancements */
.v-dialog .v-card {
  border-radius: 8px;
}

.v-dialog .v-card-title {
  border-bottom: 1px solid #e0e0e0;
}
</style>

 <script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

let page = {
  name: "Logs",
  mixins: [contextUpdater],
  data: () => ({
    tab: {},
    headers: [],
    rows: [],
    search: "",
    totalItems: 0,
    loading: true,
    options: {},
    selectComponentType: [],
    itemsComponentType: [],
    selectServerName: [],
    itemsServerName: [],
    selectLogLevel: [],
    itemsLogLevel: [],
    logLevel: 1000,
    comp: null,
    serverName: null,
    // Enhanced Events Tab
    eventsHeaders: [],
    eventsRows: [],
    eventsSearch: "",
    eventsLoading: false,
    eventsTotalItems: 0,
    eventsOptions: {},
    eventsFilters: {
      eventTypes: [],
      levels: [],
      userEmails: [],
      categories: []
    },
    
    // Events Date Range functionality
    eventsDateRangeMenu: false,
    eventsSelectedDateRange: "last24hours",
    eventsFromDateMenu: false,
    eventsToDateMenu: false,
    eventsDateRanges: [
      { text: "Last 15 minutes", value: "last15min" },
      { text: "Last hour", value: "last1hour" },
      { text: "Last 4 hours", value: "last4hours" },
      { text: "Last 24 hours", value: "last24hours" },
      { text: "Last 7 days", value: "last7days" },
      { text: "Last 30 days", value: "last30days" },
      { text: "This month", value: "thisMonth" },
      { text: "Last month", value: "lastMonth" },
      { text: "Custom", value: "custom" }
    ],
    eventsFromDate: null,
    eventsToDate: null,
    eventsFromDateDisplay: null,
    eventsToDateDisplay: null,
    eventsDateRange: {
      from: null,
      to: null
    },
    
    // Filter Options for Events
    eventTypeOptions: [],
    categoryOptions: [],
    levelOptions: [
      { text: "Info", value: "info" },
      { text: "Warning", value: "warn" },
      { text: "Error", value: "err" }
    ],
    
    // Event Details Dialog
    eventDetailsDialog: {
      show: false,
      item: {}
    },
    
    // Snackbar for notifications
    snackbar: false,
    snackbarText: "",
    snackbarColor: "info",
    files: [],
    fileHeaders: [],
    fileOptions: {},
    filesLoading: false,
    filesError: false,
    filesAlertType: "error",
    versions: [],
    versionsHeaders: [],
    versionsLoading: false,
    moment,
    appData,
    versionsOptions: {
      sortBy: ['componentName'],
      sortDesc: [false]
    },
  }),
  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`,this,['tab','options','fileOptions','versionsOptions','eventsOptions','eventsSelectedDateRange','eventsFromDate','eventsToDate','eventsFilters','search','eventsSearch','selectComponentType','selectServerName','selectLogLevel','logLevel','comp','serverName']);
    },
    updateOptions(options) {
      console.log("update:options", options);
      this.refresh();
    },

    rowClick: function (val) {
      console.log(`rowClick: ${val.email}`);
      //this.$router.push("/Profile/" + val.email);
    },


    refresh: function () {
      /*if (!this.appData.isEnterpriseEdition()) {
        return;
      }*/
      let limit =
        this.options.itemsPerPage > 0 ? this.options.itemsPerPage : 10000;
      let offset = (this.options.page - 1) * limit;
      let s = Math.round(new Date().getTime() / 1000 - 60 * 60 * 24 * 5);
      console.log(`refresh..`);
      appUtils
        .post({
          url: "api/logs",
          data: {
            s: s,
            offset: offset,
            limit: limit,
            sortBy: this.options.sortBy,
            sortDesc: this.options.sortDesc,
            search: this.search,
            level: this.logLevel,
            comp: this.comp,
            serverName: this.serverName
          },
        })
        .then((response) => {
          console.log(`refresh reponse..`);
          console.log(response.data);
          if (response.data.status == 1) {
            this.rows = response.data.logs;
            this.totalItems = response.data.count;

            // Update context with logs data
            this.updateContext({
              view: 'logs',
              tab: 'syslog',
              loading: false,
              logsData: {
                count: this.totalItems,
                recentLogs: this.rows.slice(0, 5).map(log => ({
                  time: log.Time,
                  level: log.LogLevel,
                  component: log.ComponentType,
                  message: log.Message
                }))
              },
              filters: {
                search: this.search,
                logLevel: this.logLevel,
                component: this.comp,
                serverName: this.serverName
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            console.log(`status: ${response.data.status}`);

            // Update context with error
            this.updateContext({
              view: 'logs',
              tab: 'syslog',
              loading: false,
              error: `Failed to load logs (status: ${response.data.status})`
            });
          }
        })
        .catch((error) => {
          console.log(error);

          // Update context with error
          this.updateContext({
            view: 'logs',
            tab: 'syslog',
            loading: false,
            error: `Error loading logs: ${error}`
          });
        })
        .finally(() => (this.loading = false));
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
    getFilters: function () {
      /*if (!this.appData.isEnterpriseEdition()) {
        return;
      }*/
      console.log("getFilters");
      appUtils
        .get({
          url: "api/logs/getFilters",
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.status == 1) {
            console.log(`status: ${response.data.status}`);
            //this.filters = response.data;
            this.itemsComponentType = [];
            response.data.ComponentType.forEach(item => {
              if (item.ComponentType != "")
                this.itemsComponentType.push(item.ComponentType)
            });
            this.itemsServerName = [];
            response.data.ServerName.forEach(item => {
              if (item.ServerName != "")
                this.itemsServerName.push(item.ServerName)
            });
            this.itemsLogLevel = [
              { value: "3", text: this.$t("Error")},
              { value: "4", text: this.$t("Warning")},
              { value: "6", text: this.$t("Info")},
              { value: "7", text: this.$t("Debug")},
            ];
          } else {
            console.log(`status: ${response.data.status}`);
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (this.loading = false));
    },
    // Enhanced Events Methods
    refreshEvents: function() {
      this.eventsLoading = true;
      this.calculateEventsDateRange();
      console.log("refreshEvents. eventsOptions:", this.eventsOptions);

      let limit = this.eventsOptions.itemsPerPage > 0 ? this.eventsOptions.itemsPerPage : 10;
      let offset = (this.eventsOptions.page - 1) * limit;
      // if (!this.eventsOptions.sortBy || this.eventsOptions.sortBy.length === 0) {
      //   this.eventsOptions.sortBy = ["time"];
      //   this.eventsOptions.sortDesc = [true];
      // }

      const sortBy = this.eventsOptions.sortBy?.[0] || "time";
      const sortDesc = (this.eventsOptions.sortDesc?.[0] === true || this.eventsOptions.sortDesc?.[0] ===  undefined) ? "DESC" : "ASC";

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: sortBy,
        sortDirection: sortDesc,
        s: this.eventsDateRange.from,
        e: this.eventsDateRange.to
      };

      // Add filters only if they have values
      if (this.eventsFilters.eventTypes && this.eventsFilters.eventTypes.length > 0) {
        requestData.eventtype = this.eventsFilters.eventTypes;
      }
      if (this.eventsFilters.levels && this.eventsFilters.levels.length > 0) {
        requestData.level = this.eventsFilters.levels;
      }
      if (this.eventsFilters.categories && this.eventsFilters.categories.length > 0) {
        requestData.category = this.eventsFilters.categories;
      }
      if (this.eventsFilters.userEmails && this.eventsFilters.userEmails.length > 0) {
        requestData.email = this.eventsFilters.userEmails;
      }
      if (this.eventsSearch && this.eventsSearch.trim() !== "") {
        requestData.text = this.eventsSearch.trim();
      }

      appUtils
        .post({
          url: "api/events",
          data: requestData,
        })
        .then((response) => {
          if (response.data.status == 1 || response.data.status === "1") {
            this.eventsRows = response.data.events || [];
            // For server-side pagination, set a reasonable total or use the current results length
            // Since the API doesn't provide total count, we'll use a large number to enable pagination
            // If we get fewer results than the limit, we know we're at the end
            this.eventsTotalItems = response.data.total || 0;


            // Populate event type options from API response
            if (response.data.eventTypes && !this.eventTypeOptions.length) {
              this.eventTypeOptions = response.data.eventTypes.map(et => ({
                text: et.eventTypeStr,
                value: et.eventtype
              })).sort((a, b) => a.text.localeCompare(b.text));
            }

            // Populate category options from API response
            if (response.data.eventTypes) {
              // Extract unique categories from eventTypes
              const uniqueCategories = [...new Set(response.data.eventTypes.map(et => et.category))];
              this.categoryOptions = uniqueCategories.map(category => {
                const eventType = response.data.eventTypes.find(et => et.category === category);
                return {
                  text: eventType.categoryStr,
                  value: category
                };
              }).sort((a, b) => a.text.localeCompare(b.text));
            }

            // Update context with events data
            this.updateContext({
              view: 'logs',
              tab: 'events',
              loading: false,
              eventsData: {
                count: this.eventsTotalItems,
                recentEvents: this.eventsRows.slice(0, 5).map(event => ({
                  time: event.time,
                  type: event.eventTypeStr,
                  user: event.email,
                  info: event.extrainfo
                }))
              },
              filters: {
                search: this.eventsSearch,
                eventTypes: this.eventsFilters.eventTypes,
                levels: this.eventsFilters.levels,
                userEmails: this.eventsFilters.userEmails,
                dateRange: this.eventsDateRange
              },
              lastUpdated: new Date().toISOString()
            });
          } else {
            this.showError(`Failed to load events (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          console.error("Events API Error:", error);
          this.showError(`Error loading events: ${error.message || error}`);
        })
        .finally(() => {
          this.eventsLoading = false;
          this.savePage();
        });
    },

    updateEventsOptions(options) {
      console.log("updateEventsOptions:", options);
      this.eventsOptions = options;
      this.refreshEvents();
      this.savePage();
    },

    // Date Range Methods for Events
    getEventsDateRangeText() {
      const found = this.eventsDateRanges.find(range => range.value === this.eventsSelectedDateRange);
      if (found) {
        if (this.eventsSelectedDateRange === 'custom' && this.eventsFromDate && this.eventsToDate) {
          return `${this.eventsFromDateDisplay || this.eventsFromDate} - ${this.eventsToDateDisplay || this.eventsToDate}`;
        }
        return found.text;
      }
      return 'Last 24 hours';
    },

    calculateEventsDateRange() {
      const now = moment();
      switch(this.eventsSelectedDateRange) {
        case 'last15min':
          this.eventsDateRange = {
            from: moment().subtract(15, 'minutes').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last1hour':
          this.eventsDateRange = {
            from: moment().subtract(1, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last4hours':
          this.eventsDateRange = {
            from: moment().subtract(4, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last24hours':
          this.eventsDateRange = {
            from: moment().subtract(24, 'hours').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last7days':
          this.eventsDateRange = {
            from: moment().subtract(7, 'days').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'last30days':
          this.eventsDateRange = {
            from: moment().subtract(30, 'days').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'thisMonth':
          this.eventsDateRange = {
            from: moment().startOf('month').toISOString(),
            to: now.toISOString()
          };
          break;
        case 'lastMonth':
          this.eventsDateRange = {
            from: moment().subtract(1, 'months').startOf('month').toISOString(),
            to: moment().subtract(1, 'months').endOf('month').toISOString()
          };
          break;
        case 'custom':
          if (this.eventsFromDate && this.eventsToDate) {
            this.eventsDateRange = {
              from: moment(this.eventsFromDate).startOf('day').toISOString(),
              to: moment(this.eventsToDate).endOf('day').toISOString()
            };
          }
          break;
        default:
          this.eventsDateRange = {
            from: moment().subtract(24, 'hours').toISOString(),
            to: now.toISOString()
          };
      }

      // Update display dates
      if (this.eventsFromDate) {
        this.eventsFromDateDisplay = moment(this.eventsFromDate).format('YYYY-MM-DD');
      }
      if (this.eventsToDate) {
        this.eventsToDateDisplay = moment(this.eventsToDate).format('YYYY-MM-DD');
      }

      return this.eventsDateRange;
    },

    eventsDateRangeChanged(value) {
      this.eventsSelectedDateRange = value;
      if (value === 'custom') {
        if (!this.eventsFromDate) {
          this.eventsFromDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
        }
        if (!this.eventsToDate) {
          this.eventsToDate = moment().format('YYYY-MM-DD');
        }
        this.eventsFromDateDisplay = moment(this.eventsFromDate).format('YYYY-MM-DD');
        this.eventsToDateDisplay = moment(this.eventsToDate).format('YYYY-MM-DD');
      } else {
        this.calculateEventsDateRange();
        this.refreshEvents();
        this.eventsDateRangeMenu = false;
      }
      this.savePage();
    },

    eventsCustomDateChanged() {
      if (this.eventsFromDate && this.eventsToDate) {
        this.calculateEventsDateRange();
        this.refreshEvents();
      }
    },

    // Filter Management Methods
    removeEventTypeFilter(eventType) {
      const index = this.eventsFilters.eventTypes.indexOf(eventType);
      if (index > -1) {
        this.eventsFilters.eventTypes.splice(index, 1);
        this.refreshEvents();
      }
    },

    removeLevelFilter(level) {
      const index = this.eventsFilters.levels.indexOf(level);
      if (index > -1) {
        this.eventsFilters.levels.splice(index, 1);
        this.refreshEvents();
      }
    },

    removeUserEmailFilter(email) {
      const index = this.eventsFilters.userEmails.indexOf(email);
      if (index > -1) {
        this.eventsFilters.userEmails.splice(index, 1);
        this.refreshEvents();
      }
    },

    removeCategoryFilter(category) {
      const index = this.eventsFilters.categories.indexOf(category);
      if (index > -1) {
        this.eventsFilters.categories.splice(index, 1);
        this.refreshEvents();
      }
    },

    // Helper Methods for Styling
    getEventTypeColor(eventType) {
      if (!eventType) return 'grey';
      
      // Color mapping based on common event types
      const colorMap = {
        1: 'green',      // Create player
        2: 'blue',       // Reset password
        3: 'success',    // Login
        4: 'warning',    // Logout
        5: 'info',       // Profile changes
        9: 'purple',     // User management
        10: 'purple',    // User management
        11: 'purple',    // User management
        12: 'purple',    // User management
        13: 'orange',    // Device management
        14: 'orange',    // Device management
        28: 'error',     // Security events
        29: 'error',     // Security events
        30: 'error',     // Security events
        46: 'deep-orange', // Login failed
        47: 'deep-orange'  // Login failed
      };

      return colorMap[eventType] || 'primary';
    },

    getEventTypeIcon(eventType) {
      if (!eventType) return 'mdi-information';
      
      const iconMap = {
        1: 'mdi-account-plus',     // Create player
        2: 'mdi-lock-reset',       // Reset password
        3: 'mdi-login',            // Login
        4: 'mdi-logout',           // Logout
        5: 'mdi-account-edit',     // Profile changes
        9: 'mdi-account-cog',      // User management
        10: 'mdi-account-cog',     // User management
        11: 'mdi-account-cog',     // User management
        12: 'mdi-account-cog',     // User management
        13: 'mdi-cellphone',       // Device management
        14: 'mdi-cellphone',       // Device management
        28: 'mdi-shield-alert',    // Security events
        29: 'mdi-shield-alert',    // Security events
        30: 'mdi-shield-alert',    // Security events
        46: 'mdi-login-variant',   // Login failed
        47: 'mdi-login-variant'    // Login failed
      };

      return iconMap[eventType] || 'mdi-calendar';
    },

    getLevelColor(level) {
      if (!level) return 'grey';
      switch(level.toLowerCase()) {
        case 'info': return 'info';
        case 'warn': return 'warning';
        case 'err': return 'error';
        default: return 'grey';
      }
    },

    getLevelTextColor() {
      return 'white';
    },

    getLevelIcon(level) {
      if (!level) return 'mdi-information';
      switch(level.toLowerCase()) {
        case 'info': return 'mdi-information';
        case 'warn': return 'mdi-alert';
        case 'err': return 'mdi-alert-circle';
        default: return 'mdi-help-circle';
      }
    },

    getLevelText(level) {
      if (!level) return 'Unknown';
      switch(level.toLowerCase()) {
        case 'info': return 'Info';
        case 'warn': return 'Warning';
        case 'err': return 'Error';
        default: return level;
      }
    },

    // Category Helper Methods
    getCategoryColor(category) {
      if (!category) return 'grey';
      
      // Color mapping based on category types
      const colorMap = {
        'AUTHENTICATION': 'blue',
        'USER_MANAGEMENT': 'green',
        'SECURITY': 'red',
        'SYSTEM': 'purple',
        'DEVICE_MANAGEMENT': 'orange',
        'APPLICATION': 'teal',
        'NETWORK': 'cyan',
        'DATABASE': 'indigo'
      };

      return colorMap[category] || 'primary';
    },

    getCategoryIcon(category) {
      if (!category) return 'mdi-folder';
      
      // Icon mapping based on category types
      const iconMap = {
        'AUTHENTICATION': 'mdi-shield-account',
        'USER_MANAGEMENT': 'mdi-account-group',
        'SECURITY': 'mdi-shield-alert',
        'SYSTEM': 'mdi-server',
        'DEVICE_MANAGEMENT': 'mdi-devices',
        'APPLICATION': 'mdi-application',
        'NETWORK': 'mdi-lan',
        'DATABASE': 'mdi-database'
      };

      return iconMap[category] || 'mdi-folder';
    },

    // Event Details Modal
    viewEventDetails(item) {
      this.eventDetailsDialog.show = true;
      this.eventDetailsDialog.item = { ...item };
    },

    // Export functionality
    exportEventData(item) {
      try {
        const exportData = {
          event_info: {
            eventtype: item.eventtype,
            eventTypeStr: item.eventTypeStr,
            email: item.email,
            time: item.time,
            level: item.level,
            extrainfo: item.extrainfo
          },
          metadata: {
            exported_at: new Date().toISOString(),
            exported_by: appData.user?.email || 'System'
          }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `event-${item.eventtype}-${moment(item.time).format('YYYY-MM-DD-HH-mm-ss')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showSuccess(this.$t('Event data exported successfully'));
      } catch (error) {
        this.showError(`Export failed: ${error.message}`);
      }
    },

    // Utility Methods
    showError(message) {
      this.snackbarText = message;
      this.snackbarColor = "error";
      this.snackbar = true;
    },

    showSuccess(message) {
      this.snackbarText = message;
      this.snackbarColor = "success";
      this.snackbar = true;
    },
    refreshFiles: async function () {
      // Update context with loading state
      this.updateContext({
        view: 'logs',
        tab: 'files',
        loading: true
      });

      try {
         const response = await appUtils.get({
          url: "api/logs/files"
         });
         console.log(response.data);
         if (response.data.status == 1) {
           console.log(`status: ${response.data.status}`);
           this.files = response.data.files;
           this.fileHeaders = [
             { text: this.$t("File"), value: "path" },
             { text: this.$t("Size"), value: "size" },
             { text: this.$t("Last Modified"), value: "lastModified" },
           ]

           // Update context with files data
           this.updateContext({
             view: 'logs',
             tab: 'files',
             loading: false,
             filesData: {
               count: this.files.length,
               recentFiles: this.files.slice(0, 5).map(file => ({
                 path: file.path,
                 size: file.sizeStr,
                 lastModified: file.lastModified
               }))
             },
             lastUpdated: new Date().toISOString()
           });
         } else {
           console.log(`status: ${response.data.status}`);
           if (response.data.status == 2)  {
            this.filesError = "Logs download is disabled";
            this.filesAlertType = "warning";
           } else {
            this.filesError = response.data.message || `Error: ${response.data.status}`;
            this.filesAlertType = "error";
           }

           // Update context with error
           this.updateContext({
             view: 'logs',
             tab: 'files',
             loading: false,
             error: this.filesError
           });
         }
       } catch (error) {
         console.log(error);

         // Update context with error
         this.updateContext({
           view: 'logs',
           tab: 'files',
           loading: false,
           error: `Error loading log files: ${error}`
         });
       }
     },
     updateFileOptions(options) {
       console.log("updateFileOptions", options);
       this.savePage();
     },
     downloadFile: async function (val) {
       console.log(`downloadFile: ${val.path}`);
       try {
         const escapedPath = encodeURIComponent(val.path);
         const response = await appUtils.get({
           url: "api/logs/files/" + escapedPath,
           responseType: 'blob'
         });
         console.log(response.data);
         if (response.data instanceof Blob) {
           console.log('Response is of type application/octet-stream');
           const url = window.URL.createObjectURL(new Blob([response.data]));
           const link = document.createElement('a');
           link.href = url;
           link.setAttribute('download', val.path);
           document.body.appendChild(link);
           link.click();
         } else {
           console.log('Response is of type JSON');
           console.log(`status: ${response.data.status}`);
         }
       } catch (error) {
         console.log(error);
       }
     },
     refreshVersions: async function () {
       console.log("refreshVersions");

       // Update context with loading state
       this.updateContext({
         view: 'logs',
         tab: 'versions',
         loading: true
       });

       this.versionsLoading = true;
       try {
         const response = await appUtils.get({
          url: "api/system/versions"
         });
         console.log(response.data);
         if (response.data.status == 1) {
           this.versions = response.data.results;
           this.versionsHeaders = [
             { text: this.$t("Component Name"), value: "componentName" },
             { text: this.$t("Component Index"), value: "componentIndex" },
             { text: this.$t("Version"), value: "version" },
             { text: this.$t("Build Time"), value: "buildTime" },
           ]

           // Update context with versions data
           this.updateContext({
             view: 'logs',
             tab: 'versions',
             loading: false,
             versionsData: {
               count: this.versions.length,
               components: this.versions.map(version => ({
                 name: version.componentName,
                 version: version.version,
                 buildTime: version.buildTime
               }))
             },
             lastUpdated: new Date().toISOString()
           });
         }
         this.versionsLoading = false;
       } catch (error) {
         console.log(error);
         this.versionsLoading = false;

         // Update context with error
         this.updateContext({
           view: 'logs',
           tab: 'versions',
           loading: false,
           error: `Error loading versions: ${error}`
         });
       }
     },
     getComponentIcon(componentName) {
       const iconMap = {
         'android-nubo-platform': 'mdi-android',
         'frontend': 'mdi-desktop-mac-dashboard',
         'gateway': 'mdi-gate',
         'management': 'mdi-account-cog',
         'platform-server': 'mdi-server',
         'mysql': 'mdi-database'
       };
       return iconMap[componentName] || 'mdi-help-circle';
     },
     updateVersionsOptions(options) {
       console.log("updateVersionsOptions", options);
       this.savePage();
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
        text: this.$t("Logs"),
        to: "/Logs",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'Logs',
      permissions: {
        canViewSyslog: appData.checkPermission('@/','r'),
        canViewFiles: appData.checkPermission('@/','r'),
        canViewVersions: appData.checkPermission('@/','r')
      },
      lastInitialized: new Date().toISOString()
    });

    this.headers = [
      /*{
        text: this.$t("ID"),
        value: "ID",
      },*/

      { text: this.$t("Time"), value: "Time" },
      { text: this.$t("Log Level"), value: "LogLevel" },
      { text: this.$t("Server Name"), value: "ServerName" },
      { text: this.$t("Component Type"), value: "ComponentType" },
      { text: this.$t("Message"), value: "Message" },


    ];

    // Initialize Events Headers - only time, level, and user email are sortable
    this.eventsHeaders = [
      { text: this.$t("Time"), value: "time", width: "12%", sortable: true },
      { text: this.$t("Event Type"), value: "eventTypeStr", width: "18%", sortable: false },
      { text: this.$t("Category"), value: "categoryStr", width: "15%", sortable: false },
      { text: this.$t("Level"), value: "level", width: "8%", sortable: true },
      { text: this.$t("User"), value: "email", width: "12%", sortable: true },
      { text: this.$t("Information"), value: "extrainfo", width: "25%", sortable: false },
      { text: this.$t("Actions"), value: "actions", sortable: false, width: "10%" }
    ];

    // Initialize date range for events
    this.calculateEventsDateRange();

    appUtils.loadPageData(page.name,this);
    this.getFilters();
  },
  watch: {
    tab: function (newVal) {
      // Update context when tab changes
      this.updateContext({
        view: 'logs',
        tab: newVal === 0 ? 'events' : newVal === 1 ? 'syslog' : newVal === 2 ? 'files' : 'versions',
        lastTabChange: new Date().toISOString()
      });

      // Load data for the selected tab if needed
      if (newVal === 0) {
        this.refreshEvents();
      } else if (newVal === 2) {
        this.refreshFiles();
      } else if (newVal === 3) {
        this.refreshVersions();
      }
      this.savePage();
    },

    search: function (newVal) {
      console.log(`search: ${newVal}`);
      if (newVal.length > 1 || newVal.length == 0) {
        this.refresh();
      }
    },

    eventsSearch: function (newVal) {
      console.log(`eventsSearch: ${newVal}`);
      // Debounced search - refresh events after a delay for better UX
      if (this.eventsSearchTimeout) {
        clearTimeout(this.eventsSearchTimeout);
      }
      
      this.eventsSearchTimeout = setTimeout(() => {
        if (newVal.length > 1 || newVal.length == 0) {
          this.refreshEvents();
          // Update context when search term changes
          this.updateContext({
            view: 'searching',
            searchTerm: newVal,
            currentTab: 'events',
            isSearching: newVal.length > 0
          });
          this.savePage();
        }
      }, 500); // 500ms delay for debouncing
    },

    eventsSelectedDateRange: function () {
      this.savePage();
    },

    eventsFromDate: function () {
      if (this.eventsSelectedDateRange === 'custom' && this.eventsToDate) {
        this.eventsCustomDateChanged();
        this.savePage();
      }
    },

    eventsToDate: function () {
      if (this.eventsSelectedDateRange === 'custom' && this.eventsFromDate) {
        this.eventsCustomDateChanged();
        this.savePage();
      }
    },
  },
};

export default page;
</script>
