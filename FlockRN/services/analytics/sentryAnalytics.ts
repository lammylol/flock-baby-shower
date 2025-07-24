import * as Sentry from '@sentry/react-native';

export interface SessionData {
  sessionId: string;
  startTime: number;
  phase1StartTime?: number;
  phase1EndTime?: number;
  phase2StartTime?: number;
  phase2EndTime?: number;
  recordingMethod?: 'record' | 'text';
  hasAudio?: boolean;
  transcriptionEdited?: boolean;
  audioPlayed?: boolean;
  prayerSaved?: boolean;
  transcriptionStartTime?: number;
  transcriptionEndTime?: number;
  speechEndTime?: number;
  transcriptionProcessingDuration?: number;
}

export interface UserInteraction {
  action: string;
  component: string;
  function?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

class SentryAnalytics {
  private currentSession: SessionData | null = null;
  private sessionStartTime: number = 0;
  /**
   * Start a new session when user clicks the pray tab
   */
  startNewSession(): void {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
    };
    this.sessionStartTime = Date.now();

    Sentry.addBreadcrumb({
      category: 'session',
      message: 'New prayer session started',
      level: 'info',
      data: {
        sessionId,
        timestamp: this.currentSession.startTime,
      },
    });

    console.log('📊 Analytics: New session started', { sessionId });
  }

