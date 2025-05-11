<template>
  <v-card color="bg" class="pa-4 session-view-root">
    <!-- <v-toolbar color="secondary" dark flat>
      <v-toolbar-title>{{ $t("Session Viewer") }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </v-toolbar> -->
    <v-row class="mt-4" no-gutters style="min-height: 80vh; min-height: 500px;">
      <!-- Main Player Panel -->
      <v-col cols="8" class="d-flex flex-column align-center" style="height: 100%;">
        <div class="player-container">
          <div v-if="loading" class="d-flex align-center justify-center" style="height: 500px;">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="screenshots.length > 0">
            <div class="screenshot-flex-wrapper">
              <div class="screenshot-container" :class="{ 'fullscreen': isFullscreen }">
                <img
                  v-if="screenshotUrl"
                  :src="screenshotUrl"
                  :alt="'Screenshot at ' + formatTime(currentScreenshot.timestamp)"
                  class="session-screenshot"
                  @error="console.warn('Image failed to load', screenshotUrl)"
                />

                <!-- CCTV-like overlay for timestamp and frame counter -->
                <div class="cctv-overlay-top">
                  <div class="cctv-timestamp">{{ currentTimeDisplay }}</div>
                  <div class="cctv-frame-counter">{{ frameCounterDisplay }}</div>
                </div>

                <!-- Recording indicator -->
                <div class="cctv-record-indicator">
                  <div class="record-dot" :class="{ 'recording': playing }"></div>
                  <span>REC</span>
                </div>

                <!-- Expand/Collapse button -->
                <div class="cctv-expand-button" @click="toggleFullscreen">
                  <v-icon dark>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
                </div>

                <!-- CCTV-like overlay for player controls -->
                <div class="cctv-overlay-bottom">
                  <div class="cctv-controls">
                    <v-btn icon dark @click="stepBackward" :disabled="currentScreenshotIdx === 0">
                      <v-icon>mdi-skip-previous</v-icon>
                    </v-btn>
                    <v-btn icon dark @click="togglePlay" :disabled="screenshots.length <= 1">
                      <v-icon v-if="!playing">mdi-play</v-icon>
                      <v-icon v-else>mdi-pause</v-icon>
                    </v-btn>
                    <v-btn icon dark @click="stepForward" :disabled="currentScreenshotIdx === screenshots.length - 1">
                      <v-icon>mdi-skip-next</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="d-flex align-center justify-center" style="height: 500px;">
            <span>{{ $t('No screenshots found for this session.') }}</span>
          </div>
        </div>
      </v-col>
      <!-- Events and Processing Results Panels -->
      <v-col cols="4" class="d-flex flex-column" style="height: 100%;">
        <div class="d-flex flex-column h-100" style="height: 100%; min-height: 500px;">
          <div class="session-metadata-section mt-4">
            <div v-if="sessionMetadata && sessionMetadata.analysis" class="panel-title px-3 mb-2">
              {{ sessionTitle }}
            </div>
            <div v-if="session" class="px-3 mb-3">
              <div class="d-flex align-center mt-2">
                <v-icon small class="mr-1">mdi-laptop</v-icon>
                <span class="subtitle-2">{{ $t('Device') }}: {{ session.deviceTitle }}</span>
              </div>
              <div class="d-flex align-center mt-1">
                <v-icon small class="mr-1">mdi-clock-outline</v-icon>
                <span class="subtitle-2">{{ $t('Duration') }}: {{ formatDuration(session) }}</span>
              </div>
              <div class="d-flex align-center mt-1">
                <v-icon small class="mr-1">mdi-account</v-icon>
                <span class="subtitle-2">{{ $t('User') }}: {{ session.email }}</span>
              </div>
            </div>
            <v-expansion-panels v-if="sessionMetadata && sessionMetadata.analysis" flat>
              <v-expansion-panel class="elevation-1 mb-2">
                <v-expansion-panel-header class="px-4 py-2">
                  <div class="panel-title mb-0">{{ $t('Session Summary') }}</div>
                </v-expansion-panel-header>
                <v-expansion-panel-content class="px-4 py-2">
                  <p class="mt-2 wrap-text">{{ sessionMetadata.analysis.sessionSummary }}</p>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-expansion-panel v-if="sessionMetadata.analysis.potentialSecurityThreats && sessionMetadata.analysis.potentialSecurityThreats.length" class="elevation-1 mb-2">
                <v-expansion-panel-header class="px-4 py-2">
                  <div class="panel-title mb-0 d-flex align-center">
                    {{ $t('Potential Security Threats') }}
                    <v-chip x-small color="red" text-color="white" class="ml-2" v-if="hasHighCriticalThreats">Critical</v-chip>
                    <v-chip x-small color="deep-orange" text-color="white" class="ml-2" v-else-if="hasHighSeverityThreats">High</v-chip>
                    <v-chip x-small color="orange" text-color="white" class="ml-2" v-else-if="hasMediumSeverityThreats">Medium</v-chip>
                    <v-chip x-small color="gray" text-color="black" class="ml-2" v-else>Low</v-chip>
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <div v-for="(threat, idx) in sortedSecurityThreats" :key="'threat-'+idx" class="mb-4 pa-2">
                    <div class="d-flex align-center">
                      <v-chip x-small
                        :color="threatSeverityColor(threat.severity)"
                        :text-color="threat.severity.toLowerCase() === 'low' ? 'black' : 'white'"
                        class="mr-2">
                        {{ threat.severity }}
                      </v-chip>
                      <div class="font-weight-bold">{{ threat.description }}</div>
                    </div>
                    <div class="mt-2 ml-2 wrap-text">{{ threat.justification }}</div>
                    <div v-if="threat.supportingActions && threat.supportingActions.length" class="mt-2 ml-2">
                      <div class="text-caption">Supporting Actions:</div>
                      <ul class="pl-4">
                        <li v-for="(action, actionIdx) in threat.supportingActions" :key="'action-'+idx+'-'+actionIdx" class="text-caption">
                          {{ action }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-expansion-panel v-if="sessionMetadata.analysis.potentialItIssues && sessionMetadata.analysis.potentialItIssues.length" class="elevation-1 mb-2">
                <v-expansion-panel-header class="px-4 py-2">
                  <div class="panel-title mb-0">{{ $t('Potential IT Issues') }}</div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <div v-for="(issue, idx) in sortedItIssues" :key="'issue-'+idx" class="mb-4 pa-2">
                    <div class="d-flex align-center">
                      <v-chip x-small
                        :color="threatSeverityColor(issue.severity)"
                        :text-color="issue.severity.toLowerCase() === 'low' ? 'black' : 'white'"
                        class="mr-2">
                        {{ issue.severity }}
                      </v-chip>
                      <div class="font-weight-bold">{{ issue.description }}</div>
                    </div>
                    <div class="mt-2 ml-2 wrap-text">{{ issue.justification }}</div>
                    <div v-if="issue.supportingActions && issue.supportingActions.length" class="mt-2 ml-2">
                      <div class="text-caption">Supporting Actions:</div>
                      <ul class="pl-4">
                        <li v-for="(action, actionIdx) in issue.supportingActions" :key="'action-'+idx+'-'+actionIdx" class="text-caption">
                          {{ action }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-expansion-panel v-if="sessionMetadata.analysis.overallAssessment" class="elevation-1">
                <v-expansion-panel-header class="px-4 py-2">
                  <div class="panel-title mb-0">{{ $t('Overall Assessment') }}</div>
                </v-expansion-panel-header>
                <v-expansion-panel-content class="px-4 py-2">
                  <p class="mt-2 wrap-text">{{ sessionMetadata.analysis.overallAssessment }}</p>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div style="flex:1"></div>
          <div class="processing-panel">
            <div class="panel-title">{{ $t('Processing Results') }}</div>
            <v-list dense class="processing-list">
              <v-list-item
                v-for="(result, idx) in visibleProcessingResults"
                :key="idx"
                :class="{'active-event': isProcessingActive(result)}"
                :ref="isProcessingActive(result) ? 'activeProcessing' : null"
              >
                <v-list-item-content>
                  <v-list-item-title class="wrap-text">
                    {{ result.action }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatTime(result.timestamp) }}
                  </v-list-item-subtitle>
                  <div v-if="result.intent" class="grey--text text--darken-1">{{ result.intent }}</div>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
.session-view-root {
  min-height: 100vh;
  background: #f8f8f8 !important;
}
.player-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #222;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 1 1 0%;
  padding: 0;
}
.screenshot-flex-wrapper {
  width: 100%;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 0;
}
.screenshot-container {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 0;
  transition: all 0.3s ease;
}
.screenshot-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;
  border-radius: 0;
}
.session-screenshot {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  background: #111;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  display: block;
  transition: all 0.3s ease;
}
.fullscreen .session-screenshot {
  max-height: 95vh;
  border-radius: 0;
}
.fullscreen .cctv-overlay-top {
  top: 20px;
  left: 20px;
}
.fullscreen .cctv-expand-button {
  bottom: 20px;
  right: 20px;
}
.fullscreen .cctv-overlay-bottom {
  bottom: 20px;
}
.cctv-overlay-top {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 10;
}
.cctv-timestamp {
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  font-family: 'Courier New', monospace;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
}
.cctv-frame-counter {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9em;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
}
.cctv-overlay-bottom {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.cctv-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.cctv-controls .v-btn {
  color: #fff !important;
  background: rgba(25, 118, 210, 0.7) !important;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}
.cctv-controls .v-btn:hover {
  background: rgba(25, 118, 210, 0.9) !important;
  transform: scale(1.05);
}
.cctv-controls .v-btn:disabled {
  color: rgba(189, 189, 189, 0.7) !important;
  background: rgba(240, 240, 240, 0.3) !important;
}
.cctv-record-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  z-index: 10;
}
.record-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff3b30;
  margin-right: 5px;
  opacity: 0.5;
}
.record-dot.recording {
  animation: blink 1s infinite;
  opacity: 1;
}
.cctv-record-indicator span {
  color: white;
  font-size: 0.8em;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}
