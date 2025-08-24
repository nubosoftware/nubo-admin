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
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on">
                                        {{ moment(item.first_detected).format("MMM DD, HH:mm") }}
                                    </span>
                                </template>
                                <span>{{ moment(item.first_detected).format("LLLL") }}</span>
                            </v-tooltip>
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
                                <v-icon left small>{{ getAIServiceIcon(item.ai_service_name) }}</v-icon>
                                {{ item.ai_service_name }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.interaction_count`]="{ item }">
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-chip
                                        v-bind="attrs"
                                        v-on="on"
                                        small
                                        :color="getInteractionCountColor(item.interaction_count)"
                                        text-color="white"
                                        class="interaction-chip"
                                    >
                                        <v-icon left small>mdi-pulse</v-icon>
                                        {{ item.interaction_count || 0 }}
                                    </v-chip>
                                </template>
                                <span>{{ item.interaction_count || 0 }} interactions detected</span>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.service_type`]="{ item }">
                            <v-chip
                                small
                                :color="getServiceTypeColor(item.service_type)"
                                text-color="white"
                                class="service-type-chip"
                            >
                                <v-icon left small>{{ getServiceTypeIcon(item.service_type) }}</v-icon>
                                {{ item.service_type }}
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
                                <v-icon right small>mdi-open-in-new</v-icon>
                            </v-btn>
                            <span v-else class="text-caption grey--text">N/A</span>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="primary"
                                @click="viewUsageSessionDetails(item)"
                                :title="$t('View Details')"
                            >
                                <v-icon small>mdi-eye</v-icon>
                            </v-btn>
                            <v-btn
                                v-if="item.session_id"
                                icon
                                small
                                color="secondary"
                                @click="viewSession(item.session_id)"
                                :title="$t('View Full Session')"
                            >
                                <v-icon small>mdi-open-in-new</v-icon>
                            </v-btn>
                            <v-btn
                                icon
                                small
                                color="info"
                                @click="exportSessionData(item)"
                                :title="$t('Export Session Data')"
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
                                
                                <v-select
                                    v-model="violationFilters.isAuthorized"
                                    :items="authorizationOptions"
                                    :label="$t('Authorization')"
                                    clearable
                                    dense
                                    class="mr-2"
                                    style="max-width: 140px;"
                                    @change="refreshPolicyViolations"
                                ></v-select>

                                <v-btn color="primary" small @click="refreshPolicyViolations" class="ml-2">
                                    <v-icon left small>mdi-refresh</v-icon>
                                    {{ $t('Refresh') }}
                                </v-btn>
                            </v-toolbar>
                        </template>

                        <template v-slot:[`item.detected_at`]="{ item }">
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on">
                                        {{ moment(item.detected_at).format("MMM DD, HH:mm") }}
                                    </span>
                                </template>
                                <span>{{ moment(item.detected_at).format("LLLL") }}</span>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.violation_type`]="{ item }">
                            <v-chip
                                small
                                :color="getViolationTypeColor(item.violation_type)"
                                text-color="white"
                                class="violation-chip"
                            >
                                <v-icon left small>{{ getViolationTypeIcon(item.violation_type) }}</v-icon>
                                {{ getViolationTypeDisplayName(item.violation_type) }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.service_name`]="{ item }">
                            <v-chip
                                small
                                :color="getAIServiceColor(item.service_name)"
                                text-color="white"
                                class="service-chip"
                            >
                                {{ item.service_name }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.user`]="{ item }">
                            {{ item.session ? item.session.email : 'N/A' }}
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                <v-icon left small>{{ getRiskLevelIcon(item.risk_level) }}</v-icon>
                                {{ item.risk_level.toUpperCase() }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.is_authorized`]="{ item }">
                            <v-chip
                                small
                                :color="item.is_authorized ? 'success' : 'error'"
                                text-color="white"
                                class="authorization-chip"
                            >
                                <v-icon left small>
                                    {{ item.is_authorized ? 'mdi-check-circle' : 'mdi-close-circle' }}
                                </v-icon>
                                {{ item.is_authorized ? $t('Authorized') : $t('Unauthorized') }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.evidence`]="{ item }">
                            <v-tooltip bottom max-width="400px">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-chip
                                        v-bind="attrs"
                                        v-on="on"
                                        small
                                        color="info"
                                        text-color="white"
                                        class="evidence-chip"
                                    >
                                        <v-icon left small>mdi-file-document-multiple</v-icon>
                                        {{ getEvidenceCount(item.evidence) }} {{ $t('Evidence') }}
                                    </v-chip>
                                </template>
                                <div>
                                    <div v-for="(evidence, index) in getEvidenceArray(item.evidence)" 
                                         :key="index" 
                                         class="mb-1">
                                        • {{ evidence }}
                                    </div>
                                </div>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.policy_violation_details`]="{ item }">
                            <v-tooltip bottom max-width="500px">
                                <template v-slot:activator="{ on, attrs }">
                                    <span 
                                        v-bind="attrs" 
                                        v-on="on" 
                                        class="text-truncate policy-details-text" 
                                        style="max-width: 200px; display: inline-block; cursor: pointer;"
                                    >
                                        {{ item.policy_violation_details || 'No details available' }}
                                    </span>
                                </template>
                                <span>{{ item.policy_violation_details || 'No details available' }}</span>
                            </v-tooltip>
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
                                <v-icon right small>mdi-open-in-new</v-icon>
                            </v-btn>
                            <span v-else class="text-caption grey--text">N/A</span>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="primary"
                                @click="viewViolationDetails(item)"
                                :title="$t('View Details')"
                            >
                                <v-icon small>mdi-eye</v-icon>
                            </v-btn>
                            <v-btn
                                v-if="item.session_id"
                                icon
                                small
                                color="secondary"
                                @click="viewSession(item.session_id)"
                                :title="$t('View Session')"
                            >
                                <v-icon small>mdi-open-in-new</v-icon>
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
                        <template v-slot:[`item.detected_at`]="{ item }">
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on">
                                        {{ moment(item.detected_at).format("MMM DD, HH:mm") }}
                                    </span>
                                </template>
                                <span>{{ moment(item.detected_at).format("LLLL") }}</span>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.prompt_summary`]="{ item }">
                            <v-tooltip bottom max-width="400px">
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on" class="text-truncate" style="max-width: 200px; display: inline-block;">
                                        {{ item.prompt_summary || 'No summary available' }}
                                    </span>
                                </template>
                                <span>{{ item.prompt_summary || 'No summary available' }}</span>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.risk_level`]="{ item }">
                            <v-chip
                                v-if="item.risk_level"
                                :color="getRiskLevelColor(item.risk_level)"
                                :text-color="item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                small
                                class="font-weight-medium"
                            >
                                <v-icon left small>{{ getRiskLevelIcon(item.risk_level) }}</v-icon>
                                {{ item.risk_level.toUpperCase() }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.policy_compliance`]="{ item }">
                            <v-chip
                                small
                                :color="getPolicyComplianceColor(item.policy_compliance)"
                                text-color="white"
                                class="compliance-chip"
                            >
                                <v-icon left small>
                                    {{ getPolicyComplianceIcon(item.policy_compliance) }}
                                </v-icon>
                                {{ getPolicyComplianceText(item.policy_compliance) }}
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
                            <span v-else class="text-caption grey--text">{{ $t('Clean') }}</span>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="primary"
                                @click="viewPromptAnalysisDetails(item)"
                                :title="$t('View Details')"
                            >
                                <v-icon small>mdi-eye</v-icon>
                            </v-btn>
                            <v-btn
                                v-if="item.session_id"
                                icon
                                small
                                color="secondary"
                                @click="viewSession(item.session_id)"
                                :title="$t('View Session')"
                            >
                                <v-icon small>mdi-open-in-new</v-icon>
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

                        <template v-slot:[`item.detected_at`]="{ item }">
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on, attrs }">
                                    <span v-bind="attrs" v-on="on">
                                        {{ moment(item.detected_at).format("MMM DD, HH:mm") }}
                                    </span>
                                </template>
                                <span>{{ moment(item.detected_at).format("LLLL") }}</span>
                            </v-tooltip>
                        </template>
                        <template v-slot:[`item.data_type`]="{ item }">
                            <v-chip
                                small
                                :color="getDataTypeColor(item.data_type)"
                                text-color="white"
                                class="data-type-chip"
                            >
                                <v-icon left small>{{ getDataTypeIcon(item.data_type) }}</v-icon>
                                {{ getDataTypeDisplayName(item.data_type) }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.ai_service`]="{ item }">
                            <v-chip
                                small
                                :color="getAIServiceColor(item.ai_service)"
                                text-color="white"
                                class="service-chip"
                            >
                                {{ item.ai_service }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.exposure_method`]="{ item }">
                            <v-chip
                                small
                                :color="getExposureMethodColor(item.exposure_method)"
                                text-color="white"
                                class="exposure-method-chip"
                            >
                                <v-icon left small>{{ getExposureMethodIcon(item.exposure_method) }}</v-icon>
                                {{ getExposureMethodDisplayName(item.exposure_method) }}
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
                                <v-icon left small>{{ getRiskLevelIcon(item.risk_level) }}</v-icon>
                                {{ item.risk_level.toUpperCase() }}
                            </v-chip>
                        </template>
                        <template v-slot:[`item.confidence`]="{ item }">
                            <div class="d-flex align-center">
                                <v-progress-linear
                                    :value="Math.round(parseFloat(item.confidence || 0) * 100)"
                                    :color="getConfidenceColor(Math.round(parseFloat(item.confidence || 0) * 100))"
                                    height="12"
                                    rounded
                                    class="mr-2"
                                    style="width: 100px;"
                                ></v-progress-linear>
                                <span class="text-caption font-weight-medium">{{ Math.round(parseFloat(item.confidence || 0) * 100) }}%</span>
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
                                <v-icon right small>mdi-open-in-new</v-icon>
                            </v-btn>
                            <span v-else class="text-caption grey--text">N/A</span>
                        </template>
                        <template v-slot:[`item.actions`]="{ item }">
                            <v-btn
                                icon
                                small
                                color="primary"
                                @click="viewSensitiveExposureDetails(item)"
                                :title="$t('View Details')"
                            >
                                <v-icon small>mdi-eye</v-icon>
                            </v-btn>
                            <v-btn
                                v-if="item.session_id"
                                icon
                                small
                                color="secondary"
                                @click="viewSession(item.session_id)"
                                :title="$t('View Session')"
                            >
                                <v-icon small>mdi-open-in-new</v-icon>
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
                            <div class="text-subtitle-2 grey--text mt-2">
                                {{ $t('Configure basic AI usage monitoring settings') }}
                            </div>
                        </div>

                        <v-container class="px-6 py-4">
                            <v-row justify="center">
                                <v-col cols="12" md="8" lg="6">
                                    <v-card flat outlined class="pa-6">
                                        <!-- Monitoring Enable/Disable -->
                                        <div class="mb-8">
                                            <div class="text-center mb-4">
                                            <v-icon 
                                                :color="settingsForm.aiMonitoringEnabled ? 'success' : 'grey'" 
                                                size="48"
                                                class="mb-2"
                                            >
                                                {{ settingsForm.aiMonitoringEnabled ? 'mdi-shield-check' : 'mdi-shield-off' }}
                                            </v-icon>
                                                <div class="text-h6 mb-2">
                                                    {{ $t('System Monitoring') }}
                                                </div>
                                            </div>
                                            
                                            <v-switch
                                                v-model="settingsForm.aiMonitoringEnabled"
                                                :label="$t('Enable AI Usage Monitoring')"
                                                class="d-flex justify-center mb-3"
                                                color="primary"
                                                inset
                                            ></v-switch>
                                            
                                            <v-alert
                                                :type="settingsForm.aiMonitoringEnabled ? 'info' : 'warning'"
                                                text
                                                class="mb-0"
                                            >
                                                <div class="text-body-2">
                                                    {{ settingsForm.aiMonitoringEnabled 
                                                        ? $t('AI usage monitoring is active. All AI interactions will be tracked and analyzed.') 
                                                        : $t('AI usage monitoring is disabled. No AI interactions will be tracked.') 
                                                    }}
                                                </div>
                                            </v-alert>
                                        </div>

                                        <v-divider class="my-6"></v-divider>

                                        <!-- Dynamic Service Learning -->
                                        <div class="mb-8">
                                            <div class="text-center mb-4">
                                                <v-icon 
                                                    :color="settingsForm.dynamicServiceLearning ? 'primary' : 'grey'" 
                                                    size="32"
                                                    class="mb-2"
                                                >
                                                    {{ settingsForm.dynamicServiceLearning ? 'mdi-brain' : 'mdi-brain-freeze' }}
                                                </v-icon>
                                                <div class="text-h6 mb-2">
                                                    {{ $t('Intelligent Learning') }}
                                                </div>
                                            </div>

                                            <v-switch
                                                v-model="settingsForm.dynamicServiceLearning"
                                                :label="$t('Enable Dynamic Service Learning')"
                                                class="d-flex justify-center mb-3"
                                                color="primary"
                                                inset
                                            ></v-switch>

                                            <v-alert
                                                :type="settingsForm.dynamicServiceLearning ? 'success' : 'info'"
                                                text
                                                class="mb-0"
                                            >
                                                <div class="text-body-2">
                                                    {{ settingsForm.dynamicServiceLearning 
                                                        ? $t('The system will automatically detect and learn about new AI services as they are used.') 
                                                        : $t('Dynamic learning is disabled. Only pre-configured AI services will be monitored.') 
                                                    }}
                                                </div>
                                            </v-alert>
                                        </div>

                                        <v-divider class="my-6"></v-divider>

                                        <!-- Custom Analysis Instructions -->
                                        <div class="mb-6">
                                            <div class="text-center mb-4">
                                                <v-icon color="indigo" size="32" class="mb-2">
                                                    mdi-file-document-edit-outline
                                                </v-icon>
                                                <div class="text-h6 mb-2">
                                                    {{ $t('Custom Analysis Instructions') }}
                                                </div>
                                                <div class="text-body-2 grey--text">
                                                    {{ $t('Provide additional instructions for the AI usage analysis component') }}
                                                </div>
                                            </div>

                                            <v-textarea
                                                v-model="settingsForm.aiAnalysisCustomInstructions"
                                                :label="$t('Analysis Instructions')"
                                                rows="6"
                                                outlined
                                                hide-details="auto"
                                                placeholder="Enter custom instructions for analyzing AI usage patterns..."
                                                class="mt-4"
                                            ></v-textarea>
                                        </div>                                       

                                        <!-- Action Buttons -->
                                        <div class="d-flex justify-space-between pt-4">
                                            <v-btn
                                                color="error"
                                                outlined
                                                @click="resetSettings"
                                                :loading="settingsLoading"
                                                :disabled="!appData.checkPermission('/','w')"
                                            >
                                                <v-icon left small>mdi-restore</v-icon>
                                                {{ $t('Reset to Default') }}
                                            </v-btn>
                                            
                                            <v-btn
                                                color="primary"
                                                large
                                                @click="saveSettings"
                                                :loading="settingsLoading"
                                                :disabled="!appData.checkPermission('/','w')"
                                            >
                                                <v-icon left>mdi-content-save</v-icon>
                                                {{ $t('Save Settings') }}
                                            </v-btn>
                                        </div>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </v-container>
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

        <!-- Prompt Analysis Details Dialog -->
        <v-dialog v-model="promptDetailsDialog.show" max-width="900px" persistent scrollable>
            <v-card>
                <v-card-title class="headline">
                    <v-icon left color="primary">mdi-text-search</v-icon>
                    {{ $t('Prompt Analysis Details') }}
                    <v-spacer></v-spacer>
                    <v-btn icon @click="promptDetailsDialog.show = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text class="pa-0">
                    <v-container class="py-4" v-if="promptDetailsDialog.item">
                        <!-- Header Section with Status Chips -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <div class="d-flex flex-wrap align-center ga-2">
                                    <v-chip
                                        :color="getRiskLevelColor(promptDetailsDialog.item.risk_level)"
                                        :text-color="promptDetailsDialog.item.risk_level && promptDetailsDialog.item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getRiskLevelIcon(promptDetailsDialog.item.risk_level) }}</v-icon>
                                        {{ (promptDetailsDialog.item.risk_level && promptDetailsDialog.item.risk_level.toUpperCase()) || 'UNKNOWN' }} RISK
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getPolicyComplianceColor(promptDetailsDialog.item.policy_compliance)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        <v-icon left small>{{ getPolicyComplianceIcon(promptDetailsDialog.item.policy_compliance) }}</v-icon>
                                        {{ getPolicyComplianceText(promptDetailsDialog.item.policy_compliance) }}
                                    </v-chip>
                                    
                                    <v-chip
                                        v-if="promptDetailsDialog.item.contains_sensitive_data"
                                        color="warning"
                                        text-color="black"
                                        class="mr-2"
                                    >
                                        <v-icon left small>mdi-eye-off</v-icon>
                                        {{ $t('Contains Sensitive Data') }}
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getAIServiceColor(promptDetailsDialog.item.ai_service)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        {{ promptDetailsDialog.item.ai_service || 'Unknown Service' }}
                                    </v-chip>
                                </div>
                            </v-col>
                        </v-row>

                        <!-- Basic Information -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                                        <v-icon left small>mdi-information-outline</v-icon>
                                        {{ $t('Basic Information') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Detected At') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(promptDetailsDialog.item.detected_at).format("LLLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Prompt Type') }}:</strong><br>
                                            <v-chip small color="blue-grey" text-color="white" class="text-capitalize">
                                                {{ promptDetailsDialog.item.prompt_type || 'Unknown' }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Session ID') }}:</strong><br>
                                            <v-btn
                                                v-if="promptDetailsDialog.item.session_id"
                                                text
                                                small
                                                color="primary"
                                                @click="viewSession(promptDetailsDialog.item.session_id)"
                                                class="pa-0"
                                            >
                                                {{ promptDetailsDialog.item.session_id }}
                                                <v-icon right small>mdi-open-in-new</v-icon>
                                            </v-btn>
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
                                            <strong>{{ $t('User') }}:</strong><br>
                                            <span class="text-body-2">{{ (promptDetailsDialog.item.session && promptDetailsDialog.item.session.email) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Device') }}:</strong><br>
                                            <span class="text-body-2">{{ (promptDetailsDialog.item.session && promptDetailsDialog.item.session.deviceTitle) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Domain') }}:</strong><br>
                                            <span class="text-body-2">{{ promptDetailsDialog.item.maindomain || 'N/A' }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Prompt Summary -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-primary white--text">
                                        <v-icon left small color="white">mdi-text-box-outline</v-icon>
                                        {{ $t('Prompt Summary') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="text-body-1 prompt-summary-text">
                                            {{ promptDetailsDialog.item.prompt_summary || 'No summary available' }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Risk Analysis -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-orange lighten-4">
                                        <v-icon left small>mdi-shield-alert-outline</v-icon>
                                        {{ $t('Risk Factors') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div v-if="getRiskFactorsArray(promptDetailsDialog.item.risk_factors).length > 0">
                                            <v-chip
                                                v-for="(factor, index) in getRiskFactorsArray(promptDetailsDialog.item.risk_factors)"
                                                :key="index"
                                                small
                                                color="orange"
                                                text-color="white"
                                                class="ma-1"
                                            >
                                                <v-icon left x-small>mdi-alert-circle</v-icon>
                                                {{ factor }}
                                            </v-chip>
                                        </div>
                                        <div v-else class="text-body-2 grey--text">
                                            {{ $t('No specific risk factors identified') }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-blue lighten-4">
                                        <v-icon left small>mdi-clock-outline</v-icon>
                                        {{ $t('Timeline') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Created') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(promptDetailsDialog.item.createdAt).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Updated') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(promptDetailsDialog.item.updatedAt).format("LLL") }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Detailed Reasoning -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-indigo lighten-4">
                                        <v-icon left small>mdi-brain</v-icon>
                                        {{ $t('AI Analysis Reasoning') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="text-body-1 reasoning-text">
                                            {{ promptDetailsDialog.item.reasoning || 'No detailed reasoning available' }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        v-if="promptDetailsDialog.item.session_id"
                        color="secondary"
                        @click="viewSession(promptDetailsDialog.item.session_id)"
                    >
                        <v-icon left small>mdi-open-in-new</v-icon>
                        {{ $t('View Full Session') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="promptDetailsDialog.show = false"
                    >
                        {{ $t('Close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Policy Violation Details Dialog -->
        <v-dialog v-model="violationDetailsDialog.show" max-width="900px" persistent scrollable>
            <v-card>
                <v-card-title class="headline">
                    <v-icon left color="error">mdi-shield-alert</v-icon>
                    {{ $t('Policy Violation Details') }}
                    <v-spacer></v-spacer>
                    <v-btn icon @click="violationDetailsDialog.show = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text class="pa-0">
                    <v-container class="py-4" v-if="violationDetailsDialog.item">
                        <!-- Header Section with Status Chips -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <div class="d-flex flex-wrap align-center ga-2">
                                    <v-chip
                                        :color="getViolationTypeColor(violationDetailsDialog.item.violation_type)"
                                        text-color="white"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getViolationTypeIcon(violationDetailsDialog.item.violation_type) }}</v-icon>
                                        {{ getViolationTypeDisplayName(violationDetailsDialog.item.violation_type) || 'UNKNOWN' }} VIOLATION
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getRiskLevelColor(violationDetailsDialog.item.risk_level)"
                                        :text-color="violationDetailsDialog.item.risk_level && violationDetailsDialog.item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getRiskLevelIcon(violationDetailsDialog.item.risk_level) }}</v-icon>
                                        {{ (violationDetailsDialog.item.risk_level && violationDetailsDialog.item.risk_level.toUpperCase()) || 'UNKNOWN' }} RISK
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="violationDetailsDialog.item.is_authorized ? 'success' : 'error'"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        <v-icon left small>
                                            {{ violationDetailsDialog.item.is_authorized ? 'mdi-check-circle' : 'mdi-close-circle' }}
                                        </v-icon>
                                        {{ violationDetailsDialog.item.is_authorized ? $t('Authorized') : $t('Unauthorized') }}
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getAIServiceColor(violationDetailsDialog.item.service_name)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        {{ violationDetailsDialog.item.service_name || 'Unknown Service' }}
                                    </v-chip>
                                </div>
                            </v-col>
                        </v-row>

                        <!-- Basic Information -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                                        <v-icon left small>mdi-information-outline</v-icon>
                                        {{ $t('Basic Information') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Detected At') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(violationDetailsDialog.item.detected_at).format("LLLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Service Name') }}:</strong><br>
                                            <v-chip small :color="getAIServiceColor(violationDetailsDialog.item.service_name)" text-color="white">
                                                {{ violationDetailsDialog.item.service_name || 'Unknown' }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Session ID') }}:</strong><br>
                                            <v-btn
                                                v-if="violationDetailsDialog.item.session_id"
                                                text
                                                small
                                                color="primary"
                                                @click="viewSession(violationDetailsDialog.item.session_id)"
                                                class="pa-0"
                                            >
                                                {{ violationDetailsDialog.item.session_id }}
                                                <v-icon right small>mdi-open-in-new</v-icon>
                                            </v-btn>
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
                                            <strong>{{ $t('User') }}:</strong><br>
                                            <span class="text-body-2">{{ (violationDetailsDialog.item.session && violationDetailsDialog.item.session.email) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Device') }}:</strong><br>
                                            <span class="text-body-2">{{ (violationDetailsDialog.item.session && violationDetailsDialog.item.session.deviceTitle) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Domain') }}:</strong><br>
                                            <span class="text-body-2">{{ violationDetailsDialog.item.maindomain || 'N/A' }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Policy Violation Details -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-error white--text">
                                        <v-icon left small color="white">mdi-shield-alert-outline</v-icon>
                                        {{ $t('Policy Violation Details') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="text-body-1 violation-details-text">
                                            {{ violationDetailsDialog.item.policy_violation_details || 'No detailed policy violation information available' }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Evidence -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-info white--text">
                                        <v-icon left small color="white">mdi-file-document-multiple-outline</v-icon>
                                        {{ $t('Evidence') }} ({{ getEvidenceCount(violationDetailsDialog.item.evidence) }})
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div v-if="getEvidenceArray(violationDetailsDialog.item.evidence).length > 0" class="evidence-list">
                                            <div 
                                                v-for="(evidence, index) in getEvidenceArray(violationDetailsDialog.item.evidence)" 
                                                :key="index" 
                                                class="evidence-item mb-2 pa-2 grey lighten-4 rounded"
                                            >
                                                <v-icon small color="info" class="mr-2">mdi-file-document</v-icon>
                                                <span class="text-body-2">{{ evidence }}</span>
                                            </div>
                                        </div>
                                        <div v-else class="text-body-2 grey--text">
                                            {{ $t('No evidence available') }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-blue lighten-4">
                                        <v-icon left small>mdi-clock-outline</v-icon>
                                        {{ $t('Timeline') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Detected At') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(violationDetailsDialog.item.detected_at).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Created') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(violationDetailsDialog.item.createdAt).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Updated') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(violationDetailsDialog.item.updatedAt).format("LLL") }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        v-if="violationDetailsDialog.item.session_id"
                        color="secondary"
                        @click="viewSession(violationDetailsDialog.item.session_id)"
                    >
                        <v-icon left small>mdi-open-in-new</v-icon>
                        {{ $t('View Full Session') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="violationDetailsDialog.show = false"
                    >
                        {{ $t('Close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Sensitive Exposure Details Dialog -->
        <v-dialog v-model="sensitiveExposureDetailsDialog.show" max-width="900px" persistent scrollable>
            <v-card>
                <v-card-title class="headline">
                    <v-icon left color="warning">mdi-eye-off</v-icon>
                    {{ $t('Sensitive Exposure Details') }}
                    <v-spacer></v-spacer>
                    <v-btn icon @click="sensitiveExposureDetailsDialog.show = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text class="pa-0">
                    <v-container class="py-4" v-if="sensitiveExposureDetailsDialog.item">
                        <!-- Header Section with Status Chips -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <div class="d-flex flex-wrap align-center ga-2">
                                    <v-chip
                                        :color="getDataTypeColor(sensitiveExposureDetailsDialog.item.data_type)"
                                        text-color="white"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getDataTypeIcon(sensitiveExposureDetailsDialog.item.data_type) }}</v-icon>
                                        {{ getDataTypeDisplayName(sensitiveExposureDetailsDialog.item.data_type) || 'UNKNOWN' }} DATA
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getRiskLevelColor(sensitiveExposureDetailsDialog.item.risk_level)"
                                        :text-color="getRiskLevelTextColor(sensitiveExposureDetailsDialog.item.risk_level)"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getRiskLevelIcon(sensitiveExposureDetailsDialog.item.risk_level) }}</v-icon>
                                        {{ getRiskLevelDisplayText(sensitiveExposureDetailsDialog.item.risk_level) }} RISK
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getExposureMethodColor(sensitiveExposureDetailsDialog.item.exposure_method)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        <v-icon left small>{{ getExposureMethodIcon(sensitiveExposureDetailsDialog.item.exposure_method) }}</v-icon>
                                        {{ getExposureMethodDisplayName(sensitiveExposureDetailsDialog.item.exposure_method) }}
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getAIServiceColor(sensitiveExposureDetailsDialog.item.ai_service)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        {{ sensitiveExposureDetailsDialog.item.ai_service || 'Unknown Service' }}
                                    </v-chip>
                                </div>
                            </v-col>
                        </v-row>

                        <!-- Basic Information -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                                        <v-icon left small>mdi-information-outline</v-icon>
                                        {{ $t('Exposure Information') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Detected At') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(sensitiveExposureDetailsDialog.item.detected_at).format("LLLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('AI Service') }}:</strong><br>
                                            <v-chip small :color="getAIServiceColor(sensitiveExposureDetailsDialog.item.ai_service)" text-color="white">
                                                {{ sensitiveExposureDetailsDialog.item.ai_service || 'Unknown' }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Session ID') }}:</strong><br>
                                            <v-btn
                                                v-if="sensitiveExposureDetailsDialog.item.session_id"
                                                text
                                                small
                                                color="primary"
                                                @click="viewSession(sensitiveExposureDetailsDialog.item.session_id)"
                                                class="pa-0"
                                            >
                                                {{ sensitiveExposureDetailsDialog.item.session_id }}
                                                <v-icon right small>mdi-open-in-new</v-icon>
                                            </v-btn>
                                            <span v-else class="text-body-2 grey--text">N/A</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Content Hash') }}:</strong><br>
                                            <span class="text-body-2 font-weight-mono">{{ sensitiveExposureDetailsDialog.item.content_hash || 'N/A' }}</span>
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
                                            <strong>{{ $t('User') }}:</strong><br>
                                            <span class="text-body-2">{{ (sensitiveExposureDetailsDialog.item.session && sensitiveExposureDetailsDialog.item.session.email) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Device') }}:</strong><br>
                                            <span class="text-body-2">{{ (sensitiveExposureDetailsDialog.item.session && sensitiveExposureDetailsDialog.item.session.deviceTitle) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Domain') }}:</strong><br>
                                            <span class="text-body-2">{{ sensitiveExposureDetailsDialog.item.maindomain || 'N/A' }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Exposure Analysis -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="8">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-warning white--text">
                                        <v-icon left small color="white">mdi-eye-off-outline</v-icon>
                                        {{ $t('Exposure Analysis') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-3">
                                            <strong>{{ $t('Data Type') }}:</strong><br>
                                            <v-chip :color="getDataTypeColor(sensitiveExposureDetailsDialog.item.data_type)" text-color="white" class="mt-1">
                                                <v-icon left small>{{ getDataTypeIcon(sensitiveExposureDetailsDialog.item.data_type) }}</v-icon>
                                                {{ getDataTypeDisplayName(sensitiveExposureDetailsDialog.item.data_type) }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-3">
                                            <strong>{{ $t('Exposure Method') }}:</strong><br>
                                            <v-chip :color="getExposureMethodColor(sensitiveExposureDetailsDialog.item.exposure_method)" text-color="white" class="mt-1">
                                                <v-icon left small>{{ getExposureMethodIcon(sensitiveExposureDetailsDialog.item.exposure_method) }}</v-icon>
                                                {{ getExposureMethodDisplayName(sensitiveExposureDetailsDialog.item.exposure_method) }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-3">
                                            <strong>{{ $t('Risk Level') }}:</strong><br>
                                            <v-chip 
                                                :color="getRiskLevelColor(sensitiveExposureDetailsDialog.item.risk_level)" 
                                                :text-color="getRiskLevelTextColor(sensitiveExposureDetailsDialog.item.risk_level)"
                                                class="mt-1"
                                            >
                                                <v-icon left small>{{ getRiskLevelIcon(sensitiveExposureDetailsDialog.item.risk_level) }}</v-icon>
                                                {{ getRiskLevelDisplayText(sensitiveExposureDetailsDialog.item.risk_level) }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Detection Confidence') }}:</strong><br>
                                            <div class="d-flex align-center mt-2">
                                                <v-progress-linear
                                                    :value="Math.round(parseFloat(sensitiveExposureDetailsDialog.item.confidence || 0) * 100)"
                                                    :color="getConfidenceColor(Math.round(parseFloat(sensitiveExposureDetailsDialog.item.confidence || 0) * 100))"
                                                    height="16"
                                                    rounded
                                                    class="mr-3"
                                                    style="width: 150px;"
                                                ></v-progress-linear>
                                                <span class="text-h6 font-weight-bold">{{ Math.round(parseFloat(sensitiveExposureDetailsDialog.item.confidence || 0) * 100) }}%</span>
                                            </div>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-blue lighten-4">
                                        <v-icon left small>mdi-clock-outline</v-icon>
                                        {{ $t('Timeline') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Detected At') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(sensitiveExposureDetailsDialog.item.detected_at).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Created') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(sensitiveExposureDetailsDialog.item.createdAt).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Updated') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(sensitiveExposureDetailsDialog.item.updatedAt).format("LLL") }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Mitigation Suggestions -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-success white--text">
                                        <v-icon left small color="white">mdi-shield-check-outline</v-icon>
                                        {{ $t('Mitigation Suggestions') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="text-body-1 mitigation-text">
                                            {{ sensitiveExposureDetailsDialog.item.mitigation_suggested || 'No specific mitigation suggestions available for this exposure type.' }}
                                        </div>
                                        <v-divider class="my-3"></v-divider>
                                        <div class="text-body-2 grey--text">
                                            <strong>{{ $t('General Recommendations') }}:</strong>
                                            <ul class="mt-2">
                                                <li>Review and remove sensitive data from AI service inputs</li>
                                                <li>Implement data loss prevention (DLP) policies</li>
                                                <li>Train users on secure AI usage practices</li>
                                                <li>Monitor AI service usage patterns regularly</li>
                                            </ul>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Additional Details -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-indigo lighten-4">
                                        <v-icon left small>mdi-information-variant</v-icon>
                                        {{ $t('Additional Details') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <v-row>
                                            <v-col cols="12" sm="4">
                                                <div class="text-center">
                                                    <div class="text-h4 warning--text">{{ Math.round(parseFloat(sensitiveExposureDetailsDialog.item.confidence || 0) * 100) }}%</div>
                                                    <div class="text-caption grey--text">{{ $t('Detection Confidence') }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="12" sm="4">
                                                <div class="text-center">
                                                    <div class="text-h4 error--text">{{ getRiskLevelDisplayText(sensitiveExposureDetailsDialog.item.risk_level) }}</div>
                                                    <div class="text-caption grey--text">{{ $t('Risk Level') }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="12" sm="4">
                                                <div class="text-center">
                                                    <div class="text-h4 info--text">{{ getDataTypeDisplayName(sensitiveExposureDetailsDialog.item.data_type) }}</div>
                                                    <div class="text-caption grey--text">{{ $t('Data Type') }}</div>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        v-if="sensitiveExposureDetailsDialog.item.session_id"
                        color="secondary"
                        @click="viewSession(sensitiveExposureDetailsDialog.item.session_id)"
                    >
                        <v-icon left small>mdi-open-in-new</v-icon>
                        {{ $t('View Full Session') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="sensitiveExposureDetailsDialog.show = false"
                    >
                        {{ $t('Close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Usage Session Details Dialog -->
        <v-dialog v-model="usageSessionDetailsDialog.show" max-width="1000px" persistent scrollable>
            <v-card>
                <v-card-title class="headline">
                    <v-icon left color="primary">mdi-robot-outline</v-icon>
                    {{ $t('AI Usage Session Details') }}
                    <v-spacer></v-spacer>
                    <v-btn icon @click="usageSessionDetailsDialog.show = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text class="pa-0">
                    <v-container class="py-4" v-if="usageSessionDetailsDialog.item">
                        <!-- Header Section with Status Chips -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <div class="d-flex flex-wrap align-center ga-2">
                                    <v-chip
                                        :color="getAIServiceColor(usageSessionDetailsDialog.item.ai_service_name)"
                                        text-color="white"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getAIServiceIcon(usageSessionDetailsDialog.item.ai_service_name) }}</v-icon>
                                        {{ usageSessionDetailsDialog.item.ai_service_name || 'Unknown Service' }}
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getRiskLevelColor(usageSessionDetailsDialog.item.risk_level)"
                                        :text-color="usageSessionDetailsDialog.item.risk_level && usageSessionDetailsDialog.item.risk_level.toLowerCase() === 'low' ? 'black' : 'white'"
                                        class="font-weight-medium mr-2"
                                    >
                                        <v-icon left small>{{ getRiskLevelIcon(usageSessionDetailsDialog.item.risk_level) }}</v-icon>
                                        {{ (usageSessionDetailsDialog.item.risk_level && usageSessionDetailsDialog.item.risk_level.toUpperCase()) || 'UNKNOWN' }} RISK
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getServiceTypeColor(usageSessionDetailsDialog.item.service_type)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        <v-icon left small>{{ getServiceTypeIcon(usageSessionDetailsDialog.item.service_type) }}</v-icon>
                                        {{ usageSessionDetailsDialog.item.service_type || 'Unknown Type' }}
                                    </v-chip>
                                    
                                    <v-chip
                                        :color="getInteractionCountColor(usageSessionDetailsDialog.item.interaction_count)"
                                        text-color="white"
                                        class="mr-2"
                                    >
                                        <v-icon left small>mdi-pulse</v-icon>
                                        {{ usageSessionDetailsDialog.item.interaction_count || 0 }} Interactions
                                    </v-chip>
                                </div>
                            </v-col>
                        </v-row>

                        <!-- Basic Information -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-grey lighten-4">
                                        <v-icon left small>mdi-information-outline</v-icon>
                                        {{ $t('Session Information') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Session ID') }}:</strong><br>
                                            <v-btn
                                                v-if="usageSessionDetailsDialog.item.session_id"
                                                text
                                                small
                                                color="primary"
                                                @click="viewSession(usageSessionDetailsDialog.item.session_id)"
                                                class="pa-0"
                                            >
                                                {{ usageSessionDetailsDialog.item.session_id }}
                                                <v-icon right small>mdi-open-in-new</v-icon>
                                            </v-btn>
                                            <span v-else class="text-body-2 grey--text">N/A</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Service URL') }}:</strong><br>
                                            <a 
                                                v-if="usageSessionDetailsDialog.item.service_url"
                                                :href="usageSessionDetailsDialog.item.service_url" 
                                                target="_blank" 
                                                class="text-body-2 primary--text"
                                            >
                                                {{ usageSessionDetailsDialog.item.service_url }}
                                                <v-icon small>mdi-open-in-new</v-icon>
                                            </a>
                                            <span v-else class="text-body-2 grey--text">N/A</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Detection Method') }}:</strong><br>
                                            <v-chip small color="info" text-color="white">
                                                {{ usageSessionDetailsDialog.item.detection_method || 'Unknown' }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Detection Confidence') }}:</strong><br>
                                            <div class="d-flex align-center">
                                                <v-progress-linear
                                                    :value="parseFloat(usageSessionDetailsDialog.item.detection_confidence || 0) * 100"
                                                    :color="getConfidenceColor(parseFloat(usageSessionDetailsDialog.item.detection_confidence || 0) * 100)"
                                                    height="12"
                                                    rounded
                                                    class="mr-2"
                                                    style="width: 100px;"
                                                ></v-progress-linear>
                                                <span class="text-body-2">{{ Math.round((parseFloat(usageSessionDetailsDialog.item.detection_confidence || 0) * 100)) }}%</span>
                                            </div>
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
                                            <strong>{{ $t('User') }}:</strong><br>
                                            <span class="text-body-2">{{ (usageSessionDetailsDialog.item.session && usageSessionDetailsDialog.item.session.email) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Device') }}:</strong><br>
                                            <span class="text-body-2">{{ (usageSessionDetailsDialog.item.session && usageSessionDetailsDialog.item.session.deviceTitle) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Device ID') }}:</strong><br>
                                            <span class="text-body-2">{{ (usageSessionDetailsDialog.item.session && usageSessionDetailsDialog.item.session.deviceId) || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Domain') }}:</strong><br>
                                            <span class="text-body-2">{{ usageSessionDetailsDialog.item.maindomain || 'N/A' }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Session Timeline -->
                        <v-row class="mb-4">
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-blue lighten-4">
                                        <v-icon left small>mdi-clock-outline</v-icon>
                                        {{ $t('Session Timeline') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('First Detected') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(usageSessionDetailsDialog.item.first_detected).format("LLLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Last Detected') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(usageSessionDetailsDialog.item.last_detected).format("LLLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Session Duration') }}:</strong><br>
                                            <v-chip small color="success" text-color="white">
                                                <v-icon left small>mdi-timer</v-icon>
                                                {{ calculateSessionDuration(usageSessionDetailsDialog.item) }}
                                            </v-chip>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Total Interactions') }}:</strong><br>
                                            <v-chip small :color="getInteractionCountColor(usageSessionDetailsDialog.item.interaction_count)" text-color="white">
                                                <v-icon left small>mdi-pulse</v-icon>
                                                {{ usageSessionDetailsDialog.item.interaction_count || 0 }}
                                            </v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-green lighten-4">
                                        <v-icon left small>mdi-database-outline</v-icon>
                                        {{ $t('Record Information') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div class="mb-2">
                                            <strong>{{ $t('Record ID') }}:</strong><br>
                                            <span class="text-body-2 font-weight-mono">{{ usageSessionDetailsDialog.item.id || 'N/A' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Created') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(usageSessionDetailsDialog.item.createdAt).format("LLL") }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong>{{ $t('Last Updated') }}:</strong><br>
                                            <span class="text-body-2">{{ moment(usageSessionDetailsDialog.item.updatedAt).format("LLL") }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Risk Analysis -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-orange lighten-4">
                                        <v-icon left small>mdi-shield-alert-outline</v-icon>
                                        {{ $t('Risk Factors') }} ({{ getRiskFactorsArray(usageSessionDetailsDialog.item.risk_factors).length }})
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <div v-if="getRiskFactorsArray(usageSessionDetailsDialog.item.risk_factors).length > 0" class="risk-factors-list">
                                            <div 
                                                v-for="(factor, index) in getRiskFactorsArray(usageSessionDetailsDialog.item.risk_factors)" 
                                                :key="index" 
                                                class="risk-factor-item mb-3 pa-3 orange lighten-5 rounded"
                                            >
                                                <div class="d-flex align-start">
                                                    <v-icon small color="orange darken-2" class="mt-1 mr-2">mdi-alert-circle</v-icon>
                                                    <div class="flex-grow-1">
                                                        <div class="text-body-2 font-weight-medium mb-1">
                                                            Risk Factor #{{ index + 1 }}
                                                        </div>
                                                        <div class="text-body-2">
                                                            {{ factor }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="text-center py-4">
                                            <v-icon large color="grey lighten-1">mdi-shield-check</v-icon>
                                            <p class="mt-2 grey--text text-body-2">{{ $t('No specific risk factors identified') }}</p>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Session Activity Summary -->
                        <v-row class="mb-4">
                            <v-col cols="12">
                                <v-card flat outlined>
                                    <v-card-title class="text-subtitle-1 py-2 bg-indigo lighten-4">
                                        <v-icon left small>mdi-chart-line</v-icon>
                                        {{ $t('Activity Summary') }}
                                    </v-card-title>
                                    <v-card-text class="pa-3">
                                        <v-row>
                                            <v-col cols="12" sm="6" md="3">
                                                <div class="text-center">
                                                    <div class="text-h4 primary--text">{{ usageSessionDetailsDialog.item.interaction_count || 0 }}</div>
                                                    <div class="text-caption grey--text">{{ $t('Total Interactions') }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="12" sm="6" md="3">
                                                <div class="text-center">
                                                    <div class="text-h4 success--text">{{ Math.round((parseFloat(usageSessionDetailsDialog.item.detection_confidence || 0) * 100)) }}%</div>
                                                    <div class="text-caption grey--text">{{ $t('Detection Confidence') }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="12" sm="6" md="3">
                                                <div class="text-center">
                                                    <div class="text-h4 orange--text">{{ getRiskFactorsArray(usageSessionDetailsDialog.item.risk_factors).length }}</div>
                                                    <div class="text-caption grey--text">{{ $t('Risk Factors') }}</div>
                                                </div>
                                            </v-col>
                                            <v-col cols="12" sm="6" md="3">
                                                <div class="text-center">
                                                    <div class="text-h4 info--text">{{ calculateSessionDuration(usageSessionDetailsDialog.item) }}</div>
                                                    <div class="text-caption grey--text">{{ $t('Duration') }}</div>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-btn
                        color="info"
                        @click="exportSessionData(usageSessionDetailsDialog.item)"
                        :title="$t('Export Session Data')"
                    >
                        <v-icon left small>mdi-download</v-icon>
                        {{ $t('Export Data') }}
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                        v-if="usageSessionDetailsDialog.item.session_id"
                        color="secondary"
                        @click="viewSession(usageSessionDetailsDialog.item.session_id)"
                    >
                        <v-icon left small>mdi-open-in-new</v-icon>
                        {{ $t('View Full Session') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="usageSessionDetailsDialog.show = false"
                    >
                        {{ $t('Close') }}
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
      riskLevel: null,
      isAuthorized: null
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
      aiMonitoringEnabled: true,
      dynamicServiceLearning: true,
      aiAnalysisCustomInstructions: "",     
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
      { text: 'Credentials', value: 'credentials' },
      { text: 'API Keys', value: 'api_keys' },
      { text: 'Source Code', value: 'source_code' },
      { text: 'Personal Data', value: 'personal_data' },
      { text: 'Financial Data', value: 'financial_data' },
      { text: 'Health Data', value: 'health_data' },
      { text: 'Proprietary Info', value: 'proprietary_info' },
      { text: 'Other', value: 'other' }
    ],
    exposureMethodOptions: [
      { text: 'Prompt', value: 'prompt' },
      { text: 'File Upload', value: 'file_upload' },
      { text: 'Screen Share', value: 'screen_share' },
      { text: 'Copy Paste', value: 'copy_paste' }
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
    authorizationOptions: [
      { text: 'Authorized', value: true },
      { text: 'Unauthorized', value: false }
    ],

    // Snackbar
    snackbar: false,
    snackbarText: "",
    snackbarColor: "info",

    // Prompt Analysis Details Dialog
    promptDetailsDialog: {
      show: false,
      item: {}
    },

    // Policy Violation Details Dialog
    violationDetailsDialog: {
      show: false,
      item: {}
    },

    // Usage Session Details Dialog
    usageSessionDetailsDialog: {
      show: false,
      item: {}
    },

    // Sensitive Exposure Details Dialog
    sensitiveExposureDetailsDialog: {
      show: false,
      item: {}
    }
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
        'credentials': 'mdi-key',
        'api_keys': 'mdi-key-variant',
        'source_code': 'mdi-code-braces',
        'personal_data': 'mdi-account',
        'financial_data': 'mdi-currency-usd',
        'health_data': 'mdi-medical-bag',
        'proprietary_info': 'mdi-briefcase',
        'other': 'mdi-file'
      };
      return iconMap[dataType] || 'mdi-file';
    },

    getDataTypeDisplayName(dataType) {
      const displayMap = {
        'credentials': 'Credentials',
        'api_keys': 'API Keys',
        'source_code': 'Source Code',
        'personal_data': 'Personal Data',
        'financial_data': 'Financial Data',
        'health_data': 'Health Data',
        'proprietary_info': 'Proprietary Info',
        'other': 'Other'
      };
      return displayMap[dataType] || dataType;
    },

    getExposureMethodColor(method) {
      const colorMap = {
        'prompt': 'blue',
        'file_upload': 'orange',
        'screen_share': 'purple',
        'copy_paste': 'teal'
      };
      return colorMap[method] || 'grey';
    },

    getExposureMethodIcon(method) {
      const iconMap = {
        'prompt': 'mdi-message-text',
        'file_upload': 'mdi-file-upload',
        'screen_share': 'mdi-monitor-share',
        'copy_paste': 'mdi-content-copy'
      };
      return iconMap[method] || 'mdi-help-circle';
    },

    getExposureMethodDisplayName(method) {
      const displayMap = {
        'prompt': 'Prompt',
        'file_upload': 'File Upload',
        'screen_share': 'Screen Share',
        'copy_paste': 'Copy Paste'
      };
      return displayMap[method] || method;
    },

    getConfidenceColor(confidence) {
      if (confidence >= 80) return 'success';
      if (confidence >= 60) return 'warning';
      return 'error';
    },

    // New helper methods for prompt analysis
    getRiskLevelIcon(riskLevel) {
      if (!riskLevel) return '';
      switch(riskLevel.toLowerCase()) {
        case 'low': return 'mdi-shield-check';
        case 'medium': return 'mdi-shield-outline';
        case 'high': return 'mdi-shield-alert';
        case 'critical': return 'mdi-shield-off';
        default: return 'mdi-shield';
      }
    },

    getPolicyComplianceColor(compliance) {
      if (!compliance) return 'grey';
      switch(compliance.toLowerCase()) {
        case 'compliant': return 'success';
        case 'violation': return 'error';
        case 'needs_review': return 'warning';
        case 'unknown': return 'grey';
        default: return 'grey';
      }
    },

    getPolicyComplianceIcon(compliance) {
      if (!compliance) return 'mdi-help-circle';
      switch(compliance.toLowerCase()) {
        case 'compliant': return 'mdi-check-circle';
        case 'violation': return 'mdi-alert-circle';
        case 'needs_review': return 'mdi-clock-alert';
        case 'unknown': return 'mdi-help-circle';
        default: return 'mdi-help-circle';
      }
    },

    getPolicyComplianceText(compliance) {
      if (!compliance) return 'Unknown';
      switch(compliance.toLowerCase()) {
        case 'compliant': return 'Compliant';
        case 'violation': return 'Violation';
        case 'needs_review': return 'Needs Review';
        case 'unknown': return 'Unknown';
        default: return compliance;
      }
    },

    // Prompt Analysis Details Modal
    viewPromptAnalysisDetails(item) {
      this.promptDetailsDialog.show = true;
      this.promptDetailsDialog.item = { ...item };
    },

    // Helper method to parse risk factors JSON array
    getRiskFactorsArray(riskFactors) {
      try {
        if (typeof riskFactors === 'string') {
          return JSON.parse(riskFactors);
        }
        if (Array.isArray(riskFactors)) {
          return riskFactors;
        }
        return [];
      } catch (e) {
        console.error('Error parsing risk factors:', e);
        return [];
      }
    },

    // Policy Violation helper methods
    getViolationTypeColor(violationType) {
      if (!violationType) return 'grey';
      const colorMap = {
        'shadow_ai': 'deep-orange',
        'unauthorized_service': 'red',
        'data_exposure': 'purple',
        'policy_breach': 'error',
        'unauthorized access': 'red',
        'data leakage': 'purple',
        'policy violation': 'error',
        'suspicious activity': 'warning',
        'compliance breach': 'deep-orange',
        'other': 'grey'
      };
      return colorMap[violationType.toLowerCase()] || 'error';
    },

    getViolationTypeIcon(violationType) {
      if (!violationType) return 'mdi-alert';
      const iconMap = {
        'shadow_ai': 'mdi-robot-angry',
        'unauthorized_service': 'mdi-shield-off',
        'data_exposure': 'mdi-database-alert',
        'policy_breach': 'mdi-gavel',
        'unauthorized access': 'mdi-shield-off',
        'data leakage': 'mdi-database-alert',
        'policy violation': 'mdi-gavel',
        'suspicious activity': 'mdi-eye-alert',
        'compliance breach': 'mdi-alert-octagon',
        'other': 'mdi-alert'
      };
      return iconMap[violationType.toLowerCase()] || 'mdi-alert';
    },

    getViolationTypeDisplayName(violationType) {
      if (!violationType) return 'Unknown';
      const displayMap = {
        'shadow_ai': 'Shadow AI',
        'unauthorized_service': 'Unauthorized Service',
        'data_exposure': 'Data Exposure',
        'policy_breach': 'Policy Breach',
        'unauthorized access': 'Unauthorized Access',
        'data leakage': 'Data Leakage',
        'policy violation': 'Policy Violation',
        'suspicious activity': 'Suspicious Activity',
        'compliance breach': 'Compliance Breach',
        'other': 'Other'
      };
      return displayMap[violationType.toLowerCase()] || violationType;
    },

    // Evidence parsing methods
    getEvidenceArray(evidence) {
      try {
        if (typeof evidence === 'string') {
          return JSON.parse(evidence);
        }
        if (Array.isArray(evidence)) {
          return evidence;
        }
        return [];
      } catch (e) {
        console.error('Error parsing evidence:', e);
        return [];
      }
    },

    getEvidenceCount(evidence) {
      return this.getEvidenceArray(evidence).length;
    },

    // Policy Violation Details Modal
    viewViolationDetails(item) {
      this.violationDetailsDialog.show = true;
      this.violationDetailsDialog.item = { ...item };
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
        min_confidence: this.sensitiveExposureFilters.confidenceRange[0] / 100,
        max_confidence: this.sensitiveExposureFilters.confidenceRange[1] / 100
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
        //   console.log("Settings loaded:", response.data);
          if (response.data) {
            this.settingsForm = {
              ...this.settingsForm,
              ...response.data,            
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

      console.log("Settings to save:", this.settingsForm);
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
      this.settingsForm = {
        aiMonitoringEnabled: true,
        dynamicServiceLearning: true,
        aiAnalysisCustomInstructions: ""       
      };
      this.saveSettings();     
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
    },

    // Missing helper methods for template expressions
    getRiskLevelTextColor(riskLevel) {
      if (!riskLevel) return 'white';
      return riskLevel.toLowerCase() === 'low' ? 'black' : 'white';
    },

    getRiskLevelDisplayText(riskLevel) {
      return (riskLevel && riskLevel.toUpperCase()) || 'UNKNOWN';
    },

    // New helper methods for enhanced UI
    getAIServiceIcon(serviceName) {
      if (!serviceName) return 'mdi-robot';
      const serviceMap = {
        'openai': 'mdi-brain',
        'gpt': 'mdi-brain',
        'chatgpt': 'mdi-brain',
        'claude': 'mdi-robot-happy',
        'anthropic': 'mdi-robot-happy',
        'gemini': 'mdi-google',
        'google': 'mdi-google',
        'copilot': 'mdi-microsoft',
        'microsoft': 'mdi-microsoft',
        'bedrock': 'mdi-aws',
        'azure': 'mdi-microsoft-azure',
        'deepseek': 'mdi-magnify',
        'perplexity': 'mdi-magnify-expand',
        'grok': 'mdi-robot-excited',
        'other': 'mdi-robot'
      };
      
      const lowerName = serviceName.toLowerCase();
      for (const [key, icon] of Object.entries(serviceMap)) {
        if (lowerName.includes(key)) {
          return icon;
        }
      }
      return 'mdi-robot';
    },

    getServiceTypeColor(serviceType) {
      if (!serviceType) return 'grey';
      const colorMap = {
        'web': 'blue',
        'desktop': 'green',
        'api': 'purple',
        'browser_extension': 'orange',
        'mobile': 'teal',
        'text generation': 'indigo',
        'code generation': 'green',
        'image generation': 'purple',
        'document analysis': 'blue-grey',
        'translation': 'orange',
        'summarization': 'cyan',
        'chat': 'blue',
        'other': 'grey'
      };
      return colorMap[serviceType.toLowerCase()] || 'grey';
    },

    getServiceTypeIcon(serviceType) {
      if (!serviceType) return 'mdi-cog';
      const iconMap = {
        'web': 'mdi-web',
        'desktop': 'mdi-desktop-tower',
        'api': 'mdi-api',
        'browser_extension': 'mdi-puzzle',
        'mobile': 'mdi-cellphone',
        'text generation': 'mdi-text',
        'code generation': 'mdi-code-braces',
        'image generation': 'mdi-image',
        'document analysis': 'mdi-file-document-outline',
        'translation': 'mdi-translate',
        'summarization': 'mdi-text-box-outline',
        'chat': 'mdi-chat',
        'other': 'mdi-cog'
      };
      return iconMap[serviceType.toLowerCase()] || 'mdi-cog';
    },

    getInteractionCountColor(count) {
      if (!count || count === 0) return 'grey';
      if (count === 1) return 'info';
      if (count <= 5) return 'success';
      if (count <= 20) return 'warning';
      return 'error';
    },

    // Usage Session Details Modal
    viewUsageSessionDetails(item) {
      this.usageSessionDetailsDialog.show = true;
      this.usageSessionDetailsDialog.item = { ...item };
    },

    // Sensitive Exposure Details Modal
    viewSensitiveExposureDetails(item) {
      this.sensitiveExposureDetailsDialog.show = true;
      this.sensitiveExposureDetailsDialog.item = { ...item };
    },

    // Export functionality
    exportSessionData(item) {
      try {
        // Create comprehensive export data
        const exportData = {
          session_info: {
            id: item.id,
            session_id: item.session_id,
            ai_service_name: item.ai_service_name,
            service_type: item.service_type,
            service_url: item.service_url,
            detection_method: item.detection_method,
            detection_confidence: item.detection_confidence,
            first_detected: item.first_detected,
            last_detected: item.last_detected,
            interaction_count: item.interaction_count,
            risk_level: item.risk_level,
            maindomain: item.maindomain
          },
          user_info: item.session ? {
            email: item.session.email,
            device_id: item.session.deviceId,
            device_title: item.session.deviceTitle
          } : null,
          risk_factors: this.getRiskFactorsArray(item.risk_factors),
          metadata: {
            exported_at: new Date().toISOString(),
            exported_by: appData.user?.email || 'System'
          }
        };

        // Create and download file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `ai-session-${item.session_id || item.id}-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showSuccess(this.$t('Session data exported successfully'));
      } catch (error) {
        this.showError(`Export failed: ${error.message}`);
      }
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
      { text: this.$t("Detected"), value: "first_detected", width: "10%" },
      { text: this.$t("User"), value: "user", width: "10%" },
      { text: this.$t("Device"), value: "device", width: "10%" },
      { text: this.$t("AI Service"), value: "ai_service_name", width: "12%" },
      { text: this.$t("Service Type"), value: "service_type", width: "10%" },
      { text: this.$t("Interactions"), value: "interaction_count", width: "8%" },
      { text: this.$t("Duration"), value: "duration", width: "8%" },
      { text: this.$t("Risk Level"), value: "risk_level", width: "8%" },
      { text: this.$t("Session"), value: "session_id", width: "8%" },
      { text: this.$t("Actions"), value: "actions", sortable: false, width: "10%" }
    ];

    this.violationHeaders = [
      { text: this.$t("Detected"), value: "detected_at", width: "10%" },
      { text: this.$t("Violation Type"), value: "violation_type", width: "12%" },
      { text: this.$t("Service Name"), value: "service_name", width: "10%" },
      { text: this.$t("User"), value: "user", width: "10%" },
      { text: this.$t("Risk Level"), value: "risk_level", width: "8%" },
      { text: this.$t("Authorization"), value: "is_authorized", width: "10%" },
      { text: this.$t("Evidence"), value: "evidence", width: "8%" },
      { text: this.$t("Policy Details"), value: "policy_violation_details", width: "15%" },
      { text: this.$t("Session"), value: "session_id", width: "8%" },
      { text: this.$t("Actions"), value: "actions", sortable: false, width: "9%" }
    ];

    this.promptAnalysisHeaders = [
      { text: this.$t("Detected"), value: "detected_at", width: "12%" },
      { text: this.$t("AI Service"), value: "ai_service", width: "10%" },
      { text: this.$t("User"), value: "user", width: "12%" },
      { text: this.$t("Prompt Summary"), value: "prompt_summary", width: "25%" },
      { text: this.$t("Type"), value: "prompt_type", width: "10%" },
      { text: this.$t("Risk"), value: "risk_level", width: "10%" },
      { text: this.$t("Compliance"), value: "policy_compliance", width: "11%" },
      { text: this.$t("Sensitive"), value: "contains_sensitive_data", width: "8%" },
      { text: this.$t("Actions"), value: "actions", sortable: false, width: "12%" }
    ];

    this.sensitiveExposureHeaders = [
      { text: this.$t("Detected"), value: "detected_at", width: "12%" },
      { text: this.$t("Data Type"), value: "data_type", width: "12%" },
      { text: this.$t("AI Service"), value: "ai_service", width: "12%" },
      { text: this.$t("Exposure Method"), value: "exposure_method", width: "12%" },
      { text: this.$t("Risk Level"), value: "risk_level", width: "10%" },
      { text: this.$t("Confidence"), value: "confidence", width: "10%" },
      { text: this.$t("Session"), value: "session_id", width: "10%" },
      { text: this.$t("Actions"), value: "actions", sortable: false, width: "12%" }
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

    // Clean up any old saved data that might have "detected_time" instead of "detected_at"
    if (this.sensitiveExposureOptions && this.sensitiveExposureOptions.sortBy) {
      if (Array.isArray(this.sensitiveExposureOptions.sortBy)) {
        this.sensitiveExposureOptions.sortBy = this.sensitiveExposureOptions.sortBy.map(field => 
          field === 'detected_time' ? 'detected_at' : field
        );
      } else if (this.sensitiveExposureOptions.sortBy === 'detected_time') {
        this.sensitiveExposureOptions.sortBy = 'detected_at';
      }
    }

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
    tab: function () {
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

    selectedDateRange: function () {
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
