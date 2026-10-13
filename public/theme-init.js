// Aplica o tema salvo antes do primeiro paint (evita flash de tema errado).
// Arquivo externo — e não <script> inline no index.html — para que a CSP em
// public/_headers possa usar script-src 'self' sem 'unsafe-inline'.
;(function () {
  try {
    var theme = window.localStorage.getItem('soucriala:theme')
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.classList.add(theme)
    }
  } catch {}
})()
