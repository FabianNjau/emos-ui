import { create } from 'zustand';

export interface ContextState {
  budget: string;
  audience: string;
  productType: string;
  location: string;
  objective: string;
  stage: string;
  completenessScore: number;
  setDimension: (key: keyof Omit<ContextState, 'completenessScore' | 'setDimension' | 'reset'>, value: string) => void;
  autoDetectFromQuestion: (question: string) => void;
  reset: () => void;
}

const EMPTY = '';

const DIMENSION_KEYS = ['budget', 'audience', 'productType', 'location', 'objective', 'stage'] as const;

function score(s: ContextState): number {
  return DIMENSION_KEYS.filter(k => s[k] !== EMPTY).length;
}

/** Lightweight keyword detection from question text */
function autoDetect(question: string): Partial<Pick<ContextState, 'budget' | 'audience' | 'productType' | 'location' | 'objective' | 'stage'>> {
  const q = question.toLowerCase();
  const detected: Partial<ReturnType<typeof autoDetect>> = {};

  // Budget
  if (/\b(no budget|zero budget|tight budget|small budget|little budget|low budget|cheap|afford)\b/.test(q)) detected.budget = 'Low';
  else if (/\b(medium budget|moderate|some budget)\b/.test(q)) detected.budget = 'Medium';
  else if (/\b(high budget|large budget|big budget|premium)\b/.test(q)) detected.budget = 'High';

  // Audience
  if (/\b(b2b|business|businessto|enterprise|corporate|companies)\b/.test(q)) detected.audience = 'B2B';
  else if (/\b(b2c|consumer|individual|personal|customers)\b/.test(q)) detected.audience = 'B2C';
  else if (/\b(b2g|government|public sector)\b/.test(q)) detected.audience = 'B2G';

  // Product / service type
  if (/\b(restaurant|cafe|food|cafe|eatery|catering)\b/.test(q)) detected.productType = 'Restaurant/Food';
  else if (/\b(clothing|fashion|apparel|garment|textile)\b/.test(q)) detected.productType = 'Fashion';
  else if (/\b(software|saas|app|tech|platform)\b/.test(q)) detected.productType = 'SaaS/Tech';
  else if (/\b(service|consult|consulting|agency)\b/.test(q)) detected.productType = 'Service';
  else if (/\b(retail|shop|store|ecommerce)\b/.test(q)) detected.productType = 'Retail';

  // Location
  if (/\b(kenya|nairobi|mombasa|lamu| africa|african)\b/.test(q)) detected.location = 'Kenya';
  else if (/\b(nigeria|lagos|ghana|accra|dar es salaam)\b/.test(q)) detected.location = 'East/West Africa';
  else if (/\b(europe|germany|uk|london|france|paris)\b/.test(q)) detected.location = 'Europe';
  else if (/\b(us|usa|america|united states)\b/.test(q)) detected.location = 'USA';
  else if (/\b(online|digital|internet)\b/.test(q)) detected.location = 'Online/Digital';

  // Objective
  if (/\b(increase sales|more sales|grow sales|revenue|boost sales)\b/.test(q)) detected.objective = 'Increase sales';
  else if (/\b(brand|awareness|brand awareness|visibility|recognition)\b/.test(q)) detected.objective = 'Brand awareness';
  else if (/\b(customer|acquir|get customers|new customers)\b/.test(q)) detected.objective = 'Customer acquisition';
  else if (/\b(retain|retention|keep customers|loyalty)\b/.test(q)) detected.objective = 'Customer retention';
  else if (/\b(launch|new product|pre-launch|going live)\b/.test(q)) detected.objective = 'Product launch';

  // Stage
  if (/\b(startup|new business|fresh|just starting|just launched|launching)\b/.test(q)) detected.stage = 'Pre-launch / Early';
  else if (/\b(scaling|scale up|growth|grown|expanding)\b/.test(q)) detected.stage = 'Scaling';
  else if (/\b(established|established business|mature|legacy)\b/.test(q)) detected.stage = 'Established';

  return detected;
}

const INIT: Omit<ContextState, 'completenessScore' | 'setDimension' | 'autoDetectFromQuestion' | 'reset'> = {
  budget: EMPTY,
  audience: EMPTY,
  productType: EMPTY,
  location: EMPTY,
  objective: EMPTY,
  stage: EMPTY,
};

export const useContextStore = create<ContextState>((set) => ({
  ...INIT,
  completenessScore: 0,

  setDimension: (key, value) =>
    set((s) => {
      const next = { ...s, [key]: value };
      return { ...next, completenessScore: score(next) };
    }),

  autoDetectFromQuestion: (question) =>
    set((s) => {
      const detected = autoDetect(question);
      const next = { ...s, ...detected };
      return { ...next, completenessScore: score(next) };
    }),

  reset: () => set({ ...INIT, completenessScore: 0 }),
}));
