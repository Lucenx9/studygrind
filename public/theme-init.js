try {
  var rawSettings = localStorage.getItem('studygrind_settings');
  var parsedSettings = rawSettings ? JSON.parse(rawSettings) : null;
  var theme = parsedSettings && typeof parsedSettings === 'object' ? parsedSettings.theme : null;
  var language = parsedSettings && typeof parsedSettings === 'object' ? parsedSettings.language : null;

  document.documentElement.lang = language === 'en' ? 'en' : 'it';
  if (theme !== 'light') {
    document.documentElement.classList.add('dark');
  }
} catch (e) {
  document.documentElement.lang = 'it';
  document.documentElement.classList.add('dark');
}
