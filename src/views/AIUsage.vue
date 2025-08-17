<template>
    <div>
        <v-card flat color="bg" class="ai-usage-card pa-0 ma-0 elevation-0">
            <v-toolbar color="secondary" dark flat>
                <v-toolbar-title>{{ $t("AI Usage Monitor") }}</v-toolbar-title>
                <v-spacer></v-spacer>

                <template v-slot:extension>
                    <v-tabs v-model="tab" align-with-title>
                        <v-tabs-slider color="primary"></v-tabs-slider>
                        <v-tab key="usage-sessions">{{ $t("AI Usage Sessions") }}</v-tab>
                        <v-tab key="policy-violations">{{ $t("Policy Violations") }}</v-tab>
                        <v-tab key="prompt-analysis">{{ $t("AI Prompt Analysis") }}</v-tab>
                        <v-tab key="sensitive-exposures">{{ $t("AI Sensitive Exposures") }}</v-tab>
                        <v-tab key="service-registry">{{ $t("AI Service Registry") }}</v-tab>
                        <v-tab key="settings">{{ $t("Settings") }}</v-tab>
                    </v-tabs>
                </template>
            </v-toolbar>

            <v-tabs-items v-model="tab">
                <!-- AI Usage Sessions Tab -->
                <v-tab-item key="usage-sessions" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="usageSessionHeaders"
                        :items="usageSessionRows"
                        :server-items-length="usageSessionTotalItems"
                        :items-per-page="10"
                        :loading="usageSessionLoading"
                        :options.sync="usageSessionOptions"
                        :search="search"
                        class="bg ai-usage-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updateUsageSessionOptions"
                        @click:row="rowClick"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg" class="px-4">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('AI Usage Sessions') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                
                                <!-- Filters -->
                                <v-select
                                    v-model="usageSessionFilters.aiService"
                                    :items="aiServiceOptions"
                                    :label="$t('AI Service')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshUsageSessions"
                                ></v-select>
                                
                                <v-select
                                    v-model="usageSessionFilters.serviceType"
                                    :items="serviceTypeOptions"
                                    :label="$t('Service Type')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshUsageSessions"
                                ></v-select>
                                
                                <v-select
                                    v-model="usageSessionFilters.riskLevel"
                                    :items="riskLevelOptions"
                                    :label="$t('Risk Level')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 120px;"
                                    @change="refreshUsageSessions"
                                ></v-select>

                                <!-- Date Range Menu -->
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
                                <v-btn color="primary" small @click="refreshUsageSessions" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.user`]="{ item }">
                            {{ item.session ? item.session.email : 'N/A' }}
                        </template>
                        <template v-slot:[`item.device`]="{ item }">
                            {{ item.session ? item.session.deviceTitle : 'N/A' }}
                        </template>
                        <template v-slot:[`item.first_detected`]="{ item }">
                            {{ moment(item.first_detected).format("LLL") }}
                        </template>
                        <template v-slot:[`item.duration`]="{ item }">
                            {{ calculateSessionDuration(item) }}
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                {{ item.risk_level }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.ai_service_name`]="{ item }">
                            <v-chip
                                small
                                :color="getAIServiceColor(item.ai_service_name)"
                                text-color="white"
                                class="service-chip"
                            >
                                {{ item.ai_service_name }}
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
                                <v-icon large color="grey lighten-1">mdi-robot-off</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No AI usage sessions found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- Policy Violations Tab -->
                <v-tab-item key="policy-violations" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="violationHeaders"
                        :items="violationRows"
                        :server-items-length="violationTotalItems"
                        :items-per-page="10"
                        :loading="violationLoading"
                        :options.sync="violationOptions"
                        :search="search"
                        class="bg ai-usage-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updateViolationOptions"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg" class="px-4">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('Policy Violations') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                
                                <!-- Violation Filters -->
                                <v-select
                                    v-model="violationFilters.violationType"
                                    :items="violationTypeOptions"
                                    :label="$t('Violation Type')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 180px;"
                                    @change="refreshPolicyViolations"
                                ></v-select>
                                
                                <v-select
                                    v-model="violationFilters.serviceName"
                                    :items="serviceNameOptions"
                                    :label="$t('Service Name')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshPolicyViolations"
                                ></v-select>
                                
                                <v-select
                                    v-model="violationFilters.riskLevel"
                                    :items="riskLevelOptions"
                                    :label="$t('Risk Level')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 120px;"
                                    @change="refreshPolicyViolations"
                                ></v-select>

                                <v-btn color="primary" small @click="refreshPolicyViolations" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.user`]="{ item }">
                            {{ item.session ? item.session.email : 'N/A' }}
                        </template>
                        <template v-slot:[`item.device`]="{ item }">
                            {{ item.session ? item.session.deviceTitle : 'N/A' }}
                        </template>
                        <template v-slot:[`item.detected_time`]="{ item }">
                            {{ moment(item.detected_time).format("LLL") }}
                        </template>
                        <template v-slot:[`item.violation_type`]="{ item }">
                            <v-chip
                                small
                                color="error"
                                text-color="white"
                                class="violation-chip"
                            >
                                <v-icon left small>mdi-alert</v-icon>
                                {{ item.violation_type }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                {{ item.risk_level }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.session_id`]="{ item }">
                            <v-btn
                                v-if="item.session_id"
                                text
                                small
                                color="primary"
                                @click="viewSession(item.session_id)"
                            >
                                {{ item.session_id.substring(0, 8) }}...
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
                                <v-icon large color="grey lighten-1">mdi-shield-check</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No policy violations found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- AI Prompt Analysis Tab -->
                <v-tab-item key="prompt-analysis" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="promptAnalysisHeaders"
                        :items="promptAnalysisRows"
                        :server-items-length="promptAnalysisTotalItems"
                        :items-per-page="10"
                        :loading="promptAnalysisLoading"
                        :options.sync="promptAnalysisOptions"
                        :search="search"
                        class="bg ai-usage-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updatePromptAnalysisOptions"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg" class="px-4">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('AI Prompt Analysis') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                
                                <!-- Prompt Analysis Filters -->
                                <v-select
                                    v-model="promptAnalysisFilters.aiService"
                                    :items="aiServiceOptions"
                                    :label="$t('AI Service')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshPromptAnalysis"
                                ></v-select>
                                
                                <v-select
                                    v-model="promptAnalysisFilters.promptType"
                                    :items="promptTypeOptions"
                                    :label="$t('Prompt Type')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshPromptAnalysis"
                                ></v-select>
                                
                                <v-select
                                    v-model="promptAnalysisFilters.policyCompliance"
                                    :items="complianceOptions"
                                    :label="$t('Compliance')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 120px;"
                                    @change="refreshPromptAnalysis"
                                ></v-select>
                                
                                <v-switch
                                    v-model="promptAnalysisFilters.containsSensitiveData"
                                    :label="$t('Sensitive Data')"
                                    class="mr-2"
                                    @change="refreshPromptAnalysis"
                                ></v-switch>

                                <v-btn color="primary" small @click="refreshPromptAnalysis" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.user`]="{ item }">
                            {{ item.session ? item.session.email : 'N/A' }}
                        </template>
                        <template v-slot:[`item.device`]="{ item }">
                            {{ item.session ? item.session.deviceTitle : 'N/A' }}
                        </template>
                        <template v-slot:[`item.analysis_time`]="{ item }">
                            {{ moment(item.analysis_time).format("LLL") }}
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                {{ item.risk_level }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.policy_compliance`]="{ item }">
                            <v-chip
                                small
                                :color="item.policy_compliance ? 'success' : 'error'"
                                text-color="white"
                                class="compliance-chip"
                            >
                                <v-icon left small>
                                    {{ item.policy_compliance ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                                </v-icon>
                                {{ item.policy_compliance ? $t('Compliant') : $t('Non-Compliant') }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.contains_sensitive_data`]="{ item }">
                            <v-chip
                                v-if="item.contains_sensitive_data"
                                small
                                color="warning"
                                text-color="black"
                                class="sensitive-chip"
                            >
                                <v-icon left small>mdi-eye-off</v-icon>
                                {{ $t('Sensitive') }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.session_id`]="{ item }">
                            <v-btn
                                v-if="item.session_id"
                                text
                                small
                                color="primary"
                                @click="viewSession(item.session_id)"
                            >
                                {{ item.session_id.substring(0, 8) }}...
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
                                <v-icon large color="grey lighten-1">mdi-text-search</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No prompt analysis found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- AI Sensitive Exposures Tab -->
                <v-tab-item key="sensitive-exposures" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="sensitiveExposureHeaders"
                        :items="sensitiveExposureRows"
                        :server-items-length="sensitiveExposureTotalItems"
                        :items-per-page="10"
                        :loading="sensitiveExposureLoading"
                        :options.sync="sensitiveExposureOptions"
                        :search="search"
                        class="bg ai-usage-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updateSensitiveExposureOptions"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg" class="px-4">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('AI Sensitive Exposures') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                
                                <!-- Sensitive Exposure Filters -->
                                <v-select
                                    v-model="sensitiveExposureFilters.dataType"
                                    :items="dataTypeOptions"
                                    :label="$t('Data Type')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshSensitiveExposures"
                                ></v-select>
                                
                                <v-select
                                    v-model="sensitiveExposureFilters.aiService"
                                    :items="aiServiceOptions"
                                    :label="$t('AI Service')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshSensitiveExposures"
                                ></v-select>
                                
                                <v-select
                                    v-model="sensitiveExposureFilters.exposureMethod"
                                    :items="exposureMethodOptions"
                                    :label="$t('Exposure Method')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshSensitiveExposures"
                                ></v-select>

                                <div class="mr-2" style="max-width: 200px;">
                                    <v-subheader class="pa-0">{{ $t('Confidence Range') }}</v-subheader>
                                    <v-range-slider
                                        v-model="sensitiveExposureFilters.confidenceRange"
                                        :max="100"
                                        :min="0"
                                        hide-details
                                        class="align-center"
                                        @change="refreshSensitiveExposures"
                                    >
                                        <template v-slot:prepend>
                                            <v-text-field
                                                :value="sensitiveExposureFilters.confidenceRange[0]"
                                                class="mt-0 pt-0"
                                                hide-details
                                                single-line
                                                type="number"
                                                style="width: 60px"
                                                @change="$set(sensitiveExposureFilters.confidenceRange, 0, $event)"
                                            ></v-text-field>
                                        </template>
                                        <template v-slot:append>
                                            <v-text-field
                                                :value="sensitiveExposureFilters.confidenceRange[1]"
                                                class="mt-0 pt-0"
                                                hide-details
                                                single-line
                                                type="number"
                                                style="width: 60px"
                                                @change="$set(sensitiveExposureFilters.confidenceRange, 1, $event)"
                                            ></v-text-field>
                                        </template>
                                    </v-range-slider>
                                </div>

                                <v-btn color="primary" small @click="refreshSensitiveExposures" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.detected_time`]="{ item }">
                            {{ moment(item.detected_time).format("LLL") }}
                        </template>
                        <template v-slot:[`item.data_type`]="{ item }">
                            <v-chip
                                small
                                :color="getDataTypeColor(item.data_type)"
                                text-color="white"
                                class="data-type-chip"
                            >
                                <v-icon left small>{{ getDataTypeIcon(item.data_type) }}</v-icon>
                                {{ item.data_type }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                {{ item.risk_level }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.confidence`]="{ item }">
                            <div class="d-flex align-center">
                                <v-progress-linear
                                    :value="item.confidence"
                                    :color="getConfidenceColor(item.confidence)"
                                    height="10"
                                    rounded
                                    class="mr-2"
                                    style="width: 80px;"
                                ></v-progress-linear>
                                <span class="text-caption">{{ item.confidence }}%</span>
                            </div>
                        </template>
                        <template v-slot:[`item.session_id`]="{ item }">
                            <v-btn
                                v-if="item.session_id"
                                text
                                small
                                color="primary"
                                @click="viewSession(item.session_id)"
                            >
                                {{ item.session_id.substring(0, 8) }}...
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
                                <v-icon large color="grey lighten-1">mdi-eye-off</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No sensitive exposures found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- AI Service Registry Tab -->
                <v-tab-item key="service-registry" class="bg">
                    <v-data-table
                        color="bg"
                        :headers="serviceRegistryHeaders"
                        :items="serviceRegistryRows"
                        :server-items-length="serviceRegistryTotalItems"
                        :items-per-page="10"
                        :loading="serviceRegistryLoading"
                        :options.sync="serviceRegistryOptions"
                        :search="search"
                        class="bg ai-usage-table"
                        multi-sort
                        :footer-props="{
                          'items-per-page-options': [5, 10, 15, 20, 50],
                          'items-per-page-text': 'Rows per page:',
                          'show-first-last-page': true
                        }"
                        @update:options="updateServiceRegistryOptions"
                    >
                        <template v-slot:top>
                            <v-toolbar flat color="bg" class="px-4">
                                <v-toolbar-title class="subtitle-1 font-weight-bold">{{ $t('AI Service Registry') }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                                
                                <!-- Service Registry Filters -->
                                <v-select
                                    v-model="serviceRegistryFilters.category"
                                    :items="categoryOptions"
                                    :label="$t('Category')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 150px;"
                                    @change="refreshServiceRegistry"
                                ></v-select>
                                
                                <v-select
                                    v-model="serviceRegistryFilters.riskLevel"
                                    :items="riskLevelOptions"
                                    :label="$t('Risk Level')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 120px;"
                                    @change="refreshServiceRegistry"
                                ></v-select>
                                
                                <v-select
                                    v-model="serviceRegistryFilters.allowed"
                                    :items="allowedOptions"
                                    :label="$t('Allowed')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 100px;"
                                    @change="refreshServiceRegistry"
                                ></v-select>
                                
                                <v-select
                                    v-model="serviceRegistryFilters.isBuiltIn"
                                    :items="builtInOptions"
                                    :label="$t('Built-in')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 100px;"
                                    @change="refreshServiceRegistry"
                                ></v-select>

                                <v-btn color="primary" small @click="refreshServiceRegistry" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                                
                                <v-btn color="success" small @click="openAddServiceDialog" class="ml-2">
                                    <v-icon left small>mdi-plus</v-icon>
                                    {{ $t('Add Service') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.category`]="{ item }">
                            <v-chip
                                small
                                :color="getCategoryColor(item.category)"
                                text-color="white"
                                class="category-chip"
                            >
                                {{ getCategoryDisplayName(item.category) }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.riskLevel`]="{ item }">
                            <v-chip
                                v-if="item.riskLevel"
                                :color="getRiskLevelColor(item.riskLevel)"
                                :text-color="item.riskLevel.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                {{ item.riskLevel }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.allowed`]="{ item }">
                            <v-chip
                                small
                                :color="item.allowed ? 'success' : 'error'"
                                text-color="white"
                            >
                                <v-icon left small>
                                    {{ item.allowed ? 'mdi-check' : 'mdi-close' }}
                                </v-icon>
                                {{ item.allowed ? $t('Allowed') : $t('Blocked') }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.status`]="{ item }">
                            <v-chip
                                small
                                :color="getStatusColor(item.status)"
                                text-color="white"
                            >
                                {{ item.status }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.isBuiltIn`]="{ item }">
                            <v-chip
                                v-if="item.isBuiltIn"
                                small
                                color="blue-grey"
                                text-color="white"
                            >
                                <v-icon left small>mdi-lock</v-icon>
                                {{ $t('Built-in') }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="primary"
                                @click="editService(item)"
                                :title="$t('Edit Service')"
                            >
                                <v-icon small>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn
                                v-if="!item.isBuiltIn"
                                icon
                                small
                                color="error"
                                @click="confirmDeleteService(item)"
                                :title="$t('Delete Service')"
                            >
                                <v-icon small>mdi-delete</v-icon>
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
                                <v-icon large color="grey lighten-1">mdi-robot</v-icon>
                                <p class="mt-2 grey--text">{{ $t('No AI services found') }}</p>
                            </div>
                        </template>
                    </v-data-table>
                </v-tab-item>

                <!-- Settings Tab -->
                <v-tab-item key="settings" class="bg">
                    <div class="bg-white">
                        <div class="px-6 pt-6 pb-4">
                            <div class="text-h6">{{ $t('AI Monitor Settings') }}</div>
                        </div>

                        <div class="px-6 py-3">
                            <!-- Monitoring Enable/Disable -->
                            <div class="mb-6">
                                <v-switch
                                    v-model="settingsForm.monitoringEnabled"
                                    :label="$t('Enable AI Usage Monitoring')"
                                    class="mb-4"
                                ></v-switch>
                                <div class="text-caption grey--text">
                                    {{ $t('Enable or disable AI usage monitoring across the system') }}
                                </div>
                            </div>

                            <!-- Allowed AI Services -->
                            <div class="mb-6">
                                <v-combobox
                                    v-model="settingsForm.allowedServices"
                                    :items="allAvailableServices"
                                    :label="$t('Allowed AI Services')"
                                    multiple
                                    chips
                                    deletable-chips
                                    class="bg-white"
                                    outlined
                                    hide-details="auto"
                                ></v-combobox>
                                <div class="text-caption grey--text mt-1">
                                    {{ $t('List of AI services that are allowed to be used. Users can only access these services.') }}
                                </div>
                            </div>

                            <!-- Risk Threshold Levels -->
                            <div class="mb-6">
                                <div class="text-subtitle-1 mb-3">{{ $t('Risk Threshold Levels') }}</div>
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-slider
                                            v-model="settingsForm.riskThresholds.low"
                                            :label="$t('Low Risk Threshold')"
                                            :max="100"
                                            :min="0"
                                            thumb-label
                                            class="align-center"
                                        ></v-slider>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-slider
                                            v-model="settingsForm.riskThresholds.medium"
                                            :label="$t('Medium Risk Threshold')"
                                            :max="100"
                                            :min="0"
                                            thumb-label
                                            class="align-center"
                                        ></v-slider>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-slider
                                            v-model="settingsForm.riskThresholds.high"
                                            :label="$t('High Risk Threshold')"
                                            :max="100"
                                            :min="0"
                                            thumb-label
                                            class="align-center"
                                        ></v-slider>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-slider
                                            v-model="settingsForm.riskThresholds.critical"
                                            :label="$t('Critical Risk Threshold')"
                                            :max="100"
                                            :min="0"
                                            thumb-label
                                            class="align-center"
                                        ></v-slider>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- Sensitive Data Patterns -->
                            <div class="mb-6">
                                <v-textarea
                                    v-model="settingsForm.sensitiveDataPatterns"
                                    :label="$t('Sensitive Data Patterns')"
                                    rows="4"
                                    class="bg-white"
                                    outlined
                                    hide-details="auto"
                                    placeholder="Enter regex patterns, one per line"
                                ></v-textarea>
                                <div class="text-caption grey--text mt-1">
                                    {{ $t('Regular expression patterns to identify sensitive data in AI prompts and responses') }}
                                </div>
                            </div>

                            <!-- Notification Settings -->
                            <div class="mb-6">
                                <div class="text-subtitle-1 mb-3">{{ $t('Notification Settings') }}</div>
                                <v-switch
                                    v-model="settingsForm.notificationSettings.emailEnabled"
                                    :label="$t('Enable Email Notifications')"
                                    class="mb-2"
                                ></v-switch>
                                <v-switch
                                    v-model="settingsForm.notificationSettings.smsEnabled"
                                    :label="$t('Enable SMS Notifications')"
                                    class="mb-2"
                                ></v-switch>
                                <v-text-field
                                    v-model="settingsForm.notificationSettings.recipients"
                                    :label="$t('Notification Recipients (comma separated)')"
                                    class="bg-white"
                                    outlined
                                    hide-details="auto"
                                ></v-text-field>
                            </div>

                            <!-- Dynamic Service Learning -->
                            <div class="mb-6">
                                <v-switch
                                    v-model="settingsForm.dynamicLearning"
                                    :label="$t('Enable Dynamic Service Learning')"
                                    class="mb-4"
                                ></v-switch>
                                <div class="text-caption grey--text">
                                    {{ $t('Allow the system to automatically detect and learn about new AI services') }}
                                </div>
                            </div>

                            <!-- Custom Analysis Instructions -->
                            <div class="mb-6">
                                <v-textarea
                                    v-model="settingsForm.customInstructions"
                                    :label="$t('Custom Analysis Instructions')"
                                    rows="8"
                                    class="bg-white"
                                    outlined
                                    hide-details="auto"
                                    placeholder="Additional instructions for AI usage analysis"
                                ></v-textarea>
                                <div class="text-caption grey--text mt-1">
                                    {{ $t('Additional instructions for the AI usage analysis component') }}
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

        <!-- Service Registry Dialog -->
        <v-dialog v-model="serviceDialog.show" max-width="800px" persistent>
            <v-card>
                <v-card-title>
                    <span class="headline">
                        {{ serviceDialog.mode === 'add' ? $t('Add AI Service') : $t('Edit AI Service') }}
                    </span>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="serviceDialog.show = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text>
                    <v-container>
                        <v-row>
                            <!-- Basic Information -->
                            <v-col cols="12">
                                <v-text-field
                                    v-model="serviceForm.name"
                                    :label="$t('Service Name') + ' *'"
                                    :rules="serviceFormRules.name"
                                    required
                                    outlined
                                    dense
                                ></v-text-field>
                            </v-col>
                            
                            <v-col cols="12">
                                <v-textarea
                                    v-model="serviceForm.description"
                                    :label="$t('Description')"
                                    :rules="serviceFormRules.description"
                                    outlined
                                    rows="3"
                                    dense
                                ></v-textarea>
                            </v-col>
                            
                            <!-- Category and Risk Level -->
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="serviceForm.category"
                                    :items="categoryOptions"
                                    :label="$t('Category')"
                                    outlined
                                    dense
                                ></v-select>
                            </v-col>
                            
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="serviceForm.riskLevel"
                                    :items="riskLevelOptions"
                                    :label="$t('Risk Level')"
                                    outlined
                                    dense
                                ></v-select>
                            </v-col>
                            
                            <!-- Access Method and Status -->
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="serviceForm.accessMethod"
                                    :items="accessMethodOptions"
                                    :label="$t('Access Method')"
                                    outlined
                                    dense
                                ></v-select>
                            </v-col>
                            
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="serviceForm.status"
                                    :items="statusOptions"
                                    :label="$t('Status')"
                                    outlined
                                    dense
                                ></v-select>
                            </v-col>
                            
                            <!-- Allowed Switch -->
                            <v-col cols="12">
                                <v-switch
                                    v-model="serviceForm.allowed"
                                    :label="$t('Service Allowed')"
                                    class="mt-0"
                                ></v-switch>
                            </v-col>
                            
                            <!-- Domains -->
                            <v-col cols="12">
                                <v-combobox
                                    v-model="serviceForm.domains"
                                    :label="$t('Domains')"
                                    multiple
                                    chips
                                    deletable-chips
                                    outlined
                                    dense
                                    hint="Enter domain names (e.g., openai.com, chat.openai.com)"
                                    persistent-hint
                                ></v-combobox>
                            </v-col>
                            
                            <!-- URL Patterns -->
                            <v-col cols="12">
                                <v-combobox
                                    v-model="serviceForm.urlPatterns"
                                    :label="$t('URL Patterns')"
                                    multiple
                                    chips
                                    deletable-chips
                                    outlined
                                    dense
                                    hint="Enter URL patterns with wildcards (e.g., *://chat.openai.com/*)"
                                    persistent-hint
                                ></v-combobox>
                            </v-col>
                            
                            <!-- Application Names -->
                            <v-col cols="12">
                                <v-combobox
                                    v-model="serviceForm.applicationNames"
                                    :label="$t('Application Names')"
                                    multiple
                                    chips
                                    deletable-chips
                                    outlined
                                    dense
                                    hint="Enter application/process names"
                                    persistent-hint
                                ></v-combobox>
                            </v-col>
                            
                            <!-- Window Title Patterns -->
                            <v-col cols="12">
                                <v-combobox
                                    v-model="serviceForm.windowTitlePatterns"
                                    :label="$t('Window Title Patterns')"
                                    multiple
                                    chips
                                    deletable-chips
                                    outlined
                                    dense
                                    hint="Enter window title patterns with wildcards (e.g., *ChatGPT*)"
                                    persistent-hint
                                ></v-combobox>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color="grey darken-1"
                        text
                        @click="serviceDialog.show = false"
                        :disabled="serviceDialog.loading"
                    >
                        {{ $t('Cancel') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="saveService"
                        :loading="serviceDialog.loading"
                        :disabled="!serviceForm.name"
                    >
                        {{ serviceDialog.mode === 'add' ? $t('Add Service') : $t('Update Service') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Error Snackbar -->
        <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor">
            {{ snackbarText }}
            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="snackbar = false">
                    {{ $t('Close') }}
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<style>
.ai-usage-card {
  border-radius: 0;
}

.ai-usage-table {
  border-radius: 0;
}

.service-chip {
  min-width: 75px;
  justify-content: center;
}

.violation-chip {
  min-width: 100px;
  justify-content: center;
}

.compliance-chip {
  min-width: 100px;
  justify-content: center;
}

.sensitive-chip {
  min-width: 80px;
  justify-content: center;
}

.data-type-chip {
  min-width: 90px;
  justify-content: center;
}

.search-field .v-input__slot {
  min-height: 36px !important;
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
  name: "AIUsageMonitor",
  mixins: [contextUpdater],
  data: () => ({
    tab: null,
    search: "",
    loading: false,
    moment,
    appData,
    
    // Date range functionality
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

    // AI Usage Sessions tab
    usageSessionHeaders: [],
    usageSessionRows: [],
    usageSessionTotalItems: 0,
    usageSessionLoading: false,
    usageSessionOptions: {},
    usageSessionFilters: {
      aiService: null,
      serviceType: null,
      riskLevel: null
    },

    // Policy Violations tab
    violationHeaders: [],
    violationRows: [],
    violationTotalItems: 0,
    violationLoading: false,
    violationOptions: {},
    violationFilters: {
      violationType: null,
      serviceName: null,
      riskLevel: null
    },

    // AI Prompt Analysis tab
    promptAnalysisHeaders: [],
    promptAnalysisRows: [],
    promptAnalysisTotalItems: 0,
    promptAnalysisLoading: false,
    promptAnalysisOptions: {},
    promptAnalysisFilters: {
      aiService: null,
      promptType: null,
      riskLevel: null,
      policyCompliance: null,
      containsSensitiveData: false
    },

    // AI Sensitive Exposures tab
    sensitiveExposureHeaders: [],
    sensitiveExposureRows: [],
    sensitiveExposureTotalItems: 0,
    sensitiveExposureLoading: false,
    sensitiveExposureOptions: {},
    sensitiveExposureFilters: {
      dataType: null,
      aiService: null,
      exposureMethod: null,
      riskLevel: null,
      confidenceRange: [0, 100]
    },

    // AI Service Registry tab
    serviceRegistryHeaders: [],
    serviceRegistryRows: [],
    serviceRegistryTotalItems: 0,
    serviceRegistryLoading: false,
    serviceRegistryOptions: {},
    serviceRegistryFilters: {
      category: null,
      riskLevel: null,
      accessMethod: null,
      allowed: null,
      status: null,
      isBuiltIn: null
    },

    // Service Registry Dialog
    serviceDialog: {
      show: false,
      mode: 'add', // 'add' or 'edit'
      loading: false,
      item: {}
    },

    // Service Registry Form
    serviceForm: {
      name: '',
      description: '',
      category: 'conversational_ai',
      riskLevel: 'medium',
      accessMethod: 'web',
      allowed: true,
      status: 'active',
      domains: [],
      urlPatterns: [],
      applicationNames: [],
      windowTitlePatterns: []
    },

    // Service Registry Validation Rules
    serviceFormRules: {
      name: [
        v => !!v || 'Name is required',
        v => (v && v.length <= 100) || 'Name must be less than 100 characters'
      ],
      description: [
        v => !v || v.length <= 500 || 'Description must be less than 500 characters'
      ]
    },

    // Settings
    settingsLoading: false,
    settingsForm: {
      monitoringEnabled: true,
      allowedServices: [],
      riskThresholds: {
        low: 25,
        medium: 50,
        high: 75,
        critical: 90
      },
      sensitiveDataPatterns: "",
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        recipients: ""
      },
      dynamicLearning: true,
      customInstructions: "",
      updatedAt: null
    },

    // Filter options
    aiServiceOptions: [
      'OpenAI GPT',
      'Google Gemini',
      'Anthropic Claude',
      'Microsoft Copilot',
      'AWS Bedrock',
      'Azure OpenAI',
      'Other'
    ],
    serviceTypeOptions: [
      'Text Generation',
      'Code Generation',
      'Image Generation',
      'Document Analysis',
      'Translation',
      'Summarization',
      'Chat',
      'Other'
    ],
    riskLevelOptions: [
      { text: 'Low', value: 'low' },
      { text: 'Medium', value: 'medium' },
      { text: 'High', value: 'high' },
      { text: 'Critical', value: 'critical' }
    ],
    violationTypeOptions: [
      'Unauthorized Access',
      'Data Leakage',
      'Policy Violation',
      'Suspicious Activity',
      'Compliance Breach',
      'Other'
    ],
    serviceNameOptions: [],
    promptTypeOptions: [
      'Question',
      'Instruction',
      'Code Request',
      'Document Analysis',
      'Creative Writing',
      'Data Processing',
      'Other'
    ],
    complianceOptions: [
      { text: 'Compliant', value: true },
      { text: 'Non-Compliant', value: false }
    ],
    dataTypeOptions: [
      'Personal Information',
      'Financial Data',
      'Medical Records',
      'Credentials',
      'Business Secrets',
      'Legal Documents',
      'Other'
    ],
    exposureMethodOptions: [
      'Prompt Injection',
      'Response Extraction',
      'Model Inference',
      'Data Exfiltration',
      'Other'
    ],
    allAvailableServices: [
      'OpenAI GPT',
      'Google Gemini',
      'Anthropic Claude',
      'Microsoft Copilot',
      'AWS Bedrock',
      'Azure OpenAI',
      'Cohere',
      'Hugging Face',
      'Other'
    ],

    // AI Service Registry filter options
    categoryOptions: [
      { text: 'Conversational AI', value: 'conversational_ai' },
      { text: 'Code Assistant', value: 'code_assistant' },
      { text: 'Content Generation', value: 'content_generation' },
      { text: 'Research Analysis', value: 'research_analysis' },
      { text: 'Writing Assistant', value: 'writing_assistant' },
      { text: 'Translation', value: 'translation' },
      { text: 'Voice/Audio', value: 'voice_audio' },
      { text: 'API Integration', value: 'api_integration' },
      { text: 'Browser Extension', value: 'browser_extension' },
      { text: 'Desktop Application', value: 'desktop_application' },
      { text: 'Mobile Application', value: 'mobile_application' },
      { text: 'Business Intelligence', value: 'business_intelligence' },
      { text: 'Other', value: 'other' }
    ],
    accessMethodOptions: [
      { text: 'Web', value: 'web' },
      { text: 'Desktop', value: 'desktop' },
      { text: 'API', value: 'api' },
      { text: 'Browser Extension', value: 'browser_extension' },
      { text: 'Mobile', value: 'mobile' },
      { text: 'Other', value: 'other' }
    ],
    statusOptions: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
      { text: 'Deprecated', value: 'deprecated' },
      { text: 'Under Review', value: 'under_review' }
    ],
    allowedOptions: [
      { text: 'Allowed', value: true },
      { text: 'Blocked', value: false }
    ],
    builtInOptions: [
      { text: 'Built-in', value: true },
      { text: 'Custom', value: false }
    ],

    // Snackbar
    snackbar: false,
    snackbarText: "",
    snackbarColor: "info"
  }),

  methods: {
    savePage: function () {
      appUtils.savePageData(`${page.name}`, this, ['search', 'usageSessionOptions', 'violationOptions', 'promptAnalysisOptions', 'sensitiveExposureOptions', 'selectedDateRange', 'fromDate', 'toDate', 'tab']);

      // Update context when page state is saved
      this.updateContext({
        view: 'list',
        searchTerm: this.search,
        currentTab: this.tab,
        dateRange: this.dateRange
      });
    },

    formatDuration: function(item) {
      if (!item.end_time || !item.start_time) return "0 seconds";
      const seconds = moment(item.end_time).diff(moment(item.start_time), 'seconds');
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

    calculateSessionDuration: function(item) {
      if (!item.last_detected || !item.first_detected) return "N/A";
      
      const seconds = moment(item.last_detected).diff(moment(item.first_detected), 'seconds');
      if (!seconds || seconds <= 0) return "< 1 sec";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      let result = "";
      if (hours > 0) {
        result += `${hours}h`;
      }
      if (minutes > 0) {
        if (result) result += " ";
        result += `${minutes}m`;
      }
      if (remainingSeconds > 0 || result === "") {
        if (result) result += " ";
        result += `${remainingSeconds}s`;
      }

      return result;
    },

    getRiskLevelColor(riskLevel) {
      if (!riskLevel) return '';
      switch(riskLevel.toLowerCase()) {
        case 'low': return 'gray';
        case 'medium': return 'orange';
        case 'high': return 'deep-orange';
        case 'critical': return 'red';
        default: return '';
      }
    },

    getAIServiceColor(service) {
      if (!service) return 'grey';
      const hash = service.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const colors = ['blue', 'green', 'purple', 'teal', 'indigo', 'cyan'];
      return colors[Math.abs(hash) % colors.length];
    },

    getDataTypeColor(dataType) {
      const colorMap = {
        'Personal Information': 'orange',
        'Financial Data': 'red',
        'Medical Records': 'purple',
        'Credentials': 'deep-orange',
        'Business Secrets': 'indigo',
        'Legal Documents': 'blue',
        'Other': 'grey'
      };
      return colorMap[dataType] || 'grey';
    },

    getDataTypeIcon(dataType) {
      const iconMap = {
        'Personal Information': 'mdi-account',
        'Financial Data': 'mdi-currency-usd',
        'Medical Records': 'mdi-medical-bag',
        'Credentials': 'mdi-key',
        'Business Secrets': 'mdi-briefcase',
        'Legal Documents': 'mdi-gavel',
        'Other': 'mdi-file'
      };
      return iconMap[dataType] || 'mdi-file';
    },

    getConfidenceColor(confidence) {
      if (confidence >= 80) return 'success';
      if (confidence >= 60) return 'warning';
      return 'error';
    },

    // Date range methods
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
        this.refreshCurrentTab();
        this.dateRangeMenu = false;
      }
    },

    customDateChanged() {
      if (this.fromDate && this.toDate) {
        this.calculateDateRange();
        this.refreshCurrentTab();
      }
    },

    refreshCurrentTab() {
      switch(this.tab) {
        case 0:
          this.refreshUsageSessions();
          break;
        case 1:
          this.refreshPolicyViolations();
          break;
        case 2:
          this.refreshPromptAnalysis();
          break;
        case 3:
          this.refreshSensitiveExposures();
          break;
        case 4:
          this.refreshServiceRegistry();
          break;
        case 5:
          this.loadSettings();
          break;
        default:
          this.refreshUsageSessions();
      }
    },

    // AI Usage Sessions methods
    refreshUsageSessions() {
      this.usageSessionLoading = true;
      this.calculateDateRange();

      let limit = this.usageSessionOptions.itemsPerPage > 0 ? this.usageSessionOptions.itemsPerPage : 10;
      let offset = (this.usageSessionOptions.page - 1) * limit;

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: this.usageSessionOptions.sortBy,
        sortDesc: this.usageSessionOptions.sortDesc,
        search: this.search,
        from: this.dateRange.from,
        to: this.dateRange.to,
        ai_service: this.usageSessionFilters.aiService,
        service_type: this.usageSessionFilters.serviceType,
        risk_level: this.usageSessionFilters.riskLevel
      };

      appUtils
        .post({
          url: "api/ai-usage-sessions",
          data: requestData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.usageSessionRows = response.data.sessions || [];
            this.usageSessionTotalItems = response.data.count || 0;
          } else {
            this.showError(`Failed to fetch AI usage sessions (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error fetching AI usage sessions: ${error.message}`);
        })
        .finally(() => {
          this.usageSessionLoading = false;
        });
    },

    updateUsageSessionOptions(options) {
      this.usageSessionOptions = options;
      this.refreshUsageSessions();
      this.savePage();
    },

    // Policy Violations methods
    refreshPolicyViolations() {
      this.violationLoading = true;
      this.calculateDateRange();

      let limit = this.violationOptions.itemsPerPage > 0 ? this.violationOptions.itemsPerPage : 10;
      let offset = (this.violationOptions.page - 1) * limit;

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: this.violationOptions.sortBy,
        sortDesc: this.violationOptions.sortDesc,
        search: this.search,
        from: this.dateRange.from,
        to: this.dateRange.to,
        violation_type: this.violationFilters.violationType,
        service_name: this.violationFilters.serviceName,
        risk_level: this.violationFilters.riskLevel
      };

      appUtils
        .post({
          url: "api/ai-policy-violations",
          data: requestData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.violationRows = response.data.violations || [];
            this.violationTotalItems = response.data.count || 0;
          } else {
            this.showError(`Failed to fetch policy violations (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error fetching policy violations: ${error.message}`);
        })
        .finally(() => {
          this.violationLoading = false;
        });
    },

    updateViolationOptions(options) {
      this.violationOptions = options;
      this.refreshPolicyViolations();
      this.savePage();
    },

    // AI Prompt Analysis methods
    refreshPromptAnalysis() {
      this.promptAnalysisLoading = true;
      this.calculateDateRange();

      let limit = this.promptAnalysisOptions.itemsPerPage > 0 ? this.promptAnalysisOptions.itemsPerPage : 10;
      let offset = (this.promptAnalysisOptions.page - 1) * limit;

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: this.promptAnalysisOptions.sortBy,
        sortDesc: this.promptAnalysisOptions.sortDesc,
        search: this.search,
        from: this.dateRange.from,
        to: this.dateRange.to,
        ai_service: this.promptAnalysisFilters.aiService,
        prompt_type: this.promptAnalysisFilters.promptType,
        risk_level: this.promptAnalysisFilters.riskLevel,
        policy_compliance: this.promptAnalysisFilters.policyCompliance,
        contains_sensitive_data: this.promptAnalysisFilters.containsSensitiveData
      };

      appUtils
        .post({
          url: "api/ai-prompt-analysis",
          data: requestData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.promptAnalysisRows = response.data.analyses || [];
            this.promptAnalysisTotalItems = response.data.count || 0;
          } else {
            this.showError(`Failed to fetch prompt analysis (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error fetching prompt analysis: ${error.message}`);
        })
        .finally(() => {
          this.promptAnalysisLoading = false;
        });
    },

    updatePromptAnalysisOptions(options) {
      this.promptAnalysisOptions = options;
      this.refreshPromptAnalysis();
      this.savePage();
    },

    // AI Sensitive Exposures methods
    refreshSensitiveExposures() {
      this.sensitiveExposureLoading = true;
      this.calculateDateRange();

      let limit = this.sensitiveExposureOptions.itemsPerPage > 0 ? this.sensitiveExposureOptions.itemsPerPage : 10;
      let offset = (this.sensitiveExposureOptions.page - 1) * limit;

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: this.sensitiveExposureOptions.sortBy,
        sortDesc: this.sensitiveExposureOptions.sortDesc,
        search: this.search,
        from: this.dateRange.from,
        to: this.dateRange.to,
        data_type: this.sensitiveExposureFilters.dataType,
        ai_service: this.sensitiveExposureFilters.aiService,
        exposure_method: this.sensitiveExposureFilters.exposureMethod,
        risk_level: this.sensitiveExposureFilters.riskLevel,
        confidence_min: this.sensitiveExposureFilters.confidenceRange[0],
        confidence_max: this.sensitiveExposureFilters.confidenceRange[1]
      };

      appUtils
        .post({
          url: "api/ai-sensitive-exposures",
          data: requestData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.sensitiveExposureRows = response.data.exposures || [];
            this.sensitiveExposureTotalItems = response.data.count || 0;
          } else {
            this.showError(`Failed to fetch sensitive exposures (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error fetching sensitive exposures: ${error.message}`);
        })
        .finally(() => {
          this.sensitiveExposureLoading = false;
        });
    },

    updateSensitiveExposureOptions(options) {
      this.sensitiveExposureOptions = options;
      this.refreshSensitiveExposures();
      this.savePage();
    },

    // Settings methods
    loadSettings() {
      this.settingsLoading = true;

      appUtils
        .get({
          url: "api/ai-monitor-settings"
        })
        .then((response) => {
          if (response.data) {
            this.settingsForm = {
              ...this.settingsForm,
              ...response.data,
              updatedAt: response.data.updatedAt || null
            };
          }
        })
        .catch((error) => {
          this.showError(`Error loading settings: ${error.message}`);
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    saveSettings() {
      this.settingsLoading = true;

      appUtils
        .req({
          method: "PUT",
          url: "api/ai-monitor-settings",
          data: this.settingsForm
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.settingsForm.updatedAt = new Date().toISOString();
            this.showSuccess(this.$t("Settings saved successfully"));
          } else {
            this.showError(`Failed to save settings (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error saving settings: ${error.message}`);
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    resetSettings() {
      if (!confirm(this.$t('Are you sure you want to reset all settings to default? This cannot be undone.'))) {
        return;
      }

      this.settingsLoading = true;

      appUtils
        .req({
          method: "DELETE",
          url: "api/ai-monitor-settings"
        })
        .then((response) => {
          // Reset form values to defaults
          this.settingsForm = {
            monitoringEnabled: true,
            allowedServices: [],
            riskThresholds: {
              low: 25,
              medium: 50,
              high: 75,
              critical: 90
            },
            sensitiveDataPatterns: "",
            notificationSettings: {
              emailEnabled: true,
              smsEnabled: false,
              recipients: ""
            },
            dynamicLearning: true,
            customInstructions: "",
            updatedAt: null
          };

          this.showSuccess(this.$t("Settings reset to default values"));
        })
        .catch((error) => {
          this.showError(`Error resetting settings: ${error.message}`);
        })
        .finally(() => {
          this.settingsLoading = false;
        });
    },

    // AI Service Registry methods
    refreshServiceRegistry() {
      this.serviceRegistryLoading = true;

      let limit = this.serviceRegistryOptions.itemsPerPage > 0 ? this.serviceRegistryOptions.itemsPerPage : 10;
      let offset = (this.serviceRegistryOptions.page - 1) * limit;

      const requestData = {
        offset: offset,
        limit: limit,
        sortBy: this.serviceRegistryOptions.sortBy,
        sortDesc: this.serviceRegistryOptions.sortDesc
      };

      // Only add filter parameters if they have non-null values
      if (this.serviceRegistryFilters.category !== null && this.serviceRegistryFilters.category !== undefined) {
        requestData.category = this.serviceRegistryFilters.category;
      }
      if (this.serviceRegistryFilters.riskLevel !== null && this.serviceRegistryFilters.riskLevel !== undefined) {
        requestData.risk_level = this.serviceRegistryFilters.riskLevel;
      }
      if (this.serviceRegistryFilters.accessMethod !== null && this.serviceRegistryFilters.accessMethod !== undefined) {
        requestData.access_method = this.serviceRegistryFilters.accessMethod;
      }
      if (this.serviceRegistryFilters.allowed !== null && this.serviceRegistryFilters.allowed !== undefined) {
        requestData.allowed = this.serviceRegistryFilters.allowed;
      }
      if (this.serviceRegistryFilters.status !== null && this.serviceRegistryFilters.status !== undefined) {
        requestData.status = this.serviceRegistryFilters.status;
      }
      if (this.serviceRegistryFilters.isBuiltIn !== null && this.serviceRegistryFilters.isBuiltIn !== undefined) {
        requestData.is_built_in = this.serviceRegistryFilters.isBuiltIn;
      }

      appUtils
        .post({
          url: "api/ai-service-registry",
          data: requestData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.serviceRegistryRows = response.data.services || [];
            this.serviceRegistryTotalItems = response.data.count || 0;
          } else {
            this.showError(`Failed to fetch AI service registry (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error fetching AI service registry: ${error.message}`);
        })
        .finally(() => {
          this.serviceRegistryLoading = false;
        });
    },

    updateServiceRegistryOptions(options) {
      this.serviceRegistryOptions = options;
      this.refreshServiceRegistry();
      this.savePage();
    },

    loadAIServiceOptions() {
      // Load dynamic service names from the registry for filter options
      appUtils
        .post({
          url: "api/ai-service-registry",
          data: {
            limit: 1000,
            offset: 0
          }
        })
        .then((response) => {
          if (response.data.status === 1 && response.data.services) {
            // Extract unique service names for filter options
            const serviceNames = response.data.services.map(service => service.name).filter(Boolean);
            this.aiServiceOptions = [...new Set(serviceNames)];
            this.serviceNameOptions = [...new Set(serviceNames)];
            
            // Update allAvailableServices for settings
            this.allAvailableServices = [...new Set([...this.allAvailableServices, ...serviceNames])];
          }
        })
        .catch((error) => {
          console.error('Error loading AI service options:', error);
          // Keep using hardcoded options as fallback
        });
    },

    openAddServiceDialog() {
      this.serviceDialog.mode = 'add';
      this.serviceDialog.show = true;
      this.serviceDialog.item = {};
      
      // Reset form to defaults
      this.serviceForm = {
        name: '',
        description: '',
        category: 'conversational_ai',
        riskLevel: 'medium',
        accessMethod: 'web',
        allowed: true,
        status: 'active',
        domains: [],
        urlPatterns: [],
        applicationNames: [],
        windowTitlePatterns: []
      };
    },

    editService(item) {
      this.serviceDialog.mode = 'edit';
      this.serviceDialog.show = true;
      this.serviceDialog.item = { ...item };
      
      // Populate form with item data
      this.serviceForm = {
        ...item,
        // Parse JSON arrays if they're strings
        domains: typeof item.domains === 'string' ? JSON.parse(item.domains || '[]') : (item.domains || []),
        urlPatterns: typeof item.urlPatterns === 'string' ? JSON.parse(item.urlPatterns || '[]') : (item.urlPatterns || []),
        applicationNames: typeof item.applicationNames === 'string' ? JSON.parse(item.applicationNames || '[]') : (item.applicationNames || []),
        windowTitlePatterns: typeof item.windowTitlePatterns === 'string' ? JSON.parse(item.windowTitlePatterns || '[]') : (item.windowTitlePatterns || [])
      };
    },

    confirmDeleteService(item) {
      if (item.isBuiltIn) {
        this.showError(this.$t('Built-in services cannot be deleted'));
        return;
      }

      if (!confirm(this.$t(`Are you sure you want to delete '${item.name}'? This action cannot be undone.`))) {
        return;
      }

      this.deleteService(item.id);
    },

    saveService() {
      // Validate form
      if (!this.serviceForm.name || this.serviceForm.name.trim() === '') {
        this.showError(this.$t('Name is required'));
        return;
      }

      if (this.serviceForm.name.length > 100) {
        this.showError(this.$t('Name must be less than 100 characters'));
        return;
      }

      if (this.serviceForm.description && this.serviceForm.description.length > 500) {
        this.showError(this.$t('Description must be less than 500 characters'));
        return;
      }

      this.serviceDialog.loading = true;

      // Prepare data for API
      const serviceData = {
        ...this.serviceForm,
        // Convert arrays to JSON strings as expected by API
        domains: JSON.stringify(this.serviceForm.domains || []),
        urlPatterns: JSON.stringify(this.serviceForm.urlPatterns || []),
        applicationNames: JSON.stringify(this.serviceForm.applicationNames || []),
        windowTitlePatterns: JSON.stringify(this.serviceForm.windowTitlePatterns || [])
      };

      const url = this.serviceDialog.mode === 'add' 
        ? 'api/ai-service-registry/create'
        : `api/ai-service-registry/${this.serviceDialog.item.id}`;
      
      const method = this.serviceDialog.mode === 'add' ? 'POST' : 'PUT';

      appUtils
        .req({
          method: method,
          url: url,
          data: serviceData
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.showSuccess(this.$t(
              this.serviceDialog.mode === 'add' 
                ? 'Service created successfully' 
                : 'Service updated successfully'
            ));
            this.serviceDialog.show = false;
            this.refreshServiceRegistry();
            this.loadAIServiceOptions(); // Refresh filter options
          } else {
            this.showError(`Failed to ${this.serviceDialog.mode} service (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error ${this.serviceDialog.mode === 'add' ? 'creating' : 'updating'} service: ${error.message}`);
        })
        .finally(() => {
          this.serviceDialog.loading = false;
        });
    },

    deleteService(serviceId) {
      this.serviceRegistryLoading = true;

      appUtils
        .req({
          method: 'DELETE',
          url: `api/ai-service-registry/${serviceId}`
        })
        .then((response) => {
          if (response.data.status === 1) {
            this.showSuccess(this.$t('Service deleted successfully'));
            this.refreshServiceRegistry();
            this.loadAIServiceOptions(); // Refresh filter options
          } else {
            this.showError(`Failed to delete service (status: ${response.data.status})`);
          }
        })
        .catch((error) => {
          this.showError(`Error deleting service: ${error.message}`);
        })
        .finally(() => {
          this.serviceRegistryLoading = false;
        });
    },

    // Service Registry helper methods
    getCategoryColor(category) {
      const colorMap = {
        'conversational_ai': 'blue',
        'code_assistant': 'green',
        'content_generation': 'purple',
        'research_analysis': 'indigo',
        'writing_assistant': 'teal',
        'translation': 'orange',
        'voice_audio': 'deep-purple',
        'api_integration': 'cyan',
        'browser_extension': 'lime',
        'desktop_application': 'amber',
        'mobile_application': 'deep-orange',
        'business_intelligence': 'blue-grey',
        'other': 'grey'
      };
      return colorMap[category] || 'grey';
    },

    getCategoryDisplayName(category) {
      const categoryOption = this.categoryOptions.find(opt => opt.value === category);
      return categoryOption ? categoryOption.text : category;
    },

    getStatusColor(status) {
      const colorMap = {
        'active': 'success',
        'inactive': 'grey',
        'deprecated': 'warning',
        'under_review': 'info'
      };
      return colorMap[status] || 'grey';
    },

    // Utility methods
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

    rowClick(item) {
      // Handle row click for usage sessions
      if (this.tab === 0 && item.session_id) {
        this.viewSession(item.session_id);
      }
    },

    viewSession(sessionId) {
      // Navigate to session view if available
      this.$router.push({ name: 'SessionView', params: { id: sessionId } });
    }
  },

  created: function () {
    // Set up breadcrumbs
    let bcItems = [
      {
        text: appData.productName,
        to: "/",
        disabled: false,
      },
      {
        text: this.$t("AI Usage Monitor"),
        to: "/AIUsage",
        disabled: false,
      },
    ];
    this.$emit("updatePage", bcItems);

    // Setup headers for each tab
    this.usageSessionHeaders = [
      { text: this.$t("Session ID"), value: "session_id", width: "10%" },
      { text: this.$t("User"), value: "user" },
      { text: this.$t("Device"), value: "device" },
      { text: this.$t("AI Service"), value: "ai_service_name" },
      { text: this.$t("Service Type"), value: "service_type" },
      { text: this.$t("First Detected"), value: "first_detected" },
      { text: this.$t("Duration"), value: "duration" },
      { text: this.$t("Risk Level"), value: "risk_level" }
    ];

    this.violationHeaders = [
      { text: this.$t("Violation Type"), value: "violation_type" },
      { text: this.$t("Service Name"), value: "service_name" },
      { text: this.$t("User"), value: "user" },
      { text: this.$t("Device"), value: "device" },
      { text: this.$t("Detected Time"), value: "detected_time" },
      { text: this.$t("Risk Level"), value: "risk_level" },
      { text: this.$t("Session ID"), value: "session_id" }
    ];

    this.promptAnalysisHeaders = [
      { text: this.$t("AI Service"), value: "ai_service" },
      { text: this.$t("User"), value: "user" },
      { text: this.$t("Device"), value: "device" },
      { text: this.$t("Prompt Type"), value: "prompt_type" },
      { text: this.$t("Risk Level"), value: "risk_level" },
      { text: this.$t("Policy Compliance"), value: "policy_compliance" },
      { text: this.$t("Sensitive Data"), value: "contains_sensitive_data" },
      { text: this.$t("Analysis Time"), value: "analysis_time" },
      { text: this.$t("Session ID"), value: "session_id" }
    ];

    this.sensitiveExposureHeaders = [
      { text: this.$t("Data Type"), value: "data_type" },
      { text: this.$t("AI Service"), value: "ai_service" },
      { text: this.$t("Exposure Method"), value: "exposure_method" },
      { text: this.$t("Risk Level"), value: "risk_level" },
      { text: this.$t("Confidence"), value: "confidence" },
      { text: this.$t("Detected Time"), value: "detected_time" },
      { text: this.$t("Session ID"), value: "session_id" }
    ];

    this.serviceRegistryHeaders = [
      { text: this.$t("Name"), value: "name" },
      { text: this.$t("Category"), value: "category" },
      { text: this.$t("Risk Level"), value: "riskLevel" },
      { text: this.$t("Access Method"), value: "accessMethod" },
      { text: this.$t("Allowed"), value: "allowed" },
      { text: this.$t("Status"), value: "status" },
      { text: this.$t("Built-in"), value: "isBuiltIn" },
      { text: this.$t("Actions"), value: "actions", sortable: false }
    ];

    // Load saved page data
    appUtils.loadPageData(page.name, this);

    // Load dynamic service names for filters
    this.loadAIServiceOptions();

    // If date range wasn't loaded from saved state, set default
    if (!this.selectedDateRange) {
      this.selectedDateRange = "last24hours";
    }
    
    // Initialize date range
    this.calculateDateRange();

    // Initialize context when component is created
    this.updateContext({
      view: 'init',
      pageType: 'AIUsageMonitor',
      headers: {
        usageSessions: this.usageSessionHeaders.map(h => h.text || h.value),
        violations: this.violationHeaders.map(h => h.text || h.value),
        promptAnalysis: this.promptAnalysisHeaders.map(h => h.text || h.value),
        sensitiveExposures: this.sensitiveExposureHeaders.map(h => h.text || h.value)
      },
      dateRange: this.dateRange,
      permissions: {
        canView: appData.checkPermission('/', 'r'),
        canEdit: appData.checkPermission('/', 'w')
      },
      lastInitialized: new Date().toISOString()
    });

    // Load initial data based on active tab
    this.refreshCurrentTab();
  },

  watch: {
    tab: function (newVal) {
      console.log(`tab change to:`, newVal);
      this.savePage();
      this.refreshCurrentTab();
    },

    search: function (newVal) {
      console.log(`search: ${newVal}`);
      
      // Update context when search term changes
      this.updateContext({
        view: 'searching',
        searchTerm: newVal,
        currentTab: this.tab,
        isSearching: newVal.length > 0
      });

      if (newVal.length > 1 || newVal.length == 0) {
        this.refreshCurrentTab();
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
    }
  }
};

export default page;
</script>
