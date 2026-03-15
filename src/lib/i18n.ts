const translations = {
  // --- Nav ---
  'nav.review': { it: 'Ripasso', en: 'Review' },
  'nav.study': { it: 'Studio', en: 'Study' },
  'nav.upload': { it: 'Carica', en: 'Upload' },
  'nav.dashboard': { it: 'Statistiche', en: 'Dashboard' },
  'nav.settings': { it: 'Impostazioni', en: 'Settings' },

  // --- Review page ---
  'review.title': { it: 'Ripasso giornaliero', en: 'Daily Review' },
  'review.dueToday': { it: 'domande da ripassare oggi', en: 'questions due today' },
  'review.startReview': { it: 'Inizia ripasso', en: 'Start Review' },
  'review.allCaughtUp': { it: 'Sei in pari!', en: "You're all caught up!" },
  'review.allCaughtUpDesc': { it: 'Nessuna domanda da ripassare ora. Torna più tardi o carica nuovi appunti.', en: 'No questions are due for review right now. Come back later, or upload new notes to keep learning.' },
  'review.studyTopic': { it: 'Studia un argomento', en: 'Study a topic' },
  'review.uploadNotes': { it: 'Carica appunti', en: 'Upload notes' },

  // --- Study page ---
  'study.title': { it: 'Studio', en: 'Study' },
  'study.selectTopic': { it: 'Seleziona argomento', en: 'Select a topic' },
  'study.countTowardsReview': { it: 'Conta per il ripasso', en: 'Count towards review' },
  'study.questionsInTopic': { it: 'domande in questo argomento', en: 'questions in this topic' },
  'study.startStudying': { it: 'Inizia a studiare', en: 'Start Studying' },
  'study.noTopicsYet': { it: 'Nessun argomento', en: 'No topics yet' },
  'study.noTopicsDesc': { it: 'Carica degli appunti per iniziare a studiare.', en: 'Upload some study notes first to start studying.' },

  // --- Upload page ---
  'upload.title': { it: 'Carica appunti', en: 'Upload Notes' },
  'upload.yourTopics': { it: 'I tuoi argomenti', en: 'Your Topics' },
  'upload.newTopic': { it: 'Nuovo argomento', en: 'New Topic' },
  'upload.topicName': { it: 'Argomento', en: 'Topic' },
  'upload.topicPlaceholder': { it: 'es. Anatomia - Apparato respiratorio', en: 'e.g. Anatomy - Respiratory system' },
  'upload.customInstructions': { it: 'Istruzioni personalizzate', en: 'Custom Instructions' },
  'upload.customInstructionsPlaceholder': { it: 'es. Concentrati sulle applicazioni cliniche', en: 'e.g. Focus on clinical applications' },
  'upload.optional': { it: 'opzionale', en: 'optional' },
  'upload.studyNotes': { it: 'Appunti di studio', en: 'Study Notes' },
  'upload.pasteNotes': { it: 'Incolla qui i tuoi appunti... (markdown supportato)', en: 'Paste your study notes here... (markdown supported)' },
  'upload.preview': { it: 'Anteprima', en: 'Preview' },
  'upload.edit': { it: 'Modifica', en: 'Edit' },
  'upload.nothingToPreview': { it: 'Niente da visualizzare...', en: 'Nothing to preview...' },
  'upload.generateQuestions': { it: 'Genera domande', en: 'Generate Questions' },
  'upload.generating': { it: 'Generazione domande...', en: 'Generating questions...' },
  'upload.generatedQuestions': { it: 'Domande generate', en: 'Generated Questions' },
  'upload.configureProvider': { it: 'Configura un provider LLM nelle Impostazioni per generare domande', en: 'Configure an LLM provider in Settings to generate questions' },
  'upload.questions': { it: 'domande', en: 'questions' },
  'upload.cancel': { it: 'Annulla', en: 'Cancel' },
  'upload.saveSelected': { it: 'Salva {n} domande', en: 'Save {n} questions' },
  'upload.selected': { it: '{n} di {total} selezionate', en: '{n} of {total} selected' },
  'upload.selectAll': { it: 'Seleziona tutte', en: 'Select all' },
  'upload.deselectAll': { it: 'Deseleziona tutte', en: 'Deselect all' },

  // --- PDF ---
  'pdf.dropHere': { it: 'Trascina un PDF qui o clicca per sfogliare', en: 'Drop a PDF here or click to browse' },
  'pdf.extractedBelow': { it: 'Il testo verrà estratto e inserito nell\'editor sotto', en: 'Text will be extracted and placed in the editor below' },
  'pdf.extracting': { it: 'Estrazione testo dal PDF...', en: 'Extracting text from PDF...' },

  // --- Quiz ---
  'quiz.checkAnswer': { it: 'Verifica', en: 'Check Answer' },
  'quiz.check': { it: 'Verifica', en: 'Check' },
  'quiz.typeAnswer': { it: 'Scrivi la risposta...', en: 'Type your answer...' },
  'quiz.listening': { it: 'In ascolto...', en: 'Listening...' },
  'quiz.correctAnswer': { it: 'Risposta corretta:', en: 'Correct answer:' },
  'quiz.correct': { it: 'Corretto!', en: 'Correct!' },
  'quiz.notQuiteRight': { it: 'Non proprio...', en: 'Not quite right' },
  'quiz.howWellDidYouKnow': { it: 'Quanto lo sapevi?', en: 'How well did you know this?' },

  // --- Rating buttons ---
  'rating.again': { it: 'Ripeti', en: 'Again' },
  'rating.againDesc': { it: 'Non ricordavo', en: 'Forgot' },
  'rating.hard': { it: 'Difficile', en: 'Hard' },
  'rating.hardDesc': { it: 'Con fatica', en: 'Struggled' },
  'rating.good': { it: 'Bene', en: 'Good' },
  'rating.goodDesc': { it: 'Con esitazione', en: 'Hesitated' },
  'rating.easy': { it: 'Facile', en: 'Easy' },
  'rating.easyDesc': { it: 'Subito', en: 'Instant' },

  // --- Session summary ---
  'session.complete': { it: 'Sessione completata!', en: 'Session Complete!' },
  'session.greatJob': { it: 'Ottimo lavoro con i tuoi ripassi', en: 'Great job keeping up with your reviews' },
  'session.correct': { it: 'Corrette', en: 'Correct' },
  'session.accuracy': { it: 'Precisione', en: 'Accuracy' },
  'session.time': { it: 'Tempo', en: 'Time' },
  'session.done': { it: 'Fatto', en: 'Done' },

  // --- Dashboard ---
  'dash.title': { it: 'Statistiche', en: 'Dashboard' },
  'dash.reviewedToday': { it: 'Ripassate oggi', en: 'Reviewed today' },
  'dash.accuracy': { it: 'Precisione', en: 'Accuracy' },
  'dash.timeSpent': { it: 'Tempo', en: 'Time spent' },
  'dash.dayStreak': { it: 'Serie giorni', en: 'Day streak' },
  'dash.overallProgress': { it: 'Progresso generale', en: 'Overall Progress' },
  'dash.totalQuestions': { it: 'Domande totali', en: 'Total questions' },
  'dash.overallAccuracy': { it: 'Precisione globale', en: 'Overall accuracy' },
  'dash.topics': { it: 'Argomenti', en: 'Topics' },
  'dash.weakestAreas': { it: 'Aree deboli', en: 'Weakest Areas' },
  'dash.upcomingReviews': { it: 'Prossimi ripassi', en: 'Upcoming Reviews' },
  'dash.studyActivity': { it: 'Attività di studio', en: 'Study Activity' },
  'dash.today': { it: 'Oggi', en: 'Today' },
  'dash.noData': { it: 'Nessun dato. Carica appunti e inizia a ripassare!', en: 'No data yet. Upload notes and start reviewing to see your progress!' },
  'dash.forgot': { it: 'dimenticate', en: 'forgot' },
  'dash.acc': { it: 'prec', en: 'acc' },

  // --- FSRS states ---
  'state.new': { it: 'Nuove', en: 'New' },
  'state.learning': { it: 'In studio', en: 'Learning' },
  'state.review': { it: 'In ripasso', en: 'Review' },
  'state.relearning': { it: 'Da rivedere', en: 'Relearning' },

  // --- Settings ---
  'settings.title': { it: 'Impostazioni', en: 'Settings' },
  'settings.openrouter': { it: 'OpenRouter', en: 'OpenRouter' },
  'settings.openrouterDesc': { it: 'Una API key per tutti i modelli (consigliato)', en: 'One API key for all models (recommended)' },
  'settings.directKey': { it: 'API Key diretta', en: 'Direct API Key' },
  'settings.directKeyDesc': { it: 'Usa la tua chiave OpenAI, Anthropic o Google', en: 'Use your own OpenAI, Anthropic, or Google key' },
  'settings.oauth': { it: 'Login OAuth', en: 'OAuth Login' },
  'settings.oauthDesc': { it: 'Accedi direttamente con OpenAI, Google o Claude. Richiede client ID OAuth. Per la maggior parte degli utenti, OpenRouter è più semplice.', en: 'Sign in directly with OpenAI, Google, or Claude. Requires registering OAuth client IDs. For most users, OpenRouter is easier.' },
  'settings.oauthConfigure': { it: 'Configura i client ID OAuth nel codice sorgente per abilitare.', en: 'Configure OAuth client IDs in the source code to enable.' },
  'settings.connected': { it: 'Connesso', en: 'Connected' },
  'settings.apiKey': { it: 'API Key', en: 'API Key' },
  'settings.model': { it: 'Modello', en: 'Model' },
  'settings.provider': { it: 'Provider', en: 'Provider' },
  'settings.connect': { it: 'Connetti', en: 'Connect' },
  'settings.update': { it: 'Aggiorna', en: 'Update' },
  'settings.preferences': { it: 'Preferenze', en: 'Preferences' },
  'settings.language': { it: 'Lingua', en: 'Language' },
  'settings.languageDesc': { it: 'Per le domande generate', en: 'For generated questions' },
  'settings.theme': { it: 'Tema', en: 'Theme' },
  'settings.dark': { it: 'Scuro', en: 'Dark' },
  'settings.light': { it: 'Chiaro', en: 'Light' },
  'settings.questionsPerGen': { it: 'Domande per generazione', en: 'Questions per generation' },
  'settings.clearAllData': { it: 'Cancella tutti i dati', en: 'Clear all data' },
  'settings.clearConfirmTitle': { it: 'Sei sicuro?', en: 'Are you sure?' },
  'settings.clearConfirmDesc': { it: 'Questo cancellerà permanentemente tutti gli argomenti, domande, cronologia e impostazioni. Non è reversibile.', en: 'This will permanently delete all your topics, questions, review history, and settings. This action cannot be undone.' },
  'settings.deleteEverything': { it: 'Cancella tutto', en: 'Delete everything' },
  'settings.dataManagement': { it: 'Gestione dati', en: 'Data Management' },
  'settings.exportAll': { it: 'Esporta tutti i dati', en: 'Export all data' },
  'settings.exportTopic': { it: 'Seleziona argomento da esportare', en: 'Select topic to export' },
  'settings.importData': { it: 'Importa dati', en: 'Import data' },
  'settings.importPreview': { it: 'Anteprima importazione', en: 'Import preview' },
  'settings.confirmImport': { it: 'Conferma importazione', en: 'Confirm import' },
  'settings.replaceExisting': { it: 'Sostituisci esistenti', en: 'Replace existing' },
  'settings.keepBoth': { it: 'Tieni entrambi', en: 'Keep both' },
  'settings.topicsExist': { it: 'Questi argomenti esistono già:', en: 'These topics already exist:' },
  'settings.importSuccess': { it: 'Dati importati con successo!', en: 'Data imported successfully!' },
  'settings.loadingModels': { it: 'Caricamento modelli...', en: 'Loading models...' },
  'settings.selectModel': { it: 'Seleziona modello', en: 'Select model' },
  'settings.fetchModels': { it: 'Carica modelli', en: 'Fetch models' },
  'settings.noModels': { it: 'Inserisci la API key e clicca "Carica modelli"', en: 'Enter API key and click "Fetch models"' },
  'settings.signInWith': { it: 'Accedi con', en: 'Sign in with' },

  // --- Chat ---
  'chat.socraticTutor': { it: 'Tutor Socratico', en: 'Socratic Tutor' },
  'chat.level': { it: 'Livello', en: 'Level' },
  'chat.tellMe': { it: 'Dimmi cosa non ti è chiaro di questa domanda.', en: 'Tell me what confused you about this question.' },
  'chat.illGuide': { it: 'Ti guiderò a capirlo da solo.', en: "I'll guide you to understand it yourself." },
  'chat.whatConfused': { it: 'Cosa non hai capito?', en: 'What confused you?' },
  'chat.limitReached': { it: 'Limite conversazione raggiunto (20 messaggi)', en: 'Conversation limit reached (20 messages)' },
  'chat.typeResponse': { it: 'Scrivi la tua risposta...', en: 'Type your response...' },
  'chat.helpMeThink': { it: 'Non ho capito, aiutami a ragionare', en: "I don't get it, help me think" },
  'chat.exploreDeeper': { it: 'Vuoi approfondire questo concetto?', en: 'Want to explore this concept deeper?' },

  // --- Common ---
  'common.cancel': { it: 'Annulla', en: 'Cancel' },
  'common.unknown': { it: 'Sconosciuto', en: 'Unknown' },
} as const;

export type TranslationKey = keyof typeof translations;
export type Language = 'it' | 'en';

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}

// Helper for interpolation: t('upload.saveSelected', lang).replace('{n}', '5')
// No need for a complex system — just use .replace()
