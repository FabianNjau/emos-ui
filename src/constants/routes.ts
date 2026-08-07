/** Public route paths */
export const PUBLIC_ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  TOPICS: '/topics',
  TOPIC_PAGE: '/topics/:domain',
  CONCEPT: '/concepts/:slug',
  ASK: '/ask',
  ABOUT: '/about',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
} as const;

/** Admin route paths */
export const ADMIN_ROUTES = {
  HOME: '/admin',
  REVIEW: '/admin/review',
  KNOWLEDGE_GRAPH: '/admin/knowledge-graph',
  SEARCH: '/admin/search',
  CHAT: '/admin/chat',
  CONCEPTS: '/admin/concepts',
} as const;

/** All route paths as a union */
export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];
