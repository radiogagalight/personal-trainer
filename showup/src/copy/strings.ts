/**
 * Every user-facing string lives here so tone can be audited in one place.
 * Tone principles (spec §18):
 *   warm, human, encouraging; never guilt or scold; celebrate showing up;
 *   gentle, optional, curious phrasing for suggestions; empty states invite.
 */

export const strings = {
  app: {
    name: 'Showup',
    tagline: 'Your workout, your pace.',
  },

  themeToggle: {
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
  },

  tabs: {
    today: 'Today',
    plan: 'Plan',
    workouts: 'Workouts',
    library: 'Library',
    progress: 'Progress',
  },

  greeting: {
    morning: (n?: string) => (n ? `Good morning, ${n}` : 'Good morning'),
    afternoon: (n?: string) => (n ? `Good afternoon, ${n}` : 'Good afternoon'),
    evening: (n?: string) => (n ? `Good evening, ${n}` : 'Good evening'),
    line: [
      'Glad you’re here.',
      'Whenever you’re ready.',
      'One step at a time.',
      'No pressure today.',
      'Showing up is the win.',
      'Move how it feels good.',
    ],
  },

  today: {
    startWorkout: 'Start workout',
    restDayTitle: 'Rest day',
    restDayBody:
      'Rest is part of training, not the absence of it. Sleep well, hydrate, stretch if it feels good.',
    nothingPlannedTitle: 'Nothing scheduled today',
    nothingPlannedBody:
      'You can log something you already did, or open the Plan to add a workout.',
    recentTitle: 'Recent activity',
    recentEmpty: 'Your sessions will show up here.',
    logSomething: 'Log something off-plan',
    resumeTitle: 'Pick up where you left off',
    resumeBody: (name: string) => `Your ${name} session is still in progress.`,
    resume: 'Resume session',
    discardResume: 'Discard',
  },

  plan: {
    title: 'Plan',
    weekLabel: (i: number) => `Week ${i + 1}`,
    copyWeek: 'Copy this week forward',
    copyWeekDone: 'Copied to next week',
    assign: 'Assign a workout',
    rest: 'Rest day',
    clear: 'Clear day',
    today: 'Today',
    note: 'Note for this day',
    notePlaceholder: 'Optional — anything you want to remember.',
    nextWeek: 'Next week',
    prevWeek: 'Previous week',
    thisWeek: 'This week',
    missed: {
      title: 'You had a session planned',
      body: 'No worries — pick whatever fits right now. The plan flexes around you.',
      heading: (name: string) => `${name} slipped by earlier this week`,
      reschedule: 'Reschedule it',
      lite: 'Do a lite version now',
      doNow: 'Do it now',
      pickDay: 'Move to another day',
      moveOn: 'Move on',
      notNow: 'Not this time',
      pickDayTitle: 'Move this session to…',
      noOpenDays:
        'No open days left this week — you can reschedule it from the Plan.',
      movedTo: (day: string) => `Moved to ${day}`,
    },
  },

  workouts: {
    title: 'Workouts',
    new: 'New workout',
    empty: 'No workouts yet — build one whenever you’re ready.',
    duplicate: 'Duplicate',
    delete: 'Delete',
    edit: 'Edit',
    start: 'Start',
  },

  builder: {
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Tuesday strength',
    typeLabel: 'Type',
    notesLabel: 'Notes',
    addBlock: 'Add block',
    addExercise: 'Add exercise',
    blockLabel: 'Block label',
    blockMode: 'Block mode',
    fixed: 'Fixed',
    randomized: 'Randomized',
    selectionCount: 'Exercises drawn',
    rounds: 'Rounds',
    targetDuration: 'Target duration (min)',
    estimateLabel: 'Estimated',
    estimateOverride: 'Override (min)',
    deleteBlock: 'Remove block',
    deleteExercise: 'Remove',
    sets: 'Sets',
    reps: 'Reps',
    weight: 'Weight',
    durationSec: 'Duration (s)',
    distance: 'Distance',
    restSec: 'Rest (s)',
    needName: 'Give it a name to save.',
    needBlock: 'Add at least one block with one exercise.',
    saved: 'Workout saved',
    equipmentMissing: (eq: string) => `Needs ${eq}, which isn’t in your kit`,
  },

  library: {
    title: 'Library',
    new: 'New exercise',
    search: 'Search exercises',
    filterTypes: 'Type',
    filterAreas: 'Target',
    filterEquipment: 'Equipment',
    clearFilters: 'Clear filters',
    filters: 'Filters',
    filtersActive: (n: number) => `· ${n} active`,
    empty: 'No matches. Try clearing some filters.',
    nameLabel: 'Name',
    typeLabel: 'Type',
    targetLabel: 'Target areas',
    equipmentLabel: 'Equipment',
    instructionsLabel: 'How to do it',
    instructionsPlaceholder: 'A clear, friendly how-to. One or two paragraphs.',
    videoLabel: 'Video link',
    videoHint: 'Optional. External link.',
    metricsLabel: 'Tracks',
    estimatedLabel: 'Estimated seconds per set',
    delete: 'Delete exercise',
    deleteConfirmTitle: 'Delete this exercise?',
    deleteConfirmBody:
      'It’ll be removed from your library. Existing logs keep their names so your history stays readable.',
    deleteInUse: (n: number) =>
      `Used in ${n} workout${n === 1 ? '' : 's'}. Those slots will be flagged so you can swap or remove them later.`,
    custom: 'Custom',
    save: 'Save exercise',
    saveChanges: 'Save changes',
    loading: 'Loading…',
    duplicated: 'Duplicated',
    removed: 'Removed',
  },

  player: {
    setOf: (i: number, n: number) => `Set ${i} of ${n}`,
    roundOf: (i: number, n: number) => `Round ${i} of ${n}`,
    block: (label: string) => label,
    rest: 'Rest',
    addTime: 'Add 15s',
    subTime: 'Subtract 15s',
    skipRest: 'Skip rest',
    done: 'Done',
    swap: 'Swap',
    skip: 'Skip',
    endEarly: 'End session',
    endEarlyTitle: 'End the session now?',
    endEarlyBody:
      'Everything you’ve done so far will be saved. You showed up — that counts.',
    keepGoing: 'Keep going',
    endNow: 'End now',
    liteMode: 'Lite mode',
    liteModeDesc:
      'A shorter version — fewer rounds and slightly trimmed sets. Same workout, easier load.',
    start: 'Start',
    startLite: 'Start lite',
    targetReps: 'Target reps',
    targetWeight: 'Target weight',
    targetDuration: 'Target',
    actualReps: 'Actual reps',
    actualWeight: 'Weight',
    actualDuration: 'Duration',
    actualDistance: 'Distance',
    nextExercise: 'Next exercise',
    summaryTitle: 'Nice work',
    summaryBody: 'You showed up — that counts.',
    summaryDuration: 'Duration',
    summaryExercises: 'Exercises',
    feelPrompt: 'How did that feel?',
    feelLabels: ['Drained', 'Tough', 'Okay', 'Good', 'Energized'] as const,
    feelNote: 'Anything to remember? (optional)',
    saveAndClose: 'Save & close',
    swapTitle: 'Swap this exercise',
    swapEmpty: 'No good matches in your library yet.',
    randomizedPreview: 'Today’s draw',
    reroll: 'Re-roll',
    lockedIn: 'Locked in for this session',
    equipmentMissing: (eq: string) =>
      `Needs ${eq} you don’t have — swap it or adjust mid-session.`,
  },

  history: {
    title: 'Journal',
    empty:
      'Your sessions will live here. Every one counts — even the short ones.',
    newManual: 'Add session',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete this entry?',
    deleteConfirmBody: 'This removes the log. Your other history is unaffected.',
    feel: 'Felt',
    dateLabel: 'Date',
    typeLabel: 'Type',
    nameLabel: 'Name',
    durationLabel: 'Duration (min)',
    addExercise: 'Add exercise',
    saved: 'Saved',
    chartsTab: 'Charts',
    journalTab: 'Journal',
    loading: 'Loading…',
    saveSession: 'Save session',
    modified: 'Modified',
    swappedIn: 'swapped in',
    skipped: 'Skipped',
  },

  settings: {
    title: 'Settings',
    equipment: 'Owned equipment',
    equipmentHelp: 'Drives library filters and Phase 2 randomization.',
    defaultRest: 'Default rest (sec)',
    units: 'Units',
    weightUnit: 'Weight',
    distanceUnit: 'Distance',
    theme: 'Theme',
    themeOptions: { light: 'Light', dark: 'Dark', system: 'Match system' },
    reminders: 'Daily reminder',
    remindersHelp:
      'A local nudge at the time you choose, while Showup is open or running in the background. It can’t fire when the app is fully closed — your Today screen is the reliable one.',
    reminderTime: 'Time',
    plateau: 'Suggestion sensitivity',
    plateauHelp:
      'How many steady sessions before we gently suggest stepping it up.',
    dataTitle: 'Your data',
    export: 'Export backup',
    exportHelp: 'A single JSON file with everything in your app.',
    importing: 'Importing…',
    import: 'Import backup',
    importHelp:
      'Replaces all current data with the contents of the file. There is no undo, so export first if you’re unsure.',
    importConfirmTitle: 'Replace everything with this backup?',
    importConfirmBody:
      'Your current library, workouts, plan, and journal will be replaced by what’s in the file.',
    importBadFile: 'That file doesn’t look like a Showup backup.',
    importDone: 'Import complete',
    reset: 'Reset app',
    resetHelp:
      'Wipes everything and restores the starter library, workouts, and plan.',
    resetConfirmTitle: 'Reset Showup?',
    resetConfirmBody:
      'All your data will be erased. The starter content will be loaded fresh.',
    resetGo: 'Yes, reset everything',
    cancel: 'Cancel',
    confirm: 'Confirm',
    aboutTitle: 'About',
    aboutBody:
      'Showup is a single-user, offline-first app. Nothing leaves your device unless you export it.',
  },

  onboarding: {
    step1Title: 'Welcome to Showup',
    step1Body:
      'A warm, flexible workout companion. Everything you see is yours to edit — exercises, workouts, plan.',
    step2Title: 'What gear do you have?',
    step2Body: 'You can change this any time.',
    step3Title: 'Units & theme',
    step3Body: 'Set your preferred units and look.',
    step4Title: 'A gentle nudge?',
    step4Body:
      'Optional daily reminder. Skip it for now — you can turn it on in Settings.',
    next: 'Next',
    back: 'Back',
    finish: 'Let’s go',
    skip: 'Skip',
  },

  empty: {
    library: 'No exercises match — try clearing filters or add a new one.',
    workouts: 'No workouts yet. Tap “New workout” to build your first.',
    plan: 'This week is open — assign workouts to any day.',
    history: 'No sessions yet. Whatever you do, it counts.',
  },

  achievements: {
    title: 'Milestones',
    earned: 'Earned',
    locked: 'Coming up',
    catalog: {
      'first-workout': {
        title: 'Day one',
        body: 'You did your first session. That’s the hardest one.',
      },
      'first-strength': {
        title: 'Found your strength',
        body: 'First strength session in the books.',
      },
      'first-cardio': {
        title: 'Heart in motion',
        body: 'First cardio session — keep that rhythm.',
      },
      'first-mobility': {
        title: 'Easy does it',
        body: 'First mobility session. Your future self thanks you.',
      },
      'first-yoga': {
        title: 'Breath & balance',
        body: 'First yoga flow complete.',
      },
      'sessions-10': {
        title: '10 sessions',
        body: 'Ten times you showed up.',
      },
      'sessions-25': {
        title: '25 sessions',
        body: 'A real practice is forming.',
      },
      'sessions-50': {
        title: '50 sessions',
        body: 'Half a hundred. Quietly excellent.',
      },
      'first-month': {
        title: 'First month',
        body: 'A full month of training behind you.',
      },
      'first-custom-workout': {
        title: 'Made it your own',
        body: 'You built a workout from scratch.',
      },
      'first-edit-workout': {
        title: 'Sculptor',
        body: 'You tuned a workout to fit you better.',
      },
      'first-challenge': {
        title: 'Challenge taken',
        body: 'You completed a challenge.',
      },
    },
  },

  challenges: {
    title: 'Challenges',
    accept: 'Accept',
    dismiss: 'Maybe later',
    done: 'Done',
    progress: (a: number, b: number) => `${a} / ${b}`,
    catalog: {
      'three-sessions-week': {
        title: 'Train three times this week',
        body: 'Any kind of session counts — full body, mobility, a short walk.',
        target: 3,
      },
      'one-yoga-week': {
        title: 'Try a yoga session this week',
        body: 'A flow, a few poses, whatever feels right.',
        target: 1,
      },
      'two-cardio-week': {
        title: 'Two cardio sessions this week',
        body: 'Walking, jogging, jump rope — your choice.',
        target: 2,
      },
    },
  },

  progress: {
    title: 'Progress',
    rangeWeek: 'Week',
    rangeMonth: 'Month',
    rangeAll: 'All time',
    sectionConsistency: 'Showing up',
    sectionNumbers: 'Numbers',
    sectionFeel: 'How you’ve felt',
    sectionMetrics: 'Body metrics',
    pickExercise: 'Pick an exercise',
    noData: 'A few more sessions and trends will show here.',
    addMetric: 'Add measurement',
  },

  suggestion: {
    plateauTitle: 'A gentle nudge',
    plateauBody: (name: string) =>
      `You’ve been steady on ${name} — want to try a touch more next time?`,
    plateauAccept: 'Bump it up',
    plateauDismiss: 'Not yet',
    deloadTitle: 'Recovery week?',
    deloadBody:
      'You’ve put in solid weeks. Want to plan an easier week to let things settle?',
  },

  reminders: {
    on: 'Reminder on',
    off: 'Reminder off',
    denied:
      'Notifications are blocked in your browser. Enable them in your browser settings to use reminders.',
    permissionPrompt:
      'Showup needs notification permission to nudge you at your chosen time.',
    permissionDenied:
      'Notifications are off in your browser settings. You can still rely on the Today screen.',
    unsupported:
      'Your browser doesn’t support local reminders. The Today screen is your reliable nudge.',
    body: 'Ready when you are — today’s session is waiting.',
  },

  errors: {
    storageUnavailable:
      'Local storage is unavailable on this device. Your data might not save.',
    quotaExceeded:
      'Storage is full. Export a backup and try clearing old logs.',
    importBadShape: 'That backup file is missing some fields.',
    unknown: 'Something went sideways. Try again?',
  },
} as const;

export type Strings = typeof strings;