@keyframes scanline {
  0% { top: 0%; }
  100% { top: 100%; }
}
.event-panel, .processing-panel {
  height: 500px;
  overflow-y: auto;
  background: #f8f8f8;
  border-radius: 8px;
  margin-left: 8px;
  margin-right: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.panel-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.1em;
}
.active-event {
  background: #e3f2fd !important;
}
.processing-list .wrap-text {
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
  display: block;
}
.wrap-text {
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
}
.v-expansion-panels {
  background: transparent;
  border-radius: 8px;
  margin-left: 8px;
  margin-right: 8px;
}
.v-expansion-panel {
  background: #f8f8f8 !important;
  margin-bottom: 8px;
  border-radius: 8px !important;
  overflow: hidden;
}
.v-expansion-panel-content__wrap {
  padding: 8px 12px;
}
.v-expansion-panel-header {
  padding: 8px 16px;
  min-height: unset;
}
.v-expansion-panel::before {
  box-shadow: none !important;
}
.session-metadata-section {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.v-expansion-panels,
.v-expansion-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.processing-panel {
  height: 500px;
  overflow-y: auto;
  background: #f8f8f8;
  border-radius: 8px;
  margin-left: 8px;
  margin-right: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.cctv-noise {
  display: none;
}

.cctv-expand-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
}

.cctv-expand-button:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>

<script>
import appData from "../modules/appData";
import appUtils from "../modules/appUtils";
import contextUpdater from "../mixins/contextUpdater";
const moment = require("moment");

export default {
  name: "SessionMonitor",
  mixins: [contextUpdater],
  data() {
    return {
      loading: true,
      session: null,
      screenshots: [],
      events: [],
      processingResults: [],
      currentScreenshotIdx: 0,
      playing: false,
      playTimeout: null,
      updateTimeInterval: null,
      currentTimeDisplay: "",
      appData,
      screenshotBlobs: {}, // cache for blobs
      visibleEvents: [],
      visibleProcessingResults: [],
      sessionMetadata: null,
      hasHighCriticalThreats: false,
      hasHighSeverityThreats: false,
      hasMediumSeverityThreats: false,
      lastFrameChangeTime: null,
      currentFrameStartTime: null,
      isFullscreen: false,
    };
  },
  computed: {
    currentScreenshot() {
      return this.screenshots[this.currentScreenshotIdx] || {};
    },
    sessionTitle() {
      return this.sessionMetadata?.analysis?.sessionTitle || this.$t('Session Details');
    },
    frameCounterDisplay() {
      return `Frame ${this.currentScreenshotIdx + 1} of ${this.screenshots.length}`;
    },
    sortedSecurityThreats() {
      if (!this.sessionMetadata?.analysis?.potentialSecurityThreats) return [];
      return [...this.sessionMetadata.analysis.potentialSecurityThreats].sort((a, b) => {
        const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    sortedItIssues() {
      if (!this.sessionMetadata?.analysis?.potentialItIssues) return [];
      return [...this.sessionMetadata.analysis.potentialItIssues].sort((a, b) => {
        const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    }
  },
  methods: {
    async fetchSession() {
      this.loading = true;

      // Update context with loading state
      this.updateContext({
        view: 'loading',
        sessionId: this.$route.params.id,
        loading: true
      });

      try {
        const id = this.$route.params.id;
        console.log('Fetching session:', id);
        const response = await appUtils.get({ url: `api/memsy-session/${id}` });
        if (response.data && response.data.status !== 0) {
          this.session = response.data;
          this.parseActions(response.data.actions || []);
          this.parseProcessingResults(response.data.processing_results || []);
          this.parseMetadata(response.data.metadata || '{}');
          this.updateBreadcrumb();

          // Update context with session data
          this.updateContext({
            view: 'detail',
            sessionId: id,
            sessionData: {
              id: this.session.id,
              email: this.session.email,
              createdAt: this.session.createdAt,
              deviceTitle: this.session.deviceTitle,
              status: this.session.status,
              sessionTitle: this.sessionTitle,
              screenshotCount: this.screenshots.length,
              processingResultsCount: this.processingResults.length,
              eventsCount: this.events.length,
              duration: this.session.duration,
              securityThreats: this.sessionMetadata?.analysis?.potentialSecurityThreats || [],
              itIssues: this.sessionMetadata?.analysis?.potentialItIssues || [],
              hasHighCriticalThreats: this.hasHighCriticalThreats,
              hasHighSeverityThreats: this.hasHighSeverityThreats,
              hasMediumSeverityThreats: this.hasMediumSeverityThreats
            },
            loading: false
          });
        } else {
          this.session = null;

          // Update context with error
          this.updateContext({
            view: 'error',
            sessionId: id,
            error: 'Failed to fetch session data',
            loading: false
          });
        }
      } catch (e) {
        this.session = null;

        // Update context with error
        this.updateContext({
          view: 'error',
          sessionId: this.$route.params.id,
          error: `Error fetching session: ${e.message}`,
          loading: false
        });
      } finally {
        this.loading = false;
      }
    },
    parseActions(actions) {
      let screenshots = [];
      let events = [];
      actions.forEach(action => {
        let arr = [];
        try {
          arr = JSON.parse(action.action_data);
        } catch (e) { /* ignore parse error */ }
        arr.forEach(ev => {
          ev._action_id = action.id;
          if (ev.type === 'screenshot_full' || ev.type === 'screenshot') {
            screenshots.push(ev);
          } else {
            events.push(ev);
          }
        });
      });
      // Sort screenshots by timestamp ascending
      this.screenshots = screenshots.sort((a, b) => moment(a.timestamp) - moment(b.timestamp));
      // Sort events by timestamp ascending
      this.events = events.sort((a, b) => moment(a.timestamp) - moment(b.timestamp));
      this.currentScreenshotIdx = 0;
    },
    parseProcessingResults(results) {
      let arr = [];
      results.forEach(r => {
        if (r.story) {
          try {
            let story = JSON.parse(r.story);
            if (Array.isArray(story.actions)) {
              arr = arr.concat(story.actions);
            }
          } catch (e) { /* ignore parse error */ }
        }
      });
      // Sort by timestamp ascending
      this.processingResults = arr.sort((a, b) => moment(a.timestamp) - moment(b.timestamp));
    },
    parseMetadata(metadataStr) {
      try {
        console.log('Parsing metadata:', metadataStr);
        console.log('Metadata type:', typeof metadataStr);

        if (typeof metadataStr === 'string' && metadataStr.trim()) {
          this.sessionMetadata = JSON.parse(metadataStr);
          console.log('Parsed metadata:', this.sessionMetadata);
          this.updateThreatSeverities();
          this.updateBreadcrumb();

          // Update context with session analysis data
          if (this.sessionMetadata && this.sessionMetadata.analysis) {
            this.updateContext({
              view: 'metadata',
              sessionId: this.$route.params.id,
              sessionTitle: this.sessionMetadata.analysis.sessionTitle || null,
              sessionSummary: this.sessionMetadata.analysis.sessionSummary || null,
              threatCount: (this.sessionMetadata.analysis.potentialSecurityThreats || []).length,
              issueCount: (this.sessionMetadata.analysis.potentialItIssues || []).length,
              hasHighCriticalThreats: this.hasHighCriticalThreats,
              hasHighSeverityThreats: this.hasHighSeverityThreats,
              hasMediumSeverityThreats: this.hasMediumSeverityThreats,
              overallAssessment: this.sessionMetadata.analysis.overallAssessment || null
            });
          }
        } else if (typeof metadataStr === 'object') {
          this.sessionMetadata = metadataStr;
          console.log('Used object metadata:', this.sessionMetadata);
          this.updateThreatSeverities();
          this.updateBreadcrumb();

          // Update context with session analysis data
          if (this.sessionMetadata && this.sessionMetadata.analysis) {
            this.updateContext({
              view: 'metadata',
              sessionId: this.$route.params.id,
              sessionTitle: this.sessionMetadata.analysis.sessionTitle || null,
              sessionSummary: this.sessionMetadata.analysis.sessionSummary || null,
              threatCount: (this.sessionMetadata.analysis.potentialSecurityThreats || []).length,
              issueCount: (this.sessionMetadata.analysis.potentialItIssues || []).length,
              hasHighCriticalThreats: this.hasHighCriticalThreats,
              hasHighSeverityThreats: this.hasHighSeverityThreats,
              hasMediumSeverityThreats: this.hasMediumSeverityThreats,
              overallAssessment: this.sessionMetadata.analysis.overallAssessment || null
            });
          }
        } else {
          console.log('No valid metadata found');
          this.sessionMetadata = null;

          // Update context with metadata error
          this.updateContext({
            view: 'metadata',
            sessionId: this.$route.params.id,
            error: 'No valid metadata found',
            hasMetadata: false
          });
        }
      } catch (e) {
        console.warn('Failed to parse session metadata:', e);
        this.sessionMetadata = null;

        // Update context with metadata error
        this.updateContext({
          view: 'metadata',
          sessionId: this.$route.params.id,
          error: `Failed to parse metadata: ${e.message}`,
          hasMetadata: false
        });
      }
    },
    updateThreatSeverities() {
      if (!this.sessionMetadata || !this.sessionMetadata.analysis || !this.sessionMetadata.analysis.potentialSecurityThreats) {
        this.hasHighCriticalThreats = false;
        this.hasHighSeverityThreats = false;
        this.hasMediumSeverityThreats = false;
        return;
      }

      this.hasHighCriticalThreats = this.sessionMetadata.analysis.potentialSecurityThreats.some(
        threat => threat.severity === 'Critical'
      );

      this.hasHighSeverityThreats = this.sessionMetadata.analysis.potentialSecurityThreats.some(
        threat => threat.severity === 'High'
      );

      this.hasMediumSeverityThreats = this.sessionMetadata.analysis.potentialSecurityThreats.some(
        threat => threat.severity === 'Medium'
      );
    },
    async getScreenshotUrl(data_key) {
      // If already fetched, return the cached base64 URL
      if (this.screenshotBlobs[data_key]) {
        return this.screenshotBlobs[data_key];
      }
      try {
        const response = await appUtils.get({
          url: `api/memsy-screenshot/${data_key}`,
          responseType: 'blob',
        });
        const blob = response.data;
        console.log('Blob type:', blob.type);
        // If the blob type is not image/png, create a new blob with the correct type
        const pngBlob = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
        const base64Url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(pngBlob);
        });
        this.$set(this.screenshotBlobs, data_key, base64Url);
        return base64Url;
      } catch (e) {
        return '';
      }
    },
    formatTime(ts) {
      return moment(ts).format("YYYY-MM-DD HH:mm:ss");
    },
    formatDuration(item) {
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
    togglePlay() {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
    },
    play() {
      if (this.screenshots.length <= 1) return;
      this.playing = true;

      // Update context when playback starts
      this.updateContext({
        view: 'playing',
        sessionId: this.$route.params.id,
        playbackState: 'playing',
        currentScreenshotIdx: this.currentScreenshotIdx,
        totalScreenshots: this.screenshots.length
      });

      // Reset frame start time
      this.currentFrameStartTime = Date.now();

      // Start the live time update interval when playing
      this.startLiveTimeUpdate();

      const playStep = () => {
        if (!this.playing) return;
        if (this.currentScreenshotIdx < this.screenshots.length - 1) {
          const currentIdx = this.currentScreenshotIdx;
          this.currentScreenshotIdx++;

          // Reset frame start time for the new frame
          this.currentFrameStartTime = Date.now();

          this.updateVisibleLists();
          // Calculate the delay to the next screenshot
          const currentTs = moment(this.screenshots[currentIdx].timestamp);
          const nextTs = moment(this.screenshots[currentIdx + 1].timestamp);
          let delay = nextTs.diff(currentTs);
          // Clamp to a minimum of 200ms and a maximum of 10s for UX
          delay = Math.max(200, Math.min(delay, 10000));
          this.playTimeout = setTimeout(playStep, delay);
        } else {
          this.pause();
        }
      };
      playStep();
    },
    pause() {
      this.playing = false;
      if (this.playTimeout) {
        clearTimeout(this.playTimeout);
        this.playTimeout = null;
      }
      this.stopLiveTimeUpdate();
      this.updateCurrentTimeDisplay();

      // Update context when playback is paused
      this.updateContext({
        view: 'paused',
        sessionId: this.$route.params.id,
        playbackState: 'paused',
        currentScreenshotIdx: this.currentScreenshotIdx,
        totalScreenshots: this.screenshots.length,
        currentTimestamp: this.currentScreenshot.timestamp,
        currentTimeDisplay: this.currentTimeDisplay
      });
    },
    startLiveTimeUpdate() {
      this.updateCurrentTimeDisplay();
      // Update every second
      this.updateTimeInterval = setInterval(() => {
        this.updateCurrentTimeDisplay();
      }, 1000);
    },
    stopLiveTimeUpdate() {
      if (this.updateTimeInterval) {
        clearInterval(this.updateTimeInterval);
        this.updateTimeInterval = null;
      }
    },
    updateCurrentTimeDisplay() {
      if (!this.currentScreenshot || !this.currentScreenshot.timestamp) {
        this.currentTimeDisplay = "";
        return;
      }

      if (this.playing && this.currentScreenshotIdx < this.screenshots.length - 1) {
        // When playing, calculate the current playback timestamp based on actual time progression
        const currentFrameTs = moment(this.currentScreenshot.timestamp);
        const nextFrameTs = moment(this.screenshots[this.currentScreenshotIdx + 1].timestamp);

        // If we don't have a reference start time for this frame, set it now
        if (!this.currentFrameStartTime) {
          this.currentFrameStartTime = Date.now();
        }

        // Calculate time elapsed since this frame started playing
        const elapsedMs = Date.now() - this.currentFrameStartTime;

        // Calculate interpolated timestamp (ensure it doesn't go beyond next frame)
        const interpolatedMs = Math.min(
          currentFrameTs.valueOf() + elapsedMs,
          nextFrameTs.valueOf()
        );

        // Format the interpolated time
        this.currentTimeDisplay = moment(interpolatedMs).format("YYYY-MM-DD HH:mm:ss");
      } else {
        // When not playing, just show the current screenshot time
        this.currentTimeDisplay = this.formatTime(this.currentScreenshot.timestamp);
      }
    },
    stepForward() {
      if (this.currentScreenshotIdx < this.screenshots.length - 1) {
        this.currentScreenshotIdx++;
        this.lastFrameChangeTime = moment();
        this.updateVisibleLists();
        this.updateCurrentTimeDisplay();

        // Update context when stepping forward
        this.updateContext({
          view: 'navigation',
          sessionId: this.$route.params.id,
          action: 'stepForward',
          currentScreenshotIdx: this.currentScreenshotIdx,
          totalScreenshots: this.screenshots.length,
          currentTimestamp: this.currentScreenshot.timestamp,
          currentTimeDisplay: this.currentTimeDisplay
        });
      }
    },
    stepBackward() {
      if (this.currentScreenshotIdx > 0) {
        this.currentScreenshotIdx--;
        this.lastFrameChangeTime = moment();
        this.updateVisibleLists();
        this.updateCurrentTimeDisplay();

        // Update context when stepping backward
        this.updateContext({
          view: 'navigation',
          sessionId: this.$route.params.id,
          action: 'stepBackward',
          currentScreenshotIdx: this.currentScreenshotIdx,
          totalScreenshots: this.screenshots.length,
          currentTimestamp: this.currentScreenshot.timestamp,
          currentTimeDisplay: this.currentTimeDisplay
        });
      }
    },
    updateVisibleLists() {
      const currentTs = this.currentScreenshot.timestamp ? +moment(this.currentScreenshot.timestamp) : 0;
      // Events: only those with timestamp <= current screenshot, sorted descending
      this.visibleEvents = this.events
        .filter(e => e.type !== 'screenshot_full' && e.type !== 'screenshot' && +moment(e.timestamp) <= currentTs)
        .sort((a, b) => +moment(b.timestamp) - +moment(a.timestamp));
      // Processing results: only those with timestamp <= current screenshot, sorted descending
      this.visibleProcessingResults = this.processingResults
        .filter(r => +moment(r.timestamp) <= currentTs)
        .sort((a, b) => +moment(b.timestamp) - +moment(a.timestamp));

      console.log(`visible results: ${this.visibleProcessingResults.length}, currentTs: ${currentTs}`);
      // print the visible results timestamps (5 top values)
      for (let i = 0; i < 5 && i < this.visibleProcessingResults.length; i++) {
        const r = this.visibleProcessingResults[i];
        console.log(`${i}: ${r.timestamp}, number: ${+moment(r.timestamp)}, action: ${r.action}`);
      }

      // If there are active processing results (close to the current timestamp), update the context
      const activeResults = this.visibleProcessingResults.filter(result =>
        Math.abs(moment(result.timestamp) - moment(this.currentScreenshot.timestamp)) < 2000
      );

      if (activeResults.length > 0) {
        this.updateContext({
          view: 'activeProcessing',
          sessionId: this.$route.params.id,
          currentScreenshotIdx: this.currentScreenshotIdx,
          currentTimestamp: this.currentScreenshot.timestamp,
          activeProcessingResults: activeResults.map(r => ({
            action: r.action,
            timestamp: r.timestamp,
            intent: r.intent || null
          }))
        });
      }
    },
    isEventActive(event) {
      // Highlight if event timestamp is close to current screenshot
      if (!this.currentScreenshot) return false;
      return (
        Math.abs(moment(event.timestamp) - moment(this.currentScreenshot.timestamp)) < 2000
      );
    },
    isProcessingActive(result) {
      if (!this.currentScreenshot) return false;
      return (
        Math.abs(moment(result.timestamp) - moment(this.currentScreenshot.timestamp)) < 2000
      );
    },
    threatSeverityColor(severity) {
      if (!severity) return '';

      switch(severity.toLowerCase()) {
        case 'low': return 'gray';
        case 'medium': return 'orange';
        case 'high': return 'deep-orange';
        case 'critical': return 'red';
        default: return '';
      }
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;

      // Add/remove overflow hidden to body to prevent scrolling in fullscreen mode
      if (this.isFullscreen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      // Update context when toggling fullscreen
      this.updateContext({
        view: 'display',
        sessionId: this.$route.params.id,
        action: 'toggleFullscreen',
        isFullscreen: this.isFullscreen,
        currentScreenshotIdx: this.currentScreenshotIdx
      });

      // Force a redraw of the screenshot container
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'));
      });
    },
    updateBreadcrumb() {
      let title = this.sessionTitle;

      // If we don't have a title from metadata but have a session, use email
      if (title === this.$t('Session Details') && this.session && this.session.email) {
        title = `${this.session.email} - ${this.formatTime(this.session.createdAt)}`;
      }

      const bcItems = [
        {
          text: this.appData.productName,
          to: "/",
          disabled: false,
        },
        {
          text: this.$t("Session Monitor"),
          to: "/SessionMonitor",
          disabled: false,
        },
        {
          text: title,
          to: "#",
          disabled: true,
        }
      ];
      this.$emit("updatePage", bcItems);
    },
  },
  watch: {
    currentScreenshot: {
      immediate: true,
      handler: async function(newVal) {
        // console.log('currentScreenshot changed:', newVal);
        if (newVal && newVal.data_key) {
          // this.screenshotUrl = '';
          const url = await this.getScreenshotUrl(newVal.data_key);
          if (url) {
            this.screenshotUrl = url;
            this.$forceUpdate();
            console.log('Loaded screenshot URL:', url);
          } else {
            console.warn('Failed to load screenshot for', newVal.data_key);
          }
          this.updateVisibleLists();
          this.updateCurrentTimeDisplay();
          this.lastFrameChangeTime = moment();
        } else {
          this.screenshotUrl = '';
        }
      }
    }
  },
  created() {
    this.screenshotUrl = '';
    this.visibleEvents = [];
    this.visibleProcessingResults = [];
    this.sessionMetadata = null;
    this.hasHighCriticalThreats = false;
    this.hasHighSeverityThreats = false;
    this.hasMediumSeverityThreats = false;
    this.currentTimeDisplay = "";
    this.lastFrameChangeTime = null;
    this.currentFrameStartTime = null;
    this.isFullscreen = false;

    // Initialize context for SessionView
    this.updateContext({
      view: 'init',
      pageType: 'SessionViewer',
      sessionId: this.$route.params.id,
      features: {
        playback: true,
        fullscreen: true,
        threatDetection: true,
        processingResults: true
      },
      lastInitialized: new Date().toISOString()
    });
  },
  mounted() {
    this.fetchSession();
  },
  beforeDestroy() {
    this.pause();
    this.stopLiveTimeUpdate();
  },
};
</script>