  /**
   * Track user's choice between record or text
   */
  trackRecordingMethod(method: 'record' | 'text'): void {
    if (!this.currentSession) {
      this.startNewSession();
    }

    this.currentSession!.recordingMethod = method;
    this.currentSession!.phase1StartTime = Date.now();

    Sentry.addBreadcrumb({
      category: 'user_interaction',
      message: `User chose ${method} method`,
      level: 'info',
      data: {
        sessionId: this.currentSession!.sessionId,
        method,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Recording method chosen', { method });
  }

  /**
   * Track when speech ends (user stops speaking)
   */
  trackSpeechEnd(): void {
    if (!this.currentSession) return;

    this.currentSession.speechEndTime = Date.now();

    Sentry.addBreadcrumb({
      category: 'transcription',
      message: 'Speech ended, processing transcription',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Speech ended, processing transcription');
  }

  /**
   * Track when transcription processing is complete
   */
  trackTranscriptionProcessingComplete(): void {
    if (!this.currentSession) return;

    this.currentSession.transcriptionEndTime = Date.now();

    // Calculate processing duration (time from speech end to transcription complete)
    const processingDuration =
      this.currentSession.transcriptionEndTime -
      (this.currentSession.speechEndTime ||
        this.currentSession.transcriptionEndTime);

    this.currentSession.transcriptionProcessingDuration = processingDuration;

    Sentry.addBreadcrumb({
      category: 'transcription',
      message: 'Transcription processing completed',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        processingDuration,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Transcription processing completed', {
      processingDuration,
    });
  }

  /**
   * Track when transcription starts
   */
  trackTranscriptionStart(): void {
    if (!this.currentSession) return;

    this.currentSession.transcriptionStartTime = Date.now();

    Sentry.addBreadcrumb({
      category: 'transcription',
      message: 'Transcription started',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Transcription started');
  }

  /**
   * Track when transcription ends
   */
  trackTranscriptionEnd(): void {
    if (!this.currentSession) return;

    this.currentSession.transcriptionEndTime = Date.now();
    const duration =
      this.currentSession.transcriptionEndTime -
      (this.currentSession.transcriptionStartTime || Date.now());

    Sentry.addBreadcrumb({
      category: 'transcription',
      message: 'Transcription completed',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        duration,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Transcription completed', { duration });
  }

  /**
   * Track when phase 1 ends (recording/text input complete)
   */
  trackPhase1Complete(): void {
    if (!this.currentSession) return;

    this.currentSession.phase1EndTime = Date.now();
    const duration =
      this.currentSession.phase1EndTime -
      (this.currentSession.phase1StartTime || this.currentSession.startTime);

    Sentry.addBreadcrumb({
      category: 'session_phase',
      message: 'Phase 1 (input) completed',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        duration,
        method: this.currentSession.recordingMethod,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Phase 1 completed', {
      duration,
      method: this.currentSession.recordingMethod,
    });
  }

  /**
   * Track when phase 2 starts (editing prayer)
   */
  trackPhase2Start(): void {
    if (!this.currentSession) return;

    this.currentSession.phase2StartTime = Date.now();

    Sentry.addBreadcrumb({
      category: 'session_phase',
      message: 'Phase 2 (editing) started',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Phase 2 started');
  }

  /**
   * Track when phase 2 ends (prayer saved)
   */
  trackPhase2Complete(): void {
    if (!this.currentSession) return;

    this.currentSession.phase2EndTime = Date.now();
    this.currentSession.prayerSaved = true;

    const phase2Duration =
      this.currentSession.phase2EndTime -
      (this.currentSession.phase2StartTime || Date.now());
    const totalDuration =
      this.currentSession.phase2EndTime - this.currentSession.startTime;

    Sentry.addBreadcrumb({
      category: 'session_phase',
      message: 'Phase 2 (editing) completed',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        phase2Duration,
        totalDuration,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Phase 2 completed', {
      phase2Duration,
      totalDuration,
    });
  }

  /**
   * Track audio playback for recorded prayers
   */
  trackAudioPlayback(): void {
    if (!this.currentSession) return;

    this.currentSession.audioPlayed = true;

    Sentry.addBreadcrumb({
      category: 'audio_interaction',
      message: 'User played audio recording',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Audio playback');
  }

  /**
   * Track transcription editing
   */
  trackTranscriptionEdit(): void {
    if (!this.currentSession) return;

    this.currentSession.transcriptionEdited = true;

    Sentry.addBreadcrumb({
      category: 'user_interaction',
      message: 'User edited transcription',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Transcription edited');
  }

  /**
   * Track general user interactions throughout the app
   */
  trackUserInteraction(
    action: string,
    component: string,
    functionName?: string,
    metadata?: Record<string, unknown>,
  ): void {
    const interaction: UserInteraction = {
      action,
      component,
      function: functionName,
      metadata,
      timestamp: Date.now(),
    };

    Sentry.addBreadcrumb({
      category: 'user_interaction',
      message: `User interaction: ${action}`,
      level: 'info',
      data: {
        ...interaction,
        sessionId: this.currentSession?.sessionId,
      },
    });

    console.log('📊 Analytics: User interaction', interaction);
  }

  /**
   * Track prayer view interactions
   */
  trackPrayerViewInteraction(
    action: 'view' | 'play' | 'refresh' | 'scroll',
    prayerId?: string,
  ): void {
    this.trackUserInteraction(action, 'PrayerView', undefined, { prayerId });
  }

  /**
   * Track journal interactions
   */
  trackJournalInteraction(action: 'view' | 'scroll' | 'refresh'): void {
    this.trackUserInteraction(action, 'PrayerJournal', undefined);
  }

  /**
   * Track function execution for debugging
   */
  trackFunctionExecution(
    functionName: string,
    metadata?: Record<string, unknown>,
  ): void {
    Sentry.addBreadcrumb({
      category: 'function_execution',
      message: `Function executed: ${functionName}`,
      level: 'debug',
      data: {
        functionName,
        metadata,
        sessionId: this.currentSession?.sessionId,
        timestamp: Date.now(),
      },
    });

    console.log('📊 Analytics: Function executed', { functionName, metadata });
  }

  /**
   * Check if there's an active session
   */
  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current session info for debugging
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * End current session and send final analytics
   */
  endSession(): void {
    try {
      if (!this.currentSession) return;

      const totalDuration = Date.now() - this.currentSession.startTime;
      const phase1Duration = this.currentSession.phase1EndTime
        ? this.currentSession.phase1EndTime -
        (this.currentSession.phase1StartTime || this.currentSession.startTime)
        : 0;
      const phase2Duration =
        this.currentSession.phase2EndTime && this.currentSession.phase2StartTime
          ? this.currentSession.phase2EndTime -
          this.currentSession.phase2StartTime
          : 0;
      const transcriptionDuration =
        this.currentSession.transcriptionEndTime &&
          this.currentSession.transcriptionStartTime
          ? this.currentSession.transcriptionEndTime -
          this.currentSession.transcriptionStartTime
          : 0;
      const transcriptionProcessingDuration =
        this.currentSession.transcriptionProcessingDuration || 0;

      // Send session data to Sentry as a log using captureMessage with log level
      Sentry.logger.info('Prayer session completed', {
        tags: {
          sessionType: 'prayer_creation',
          recordingMethod: this.currentSession.recordingMethod || 'unknown',
          hasAudio: this.currentSession.hasAudio || false,
          transcriptionEdited: this.currentSession.transcriptionEdited || false,
          audioPlayed: this.currentSession.audioPlayed || false,
          prayerSaved: this.currentSession.prayerSaved || false,
        },
        contexts: {
          session: {
            sessionId: this.currentSession.sessionId,
            totalDuration,
            phase1Duration,
            phase2Duration,
            transcriptionDuration,
            transcriptionProcessingDuration,
            startTime: this.currentSession.startTime,
            endTime: Date.now(),
          },
        },
      });

      console.log('📊 Analytics: Session ended', {
        sessionId: this.currentSession.sessionId,
        totalDuration,
        phase1Duration,
        phase2Duration,
        transcriptionDuration,
        transcriptionProcessingDuration,
        recordingMethod: this.currentSession.recordingMethod,
        hasAudio: this.currentSession.hasAudio,
        transcriptionEdited: this.currentSession.transcriptionEdited,
        audioPlayed: this.currentSession.audioPlayed,
        prayerSaved: this.currentSession.prayerSaved,
      });

      this.currentSession = null;
    } catch (error) {
      console.error('📊 Analytics: Error ending session', error);
    }
  }
}

// Export singleton instance
export const sentryAnalytics = new SentryAnalytics();
