import { createContext, useContext } from 'react';

export type Lang = 'en' | 'es' | 'fr';
export const LOCALES: Record<Lang, string> = { en: 'en-US', es: 'es-MX', fr: 'fr-FR' };
const I: Record<Lang, number> = { en: 0, es: 1, fr: 2 };

// [English, Español, Français]
const D: Record<string, [string, string, string]> = {
  morning: ['Good morning, boss.', 'Buenos días, jefe.', 'Bonjour, patron.'],
  afternoon: ['Good afternoon, boss.', 'Buenas tardes, jefe.', 'Bon après-midi, patron.'],
  evening: ['Good evening, boss.', 'Buenas noches, jefe.', 'Bonsoir, patron.'],
  home: ['Home', 'Inicio', 'Accueil'], chat: ['Chat', 'Chat', 'Chat'],
  calendar: ['Calendar', 'Calendario', 'Calendrier'], learn: ['Learn', 'Aprender', 'Apprendre'],
  focus: ['Focus', 'Enfoque', 'Concentration'],
  ask: ['Ask Jarvis', 'Pregúntale a Jarvis', 'Demande à Jarvis'],
  placeholder: ['Type or speak. English o español.', 'Escribe o habla. Español, English o français.', 'Écris ou parle. Français, English ou español.'],
  send: ['Send', 'Enviar', 'Envoyer'], mic: ['Mic', 'Micrófono', 'Micro'], stop: ['Stop', 'Detener', 'Arrêter'],
  auto: ['Auto', 'Auto', 'Auto'], compare: ['Compare 3', 'Comparar 3', 'Comparer 3'],
  use: ['Use this answer', 'Usar esta respuesta', 'Utiliser cette réponse'],
  yes: ['Yes boss. Ask me anything, or tap a quick action.', 'Sí, jefe. Pregúntame lo que quieras o toca una acción rápida.', 'Oui, patron. Demande-moi ce que tu veux ou touche une action rapide.'],
  c1: ['What’s on my calendar this week?', '¿Qué tengo en mi calendario esta semana?', 'Qu’est-ce que j’ai dans mon calendrier cette semaine ?'],
  c2: ['Plan my day in 5 steps', 'Planea mi día en 5 pasos', 'Planifie ma journée en 5 étapes'],
  c3: ['Quiz me in French', 'Hazme un quiz en francés', 'Fais-moi un quiz en français'],
  c4: ['Explain async/await simply', 'Explícame async/await de forma simple', 'Explique async/await simplement'],
  c5: ['Pitch my smart glasses idea', 'Presenta mi idea de lentes inteligentes', 'Présente mon idée de lunettes intelligentes'],
  errGeneric: ['Something went wrong. Try again.', 'Algo salió mal. Intenta de nuevo.', 'Une erreur s’est produite. Réessaie.'],
  missions: ['Missions', 'Misiones', 'Missions'], addMission: ['Add a mission', 'Agrega una misión', 'Ajoute une mission'],
  add: ['Add', 'Agregar', 'Ajouter'], remove: ['Remove', 'Quitar', 'Retirer'],
  noMissions: ['No missions yet. Add the first one.', 'Aún no hay misiones. Agrega la primera.', 'Pas encore de missions. Ajoute la première.'],
  today: ['Today', 'Hoy', 'Aujourd’hui'], addEvent: ['Add an event', 'Agrega un evento', 'Ajoute un événement'],
  nothing: ['Nothing planned. Add an event above.', 'No hay nada planeado. Agrega un evento arriba.', 'Rien de prévu. Ajoute un événement ci-dessus.'],
  prev: ['Previous month', 'Mes anterior', 'Mois précédent'], next: ['Next month', 'Mes siguiente', 'Mois suivant'],
  time: ['Time', 'Hora', 'Heure'],
  lab: ['Language lab', 'Laboratorio de idiomas', 'Labo de langues'], newQuiz: ['New quiz', 'Nuevo quiz', 'Nouveau quiz'],
  french: ['French', 'Francés', 'Français'], english: ['English', 'Inglés', 'Anglais'],
  labHint: ['Pick a language and get a fresh 3-question quiz every time.', 'Elige un idioma y recibe un quiz nuevo de 3 preguntas cada vez.', 'Choisis une langue et reçois un nouveau quiz de 3 questions à chaque fois.'],
  preparing: ['Preparing your quiz…', 'Preparando tu quiz…', 'Préparation de ton quiz…'],
  quizFail: ['Couldn’t build the quiz. Try again.', 'No pude crear el quiz. Intenta de nuevo.', 'Impossible de créer le quiz. Réessaie.'],
  score: ['Score', 'Puntaje', 'Score'],
  start: ['Start', 'Iniciar', 'Démarrer'], pause: ['Pause', 'Pausa', 'Pause'], reset: ['Reset', 'Reiniciar', 'Réinitialiser'],
  break: ['Break', 'Descanso', 'Repos'],
  done: ['Session complete, boss. Take a break.', 'Sesión terminada, jefe. Toma un descanso.', 'Session terminée, patron. Fais une pause.'],
  synced: ['Synced', 'Sincronizado', 'Synchronisé'], models: ['3 models', '3 modelos', '3 modèles'],
  signout: ['Sign out', 'Cerrar sesión', 'Se déconnecter'], email: ['Email', 'Correo', 'E-mail'],
  magic: ['Send magic link', 'Enviar enlace mágico', 'Envoyer le lien magique'],
  check: ['Check your email for the sign-in link.', 'Revisa tu correo para entrar.', 'Vérifie ton e-mail pour te connecter.'],
  setup: ['Add your Supabase URL and anon key to .env.local (see README).', 'Agrega tu URL y anon key de Supabase en .env.local (ver README).', 'Ajoute l’URL et la clé anon de Supabase dans .env.local (voir README).'],
};

export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function useI18n() {
  const { lang, setLang } = useContext(LangCtx);
  const t = (k: string) => D[k]?.[I[lang]] ?? k;
  return { lang, setLang, t, locale: LOCALES[lang] };
}
