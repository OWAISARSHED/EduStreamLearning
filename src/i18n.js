import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      app: { name: 'EduStream', tagline: 'AI-Assisted Learning & Multilingual Mentor Ecosystem' },
      nav: { dashboard: 'Dashboard', forum: 'Forum', resources: 'Resources', profile: 'Profile', notifications: 'Notifications', aiChat: 'AI Chat', aiInsights: 'AI Insights', aiPrompt: 'AI Prompt', logout: 'Logout' },
      auth: { login: 'Sign In', signup: 'Sign Up', email: 'Email Address', password: 'Password', forgotPassword: 'Forgot password?', noAccount: "Don't have an account?", hasAccount: 'Already have an account?' },
      dashboard: { title: 'Student Dashboard', welcome: 'Welcome back, {{name}}!', learningHours: 'Learning Hours', certificates: 'Certificates', weeklyGoal: 'Weekly Goal' },
      forum: { title: 'Discussion Forum', newThread: 'New Thread', search: 'Search threads...', allThreads: 'All Threads' },
      common: { save: 'Save Changes', cancel: 'Cancel', delete: 'Delete', search: 'Search', loading: 'Loading...', error: 'An error occurred' },
    },
  },
  ur: {
    translation: {
      app: { name: 'ایڈواسٹریم', tagline: 'AI معاون تعلیم اور کثیر لسانی رہنما ماحولیاتی نظام' },
      nav: { dashboard: 'ڈیش بورڈ', forum: 'فورم', resources: 'وسائل', profile: 'پروفائل', notifications: 'اطلاعات', aiChat: 'AI چیٹ', aiInsights: 'AI بصیرتیں', aiPrompt: 'AI پرامپٹ', logout: 'لاگ آؤٹ' },
      auth: { login: 'سائن ان', signup: 'سائن اپ', email: 'ای میل پتہ', password: 'پاس ورڈ', forgotPassword: 'پاس ورڈ بھول گئے؟', noAccount: 'اکاؤنٹ نہیں ہے؟', hasAccount: 'پہلے سے اکاؤنٹ ہے؟' },
      dashboard: { title: 'طالب علم ڈیش بورڈ', welcome: 'خوش آمدید، {{name}}!', learningHours: 'سیکھنے کے اوقات', certificates: 'سرٹیفکیٹ', weeklyGoal: 'ہفتہ وار ہدف' },
      forum: { title: 'بحثی فورم', newThread: 'نیا تھریڈ', search: 'تھریڈ تلاش کریں...', allThreads: 'تمام تھریڈ' },
      common: { save: 'تبدیلیاں محفوظ کریں', cancel: 'منسوخ کریں', delete: 'حذف کریں', search: 'تلاش کریں', loading: 'لوڈ ہو رہا ہے...', error: 'ایک خرابی پیش آگئی' },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
