export const FIXED_EPOCH = Date.UTC(2025, 0, 15, 12, 0, 0);
export const TEST_RUNTIME_STORAGE_KEY = "route-ledger:test-runtime:v1";

export type TestRole = "user" | "admin";
export type DomainErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "OFFLINE";

export interface SerializedDomainError {
  data: {
    code: DomainErrorCode;
    message: string;
  };
}

export interface MockClerkUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string };
}

export interface MockAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: MockClerkUser | null;
}

export interface TestUser {
  _id: string;
  _creationTime: number;
  clerkId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  role: TestRole;
  preferences: {
    theme: "light" | "dark" | "system";
    defaultPriority: "low" | "medium" | "high" | "essential";
    autoSave: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface TestList {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  isPublic: boolean;
  tags?: string[];
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TestCategory {
  _id: string;
  _creationTime: number;
  listId: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TestItem {
  _id: string;
  _creationTime: number;
  categoryId: string;
  name: string;
  quantity: number;
  packed: boolean;
  priority: string;
  notes?: string;
  description?: string;
  weight?: number;
  tags?: string[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TestTemplateItem {
  name: string;
  quantity: number;
  packed: false;
  priority: string;
  notes?: string;
  description?: string;
  weight?: number;
  tags: string[];
  order: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface TestTemplateCategory {
  name: string;
  color?: string;
  icon?: string;
  order: number;
  collapsed: boolean;
  createdAt?: number;
  updatedAt?: number;
  items: TestTemplateItem[];
}

export interface TestTemplate {
  _id: string;
  _creationTime: number;
  name: string;
  description: string;
  category?: string;
  difficulty?: string;
  season?: string;
  duration?: string;
  tags?: string[];
  isPublic: boolean;
  isOfficial?: boolean;
  createdBy?: string;
  usageCount?: number;
  rating?: number;
  createdAt: number;
  updatedAt: number;
  categories: TestTemplateCategory[];
}

export interface TestLegacyImport {
  sourceKey: string;
  fingerprint: string;
  listsImported: number;
  templatesImported: number;
}

export interface TestPwaState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateRequested: boolean;
  reloadRequested: boolean;
}

export interface TestRuntimeState {
  auth: MockAuthState;
  users: TestUser[];
  lists: TestList[];
  categories: TestCategory[];
  items: TestItem[];
  templates: TestTemplate[];
  legacyImports: TestLegacyImport[];
  pwa: TestPwaState;
  counters: {
    list: number;
    category: number;
    item: number;
    template: number;
  };
  logicalTime: number;
}

export interface TestScenario extends TestRuntimeState {
  scenarioId?: string;
  loadingQueries?: string[];
  queryErrors?: Record<string, SerializedDomainError>;
  mutationErrors?: Record<string, SerializedDomainError>;
  adminFixtures?: {
    userStats: {
      totalUsers: number;
      activeUsers: number;
      newUsersThisMonth: number;
      inactiveUsers: number;
    };
    usage: {
      overview: {
        totalUsers: number;
        totalLists: number;
        totalTemplates: number;
        totalCategories: number;
        totalItems: number;
        completionRate: number;
        avgItemsPerList: number;
      };
      userActivity: {
        inactive: number;
        low: number;
        medium: number;
        high: number;
      };
      topMetrics: unknown[];
      templateUsage: { totalUsage: number; averageUsage: number };
    };
  };
}

interface PersistedRuntime {
  scenarioId?: string;
  state: TestRuntimeState;
  loadingQueries: string[];
  queryErrors: Record<string, SerializedDomainError>;
  mutationErrors: Record<string, SerializedDomainError>;
  adminFixtures?: TestScenario["adminFixtures"];
}

export interface TestRuntimeOptions {
  storage?: Storage;
}

export interface TestRuntime {
  query(name: string, args?: unknown): unknown;
  mutate(name: string, args?: unknown): Promise<unknown>;
  subscribe(listener: () => void): () => void;
  getVersion(): number;
  getScenarioId(): string | undefined;
  getState(): TestRuntimeState;
  getPwaState(): Readonly<TestPwaState>;
  resolveQuery(name: string): void;
  setAuth(auth: MockAuthState): void;
  setPwaState(state: Partial<TestPwaState>): void;
  requestServiceWorkerUpdate(reloadPage?: boolean): Promise<void>;
}

export interface TestRuntimeControl {
  getScenarioId(): string | undefined;
  resolveQuery(name: string): void;
  setAuth(auth: MockAuthState): void;
}

const TEST_USER_ID = "user_test";
const TEST_CLERK_ID = "clerk_test_user";
const FOREIGN_USER_ID = "user_foreign";

export const fixtureIds = {
  user: TEST_USER_ID,
  foreignUser: FOREIGN_USER_ID,
  list: "list_alpine",
  completedList: "list_completed",
  foreignList: "list_foreign",
  clothing: "category_clothing",
  documents: "category_documents",
  jacket: "item_jacket",
  socks: "item_socks",
  passport: "item_passport",
  tickets: "item_tickets",
  publicTemplate: "template_weekend",
  ownedTemplate: "template_conference",
  foreignPrivateTemplate: "template_foreign_private",
} as const;

export function createDomainError(
  code: DomainErrorCode,
  message: string,
): Error & SerializedDomainError {
  return Object.assign(new Error(message), { data: { code, message } });
}

export function isAllowedHttpRequest(requestUrl: string, appOrigin: string) {
  const url = new URL(requestUrl);
  return /^https?:$/.test(url.protocol) && url.origin === new URL(appOrigin).origin;
}

function throwDomainError(error: SerializedDomainError): never {
  throw createDomainError(error.data.code, error.data.message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function testUser(role: TestRole = "user"): TestUser {
  return {
    _id: TEST_USER_ID,
    _creationTime: FIXED_EPOCH - 10_000,
    clerkId: TEST_CLERK_ID,
    name: "Route Ledger Tester",
    email: "tester@example.com",
    role,
    preferences: {
      theme: "system",
      defaultPriority: "medium",
      autoSave: true,
    },
    createdAt: FIXED_EPOCH - 10_000,
    updatedAt: FIXED_EPOCH - 10_000,
  };
}

function foreignUser(): TestUser {
  return {
    ...testUser("user"),
    _id: FOREIGN_USER_ID,
    clerkId: "clerk_foreign_user",
    name: "Foreign Owner",
    email: "foreign@example.com",
  };
}

export function signedOutAuth(): MockAuthState {
  return { isLoaded: true, isSignedIn: false, user: null };
}

export function signedInAuth(): MockAuthState {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: TEST_CLERK_ID,
      fullName: "Route Ledger Tester",
      firstName: "Route",
      lastName: "Tester",
      imageUrl: "https://example.invalid/test-user.png",
      primaryEmailAddress: { emailAddress: "tester@example.com" },
    },
  };
}

export function loadingAuth(): MockAuthState {
  return { isLoaded: false, isSignedIn: false, user: null };
}

export function unavailableAuth(): MockAuthState {
  return { isLoaded: false, isSignedIn: false, user: null };
}

function baseLists(): TestList[] {
  return [
    {
      _id: fixtureIds.list,
      _creationTime: FIXED_EPOCH - 9_000,
      userId: TEST_USER_ID,
      name: "Alpine weekend",
      description: "Cold-weather packing manifest",
      isTemplate: false,
      isPublic: false,
      tags: ["mountains", "winter"],
      createdAt: FIXED_EPOCH - 9_000,
      updatedAt: FIXED_EPOCH - 1_000,
    },
    {
      _id: fixtureIds.completedList,
      _creationTime: FIXED_EPOCH - 8_000,
      userId: TEST_USER_ID,
      name: "City conference",
      description: "Completed business route",
      isTemplate: false,
      isPublic: false,
      tags: ["business"],
      completedAt: FIXED_EPOCH - 500,
      createdAt: FIXED_EPOCH - 8_000,
      updatedAt: FIXED_EPOCH - 500,
    },
    {
      _id: fixtureIds.foreignList,
      _creationTime: FIXED_EPOCH - 7_000,
      userId: FOREIGN_USER_ID,
      name: "Foreign private route",
      description: "Must never appear in another tenant's query",
      isTemplate: false,
      isPublic: false,
      tags: ["private"],
      createdAt: FIXED_EPOCH - 7_000,
      updatedAt: FIXED_EPOCH - 7_000,
    },
  ];
}

function baseCategories(): TestCategory[] {
  return [
    {
      _id: fixtureIds.clothing,
      _creationTime: FIXED_EPOCH - 6_000,
      listId: fixtureIds.list,
      name: "Clothing",
      color: "#2457d6",
      icon: "shirt",
      order: 0,
      collapsed: false,
      createdAt: FIXED_EPOCH - 6_000,
      updatedAt: FIXED_EPOCH - 1_000,
    },
    {
      _id: fixtureIds.documents,
      _creationTime: FIXED_EPOCH - 5_000,
      listId: fixtureIds.list,
      name: "Documents",
      color: "#d66b24",
      icon: "file-text",
      order: 1,
      collapsed: false,
      createdAt: FIXED_EPOCH - 5_000,
      updatedAt: FIXED_EPOCH - 1_000,
    },
    {
      _id: "category_conference",
      _creationTime: FIXED_EPOCH - 4_000,
      listId: fixtureIds.completedList,
      name: "Work",
      order: 0,
      collapsed: false,
      createdAt: FIXED_EPOCH - 4_000,
      updatedAt: FIXED_EPOCH - 500,
    },
    {
      _id: "category_foreign",
      _creationTime: FIXED_EPOCH - 3_000,
      listId: fixtureIds.foreignList,
      name: "Foreign category",
      order: 0,
      collapsed: false,
      createdAt: FIXED_EPOCH - 3_000,
      updatedAt: FIXED_EPOCH - 3_000,
    },
  ];
}

function baseItems(): TestItem[] {
  const item = (
    _id: string,
    categoryId: string,
    name: string,
    order: number,
    packed: boolean,
    priority: string,
    quantity = 1,
  ): TestItem => ({
    _id,
    _creationTime: FIXED_EPOCH - 3_000 + order,
    categoryId,
    name,
    quantity,
    packed,
    priority,
    order,
    createdAt: FIXED_EPOCH - 3_000 + order,
    updatedAt: FIXED_EPOCH - 1_000,
  });

  return [
    item(fixtureIds.jacket, fixtureIds.clothing, "Insulated jacket", 0, false, "essential"),
    item(fixtureIds.socks, fixtureIds.clothing, "Wool socks", 1, true, "high", 3),
    item(fixtureIds.passport, fixtureIds.documents, "Passport", 0, false, "essential"),
    item(fixtureIds.tickets, fixtureIds.documents, "Train tickets", 1, true, "medium", 2),
    item("item_laptop", "category_conference", "Laptop", 0, true, "essential"),
    item("item_foreign", "category_foreign", "Foreign item", 0, false, "low"),
  ];
}

function templateItem(
  name: string,
  priority: string,
  order: number,
  quantity = 1,
): TestTemplateItem {
  return {
    name,
    quantity,
    packed: false,
    priority,
    tags: [],
    order,
    createdAt: FIXED_EPOCH - 2_000,
    updatedAt: FIXED_EPOCH - 2_000,
  };
}

function baseTemplates(): TestTemplate[] {
  return [
    {
      _id: fixtureIds.publicTemplate,
      _creationTime: FIXED_EPOCH - 2_000,
      name: "Weekend Getaway",
      description: "A public two-day city packing plan",
      category: "travel",
      difficulty: "beginner",
      season: "all",
      duration: "2 days",
      tags: ["weekend", "city"],
      isPublic: true,
      isOfficial: true,
      createdBy: FOREIGN_USER_ID,
      usageCount: 7,
      rating: 5,
      createdAt: FIXED_EPOCH - 2_000,
      updatedAt: FIXED_EPOCH - 2_000,
      categories: [
        {
          name: "Clothing",
          order: 0,
          collapsed: false,
          items: [
            templateItem("T-shirts", "high", 0, 2),
            templateItem("Walking shoes", "essential", 1),
          ],
        },
        {
          name: "Essentials",
          order: 1,
          collapsed: false,
          items: [templateItem("Phone charger", "essential", 0)],
        },
      ],
    },
    {
      _id: fixtureIds.ownedTemplate,
      _creationTime: FIXED_EPOCH - 1_500,
      name: "Conference Kit",
      description: "Private reusable plan for conferences",
      category: "business",
      difficulty: "intermediate",
      season: "all",
      duration: "3 days",
      tags: ["business"],
      isPublic: false,
      isOfficial: false,
      createdBy: TEST_USER_ID,
      usageCount: 2,
      rating: 0,
      createdAt: FIXED_EPOCH - 1_500,
      updatedAt: FIXED_EPOCH - 1_500,
      categories: [
        {
          name: "Work",
          order: 0,
          collapsed: false,
          items: [templateItem("Laptop", "essential", 0)],
        },
      ],
    },
    {
      _id: fixtureIds.foreignPrivateTemplate,
      _creationTime: FIXED_EPOCH - 1_000,
      name: "Hidden private expedition",
      description: "Must remain hidden from the current user",
      category: "outdoor",
      difficulty: "advanced",
      season: "winter",
      duration: "7 days",
      tags: ["private"],
      isPublic: false,
      isOfficial: false,
      createdBy: FOREIGN_USER_ID,
      usageCount: 0,
      rating: 0,
      createdAt: FIXED_EPOCH - 1_000,
      updatedAt: FIXED_EPOCH - 1_000,
      categories: [],
    },
  ];
}

function defaultPwaState(): TestPwaState {
  return {
    needRefresh: false,
    offlineReady: false,
    updateRequested: false,
    reloadRequested: false,
  };
}

function defaultAdminFixtures(): NonNullable<TestScenario["adminFixtures"]> {
  return {
    userStats: {
      totalUsers: 12,
      activeUsers: 9,
      newUsersThisMonth: 3,
      inactiveUsers: 3,
    },
    usage: {
      overview: {
        totalUsers: 12,
        totalLists: 34,
        totalTemplates: 8,
        totalCategories: 72,
        totalItems: 418,
        completionRate: 62.5,
        avgItemsPerList: 12.29,
      },
      userActivity: { inactive: 3, low: 4, medium: 3, high: 2 },
      topMetrics: [],
      templateUsage: { totalUsage: 27, averageUsage: 3.38 },
    },
  };
}

function baseScenario(auth: MockAuthState, role: TestRole): TestScenario {
  return {
    auth,
    users: [testUser(role), foreignUser()],
    lists: baseLists(),
    categories: baseCategories(),
    items: baseItems(),
    templates: baseTemplates(),
    legacyImports: [],
    pwa: defaultPwaState(),
    counters: { list: 100, category: 100, item: 100, template: 100 },
    logicalTime: FIXED_EPOCH,
    loadingQueries: [],
    queryErrors: {},
    mutationErrors: {},
    adminFixtures: defaultAdminFixtures(),
  };
}

export function signedOutScenario(): TestScenario {
  return baseScenario(signedOutAuth(), "user");
}

export function regularUserScenario(): TestScenario {
  return baseScenario(signedInAuth(), "user");
}

export function adminScenario(): TestScenario {
  return baseScenario(signedInAuth(), "admin");
}

export function emptyAccountScenario(): TestScenario {
  const scenario = regularUserScenario();
  scenario.lists = scenario.lists.filter((list) => list.userId !== TEST_USER_ID);
  scenario.categories = scenario.categories.filter((category) =>
    scenario.lists.some((list) => list._id === category.listId),
  );
  scenario.items = scenario.items.filter((item) =>
    scenario.categories.some((category) => category._id === item.categoryId),
  );
  scenario.templates = scenario.templates.filter(
    (template) => template.createdBy !== TEST_USER_ID,
  );
  return scenario;
}

export function emptyListScenario(): TestScenario {
  const scenario = regularUserScenario();
  scenario.categories = scenario.categories.filter(
    (category) => category.listId !== fixtureIds.list,
  );
  scenario.items = scenario.items.filter((item) =>
    scenario.categories.some((category) => category._id === item.categoryId),
  );
  return scenario;
}

function scenarioToPersisted(scenario: TestScenario): PersistedRuntime {
  return {
    scenarioId: scenario.scenarioId,
    state: {
      auth: scenario.auth,
      users: scenario.users,
      lists: scenario.lists,
      categories: scenario.categories,
      items: scenario.items,
      templates: scenario.templates,
      legacyImports: scenario.legacyImports,
      pwa: scenario.pwa ?? defaultPwaState(),
      counters: scenario.counters,
      logicalTime: scenario.logicalTime,
    },
    loadingQueries: scenario.loadingQueries ?? [],
    queryErrors: scenario.queryErrors ?? {},
    mutationErrors: scenario.mutationErrors ?? {},
    adminFixtures: scenario.adminFixtures,
  };
}

function persistedToScenario(value: PersistedRuntime): TestScenario {
  return {
    ...value.state,
    scenarioId: value.scenarioId,
    pwa: value.state.pwa ?? defaultPwaState(),
    loadingQueries: value.loadingQueries,
    queryErrors: value.queryErrors,
    mutationErrors: value.mutationErrors,
    adminFixtures: value.adminFixtures,
  };
}

function browserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function readPersisted(storage: Storage | undefined): TestScenario | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(TEST_RUNTIME_STORAGE_KEY);
    return raw ? persistedToScenario(JSON.parse(raw) as PersistedRuntime) : undefined;
  } catch {
    return undefined;
  }
}

function getRecord(args: unknown): Record<string, unknown> {
  if (typeof args !== "object" || args === null || Array.isArray(args)) return {};
  return args as Record<string, unknown>;
}

function owns(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function text(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw createDomainError("VALIDATION", `${key} must be a string`);
  }
  return value;
}

function optionalText(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function numberValue(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number") {
    throw createDomainError("VALIDATION", `${key} must be a number`);
  }
  return value;
}

function booleanValue(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function stringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

class InMemoryTestRuntime implements TestRuntime {
  private state: TestRuntimeState;
  private readonly scenarioId?: string;
  private readonly storage?: Storage;
  private readonly loadingQueries: Set<string>;
  private readonly queryErrors: Record<string, SerializedDomainError>;
  private readonly mutationErrors: Record<string, SerializedDomainError>;
  private readonly adminFixtures?: TestScenario["adminFixtures"];
  private readonly listeners = new Set<() => void>();
  private readonly queryCache = new Map<string, unknown>();
  private version = 0;

  constructor(scenario: TestScenario, storage?: Storage) {
    const copied = clone(scenario);
    this.scenarioId = copied.scenarioId;
    this.state = scenarioToPersisted(copied).state;
    this.storage = storage;
    this.loadingQueries = new Set(copied.loadingQueries ?? []);
    this.queryErrors = copied.queryErrors ?? {};
    this.mutationErrors = copied.mutationErrors ?? {};
    this.adminFixtures = copied.adminFixtures;
    this.persist();
  }

  getVersion = () => this.version;

  getScenarioId = () => this.scenarioId;

  getState = () => clone(this.state);

  getPwaState = () => this.state.pwa;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  resolveQuery = (name: string) => {
    if (!this.loadingQueries.delete(name)) return;
    this.commit();
  };

  setAuth = (auth: MockAuthState) => {
    this.state = { ...this.state, auth: clone(auth) };
    this.commit();
  };

  setPwaState = (state: Partial<TestPwaState>) => {
    this.state = {
      ...this.state,
      pwa: { ...this.state.pwa, ...clone(state) },
    };
    this.commit();
  };

  requestServiceWorkerUpdate = async (reloadPage = false) => {
    this.setPwaState({
      needRefresh: false,
      updateRequested: true,
      reloadRequested: reloadPage,
    });
  };

  query = (name: string, args: unknown = {}) => {
    if (this.loadingQueries.has(name)) return undefined;
    const injectedError = this.queryErrors[name];
    if (injectedError) throwDomainError(injectedError);

    const cacheKey = `${this.version}:${name}:${JSON.stringify(args)}`;
    if (this.queryCache.has(cacheKey)) return this.queryCache.get(cacheKey);
    const value = this.executeQuery(name, getRecord(args));
    this.queryCache.set(cacheKey, value);
    return value;
  };

  mutate = async (name: string, args: unknown = {}) => {
    const injectedError = this.mutationErrors[name];
    if (injectedError) throwDomainError(injectedError);

    const draft = clone(this.state);
    const result = this.executeMutation(draft, name, getRecord(args));
    this.state = draft;
    this.commit();
    return result;
  };

  private currentUser(state = this.state): TestUser | null {
    if (!state.auth.isLoaded || !state.auth.isSignedIn || !state.auth.user) {
      return null;
    }
    return (
      state.users.find((user) => user.clerkId === state.auth.user?.id) ?? null
    );
  }

  private requireCurrentUser(state: TestRuntimeState): TestUser {
    if (!state.auth.isSignedIn || !state.auth.user) {
      throw createDomainError("UNAUTHENTICATED", "Sign in to continue");
    }
    const user = this.currentUser(state);
    if (!user) throw createDomainError("NOT_FOUND", "Current user was not found");
    return user;
  }

  private requireOwnedList(state: TestRuntimeState, listId: string): TestList {
    const user = this.requireCurrentUser(state);
    const list = state.lists.find((candidate) => candidate._id === listId);
    if (!list) throw createDomainError("NOT_FOUND", "List was not found");
    if (list.userId !== user._id) {
      throw createDomainError("FORBIDDEN", "You do not have access to this list");
    }
    return list;
  }

  private requireOwnedCategory(
    state: TestRuntimeState,
    categoryId: string,
  ): TestCategory {
    const category = state.categories.find(
      (candidate) => candidate._id === categoryId,
    );
    if (!category) throw createDomainError("NOT_FOUND", "Category was not found");
    this.requireOwnedList(state, category.listId);
    return category;
  }

  private requireOwnedItem(state: TestRuntimeState, itemId: string): TestItem {
    const item = state.items.find((candidate) => candidate._id === itemId);
    if (!item) throw createDomainError("NOT_FOUND", "Item was not found");
    this.requireOwnedCategory(state, item.categoryId);
    return item;
  }

  private listOutput(state: TestRuntimeState, list: TestList) {
    const { isPublic, isTemplate, ...output } = list;
    void isPublic;
    void isTemplate;
    return {
      ...output,
      categories: state.categories
        .filter((category) => category.listId === list._id)
        .sort((left, right) => left.order - right.order)
        .map((category) => ({
          ...category,
          items: state.items
            .filter((item) => item.categoryId === category._id)
            .sort((left, right) => left.order - right.order),
        })),
    };
  }

  private executeQuery(name: string, args: Record<string, unknown>) {
    if (name === "users:getCurrentUser") return this.currentUser();
    if (name === "users:getCurrentAccess") {
      if (!this.state.auth.isSignedIn) {
        return { authenticated: false as const, role: null };
      }
      const user = this.currentUser();
      return {
        authenticated: true as const,
        role: user?.role === "admin" ? ("admin" as const) : ("user" as const),
      };
    }
    if (
      name === "lists:getListSummaries" ||
      name === "lists:getListExportPage"
    ) {
      const user = this.requireCurrentUser(this.state);
      const paginationOpts = getRecord(args.paginationOpts);
      const numItems =
        typeof paginationOpts.numItems === "number"
          ? paginationOpts.numItems
          : 50;
      const start =
        typeof paginationOpts.cursor === "string"
          ? Number.parseInt(paginationOpts.cursor, 10) || 0
          : 0;
      const owned = this.state.lists
        .filter((list) => list.userId === user._id && !list.isTemplate)
        .sort((left, right) =>
          name === "lists:getListExportPage"
            ? left._creationTime - right._creationTime
            : right._creationTime - left._creationTime,
        );
      const pageLists = owned.slice(start, start + numItems);
      const next = start + pageLists.length;
      const isDone = next >= owned.length;
      const page =
        name === "lists:getListExportPage"
          ? pageLists.map((list) => this.listOutput(this.state, list))
          : pageLists.map((list) => {
              const output = this.listOutput(this.state, list);
              const { categories, ...summary } = output;
              const items = categories.flatMap((category) => category.items);
              return {
                ...summary,
                categoryCount: categories.length,
                itemCount: items.length,
                packedCount: items.filter((item) => item.packed).length,
              };
            });
      return {
        page,
        isDone,
        continueCursor: isDone ? "" : String(next),
      };
    }
    if (name === "lists:getList" || name === "lists:getListByRouteId") {
      const list = this.requireOwnedList(this.state, text(args, "listId"));
      return this.listOutput(this.state, list);
    }
    if (name === "templates:getOwnedTemplateExportPage") {
      const user = this.requireCurrentUser(this.state);
      const paginationOpts = getRecord(args.paginationOpts);
      const numItems =
        typeof paginationOpts.numItems === "number"
          ? paginationOpts.numItems
          : 5;
      const start =
        typeof paginationOpts.cursor === "string"
          ? Number.parseInt(paginationOpts.cursor, 10) || 0
          : 0;
      const ordered = this.state.templates
        .filter((template) => template.createdBy === user._id)
        .sort((left, right) => left._creationTime - right._creationTime);
      const pageTemplates = ordered.slice(start, start + numItems);
      const next = start + pageTemplates.length;
      const isDone = next >= ordered.length;
      return {
        page: pageTemplates.map(({ createdBy, ...template }) => {
          void createdBy;
          return {
            ...clone(template),
            isOwned: true,
            categoryCount: template.categories.length,
            itemCount: template.categories.reduce(
              (total, category) => total + category.items.length,
              0,
            ),
          };
        }),
        isDone,
        continueCursor: isDone ? "" : String(next),
      };
    }
    if (
      name === "templates:getPublicTemplateSummaries" ||
      name === "templates:getOwnedTemplateSummaries"
    ) {
      const isOwnedQuery = name === "templates:getOwnedTemplateSummaries";
      const templates = isOwnedQuery
        ? this.state.templates.filter(
            (template) =>
              template.createdBy === this.requireCurrentUser(this.state)._id,
          )
        : this.state.templates.filter((template) => template.isPublic === true);
      const paginationOpts = getRecord(args.paginationOpts);
      const numItems =
        typeof paginationOpts.numItems === "number"
          ? paginationOpts.numItems
          : 50;
      const start =
        typeof paginationOpts.cursor === "string"
          ? Number.parseInt(paginationOpts.cursor, 10) || 0
          : 0;
      const ordered = templates.sort(
        (left, right) => right._creationTime - left._creationTime,
      );
      const pageTemplates = ordered.slice(start, start + numItems);
      const next = start + pageTemplates.length;
      const isDone = next >= ordered.length;
      return {
        page: pageTemplates.map(({ categories, createdBy, ...template }) => {
          void createdBy;
          return {
            ...template,
            isOwned: isOwnedQuery,
            categoryCount: categories.length,
            itemCount: categories.reduce(
              (total, category) => total + category.items.length,
              0,
            ),
          };
        }),
        isDone,
        continueCursor: isDone ? "" : String(next),
      };
    }
    if (name === "templates:getTemplate") {
      const template = this.state.templates.find(
        (candidate) => candidate._id === text(args, "templateId"),
      );
      const user = this.currentUser();
      if (!template || (!template.isPublic && !user)) {
        throw createDomainError("NOT_FOUND", "Template was not found");
      }
      const isOwned = user !== null && template.createdBy === user._id;
      if (!template.isPublic && !isOwned) {
        throw createDomainError("FORBIDDEN", "You cannot access this template");
      }
      const { createdBy, ...detail } = template;
      void createdBy;
      return { ...clone(detail), isOwned };
    }
    if (name === "migrations:getLegacyImportStatus") {
      const user = this.requireCurrentUser(this.state);
      void user;
      const existing = this.state.legacyImports.find(
        (entry) =>
          entry.sourceKey === text(args, "sourceKey") &&
          entry.fingerprint === text(args, "fingerprint"),
      );
      return existing
        ? {
            status: "already_imported" as const,
            listsImported: existing.listsImported,
            templatesImported: existing.templatesImported,
          }
        : null;
    }
    if (name === "users:getUserStats") {
      this.requireAdmin();
      return this.adminFixtures?.userStats ?? defaultAdminFixtures().userStats;
    }
    if (name === "analytics:getSystemUsageAnalytics") {
      this.requireAdmin();
      return this.adminFixtures?.usage ?? defaultAdminFixtures().usage;
    }

    throw new Error(`Unsupported test query: ${name}`);
  }

  private requireAdmin() {
    const user = this.requireCurrentUser(this.state);
    if (user.role !== "admin") {
      throw createDomainError("FORBIDDEN", "Administrator access is required");
    }
    return user;
  }

  private nextTime(state: TestRuntimeState) {
    state.logicalTime += 1;
    return state.logicalTime;
  }

  private nextId(
    state: TestRuntimeState,
    key: keyof TestRuntimeState["counters"],
  ) {
    state.counters[key] += 1;
    return `${key}_${state.counters[key]}`;
  }

  private executeMutation(
    state: TestRuntimeState,
    name: string,
    args: Record<string, unknown>,
  ): unknown {
    if (name === "users:ensureCurrentUser") {
      if (!state.auth.isSignedIn || !state.auth.user) {
        throw createDomainError("UNAUTHENTICATED", "Sign in to continue");
      }
      const existing = state.users.find(
        (user) => user.clerkId === state.auth.user?.id,
      );
      if (existing) return existing._id;
      const now = this.nextTime(state);
      const userId = `user_${state.auth.user.id}`;
      state.users.push({
        _id: userId,
        _creationTime: now,
        clerkId: state.auth.user.id,
        name: state.auth.user.fullName || "Anonymous User",
        email: state.auth.user.primaryEmailAddress.emailAddress,
        imageUrl: state.auth.user.imageUrl,
        role: "user",
        preferences: {
          theme: "system",
          defaultPriority: "medium",
          autoSave: true,
        },
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
    if (name === "lists:createList") {
      const user = this.requireCurrentUser(state);
      const now = this.nextTime(state);
      const listId = this.nextId(state, "list");
      state.lists.push({
        _id: listId,
        _creationTime: now,
        userId: user._id,
        name: text(args, "name").trim(),
        description: optionalText(args, "description"),
        isTemplate: false,
        isPublic: false,
        tags: stringArray(args, "tags").map((tag) => tag.trim()),
        createdAt: now,
        updatedAt: now,
      });
      return listId;
    }
    if (name === "lists:updateList") {
      const list = this.requireOwnedList(state, text(args, "listId"));
      if (typeof args.name === "string") list.name = args.name;
      if (owns(args, "description")) {
        list.description = optionalText(args, "description");
      }
      if (owns(args, "tags")) {
        list.tags = Array.isArray(args.tags) ? stringArray(args, "tags") : undefined;
      }
      list.updatedAt = this.nextTime(state);
      return list._id;
    }
    if (name === "lists:markListCompleted" || name === "lists:markListIncomplete") {
      const list = this.requireOwnedList(state, text(args, "listId"));
      const now = this.nextTime(state);
      list.updatedAt = now;
      if (name === "lists:markListCompleted") list.completedAt = now;
      else delete list.completedAt;
      return list._id;
    }
    if (name === "lists:deleteList") {
      const list = this.requireOwnedList(state, text(args, "listId"));
      const categoryIds = new Set(
        state.categories
          .filter((category) => category.listId === list._id)
          .map((category) => category._id),
      );
      state.items = state.items.filter(
        (item) => !categoryIds.has(item.categoryId),
      );
      state.categories = state.categories.filter(
        (category) => category.listId !== list._id,
      );
      state.lists = state.lists.filter((candidate) => candidate._id !== list._id);
      return undefined;
    }
    if (name === "lists:duplicateList") {
      const source = this.requireOwnedList(state, text(args, "listId"));
      const now = this.nextTime(state);
      const listId = this.nextId(state, "list");
      state.lists.push({
        ...source,
        _id: listId,
        _creationTime: now,
        name: optionalText(args, "newName") ?? `Copy of ${source.name}`,
        isTemplate: false,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
      });
      const sourceCategories = state.categories
        .filter((category) => category.listId === source._id)
        .sort((left, right) => left.order - right.order);
      for (const sourceCategory of sourceCategories) {
        const categoryId = this.nextId(state, "category");
        state.categories.push({
          ...sourceCategory,
          _id: categoryId,
          _creationTime: now,
          listId,
          createdAt: now,
          updatedAt: now,
        });
        for (const sourceItem of state.items.filter(
          (item) => item.categoryId === sourceCategory._id,
        )) {
          state.items.push({
            ...sourceItem,
            _id: this.nextId(state, "item"),
            _creationTime: now,
            categoryId,
            packed: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      return listId;
    }
    if (name === "lists:addCategory") {
      const list = this.requireOwnedList(state, text(args, "listId"));
      const now = this.nextTime(state);
      const categoryId = this.nextId(state, "category");
      const ownedCategories = state.categories.filter(
        (category) => category.listId === list._id,
      );
      state.categories.push({
        _id: categoryId,
        _creationTime: now,
        listId: list._id,
        name: text(args, "name"),
        color: optionalText(args, "color"),
        icon: optionalText(args, "icon"),
        order:
          typeof args.order === "number"
            ? args.order
            : Math.max(-1, ...ownedCategories.map((category) => category.order)) + 1,
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      });
      return categoryId;
    }
    if (name === "lists:updateCategory") {
      const category = this.requireOwnedCategory(state, text(args, "categoryId"));
      if (typeof args.name === "string") category.name = args.name;
      if (typeof args.color === "string") category.color = args.color;
      if (typeof args.icon === "string") category.icon = args.icon;
      if (typeof args.order === "number") category.order = args.order;
      category.updatedAt = this.nextTime(state);
      return category._id;
    }
    if (name === "lists:deleteCategory") {
      const category = this.requireOwnedCategory(state, text(args, "categoryId"));
      state.items = state.items.filter((item) => item.categoryId !== category._id);
      state.categories = state.categories.filter(
        (candidate) => candidate._id !== category._id,
      );
      return undefined;
    }
    if (name === "lists:toggleCategoryCollapse") {
      const category = this.requireOwnedCategory(state, text(args, "categoryId"));
      category.collapsed = !category.collapsed;
      category.updatedAt = this.nextTime(state);
      return undefined;
    }
    if (name === "lists:reorderCategories") {
      const list = this.requireOwnedList(state, text(args, "listId"));
      const categoryIds = stringArray(args, "categoryIds");
      const owned = state.categories.filter(
        (category) => category.listId === list._id,
      );
      if (
        categoryIds.length !== owned.length ||
        new Set(categoryIds).size !== owned.length ||
        categoryIds.some((id) => !owned.some((category) => category._id === id))
      ) {
        throw createDomainError(
          "FORBIDDEN",
          "Category IDs must contain every owned record exactly once",
        );
      }
      const now = this.nextTime(state);
      categoryIds.forEach((id, order) => {
        const category = owned.find((candidate) => candidate._id === id);
        if (category) {
          category.order = order;
          category.updatedAt = now;
        }
      });
      return undefined;
    }
    if (name === "lists:addItem") {
      const category = this.requireOwnedCategory(state, text(args, "categoryId"));
      const now = this.nextTime(state);
      const itemId = this.nextId(state, "item");
      const categoryItems = state.items.filter(
        (item) => item.categoryId === category._id,
      );
      state.items.push({
        _id: itemId,
        _creationTime: now,
        categoryId: category._id,
        name: text(args, "name"),
        quantity: numberValue(args, "quantity"),
        packed: booleanValue(args, "packed") ?? false,
        priority: text(args, "priority"),
        notes: optionalText(args, "notes"),
        description: optionalText(args, "description"),
        weight: typeof args.weight === "number" ? args.weight : undefined,
        tags: stringArray(args, "tags"),
        order:
          typeof args.order === "number"
            ? args.order
            : Math.max(-1, ...categoryItems.map((item) => item.order)) + 1,
        createdAt: now,
        updatedAt: now,
      });
      return itemId;
    }
    if (name === "lists:updateItemAndMove") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      const hasCategory = typeof args.toCategoryId === "string";
      const hasIndex = typeof args.toIndex === "number";
      if (hasCategory !== hasIndex) {
        throw createDomainError(
          "VALIDATION",
          "Destination category and index must be provided together",
        );
      }
      this.executeMutation(state, "lists:updateItem", args);
      if (hasCategory && hasIndex) {
        this.executeMutation(state, "lists:moveItem", args);
      }
      return item._id;
    }
    if (name === "lists:adjustItemQuantity") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      const delta = numberValue(args, "delta");
      const quantity = item.quantity + delta;
      if (!Number.isInteger(delta) || !Number.isInteger(quantity) || quantity < 1) {
        throw createDomainError(
          "VALIDATION",
          "Item quantity must be a positive integer",
        );
      }
      item.quantity = quantity;
      item.updatedAt = this.nextTime(state);
      return item._id;
    }
    if (name === "lists:updateItem") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      if (typeof args.name === "string") item.name = args.name;
      if (typeof args.quantity === "number") item.quantity = args.quantity;
      if (typeof args.priority === "string") item.priority = args.priority;
      if (owns(args, "notes")) {
        item.notes = optionalText(args, "notes");
      }
      if (owns(args, "description")) {
        item.description = optionalText(args, "description");
      }
      if (owns(args, "weight")) {
        item.weight = typeof args.weight === "number" ? args.weight : undefined;
      }
      if (owns(args, "tags")) {
        item.tags = Array.isArray(args.tags) ? stringArray(args, "tags") : undefined;
      }
      item.updatedAt = this.nextTime(state);
      return item._id;
    }
    if (name === "lists:deleteItem") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      state.items = state.items.filter((candidate) => candidate._id !== item._id);
      return undefined;
    }
    if (name === "lists:toggleItemPacked") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      item.packed = !item.packed;
      item.updatedAt = this.nextTime(state);
      return undefined;
    }
    if (name === "lists:reorderItems") {
      const category = this.requireOwnedCategory(state, text(args, "categoryId"));
      const itemIds = stringArray(args, "itemIds");
      const owned = state.items.filter((item) => item.categoryId === category._id);
      if (
        itemIds.length !== owned.length ||
        new Set(itemIds).size !== owned.length ||
        itemIds.some((id) => !owned.some((item) => item._id === id))
      ) {
        throw createDomainError(
          "FORBIDDEN",
          "Item IDs must contain every owned record exactly once",
        );
      }
      const now = this.nextTime(state);
      itemIds.forEach((id, order) => {
        const item = owned.find((candidate) => candidate._id === id);
        if (item) {
          item.order = order;
          item.updatedAt = now;
        }
      });
      return undefined;
    }
    if (name === "lists:moveItem") {
      const item = this.requireOwnedItem(state, text(args, "itemId"));
      const destination = this.requireOwnedCategory(
        state,
        text(args, "toCategoryId"),
      );
      const toIndex = numberValue(args, "toIndex");
      const sourceCategoryId = item.categoryId;
      const sourceItems = state.items
        .filter(
          (candidate) =>
            candidate.categoryId === sourceCategoryId && candidate._id !== item._id,
        )
        .sort((left, right) => left.order - right.order);
      const destinationItems = state.items
        .filter(
          (candidate) =>
            candidate.categoryId === destination._id && candidate._id !== item._id,
        )
        .sort((left, right) => left.order - right.order);
      if (toIndex < 0 || toIndex > destinationItems.length) {
        throw createDomainError("VALIDATION", "Destination index is out of range");
      }
      destinationItems.splice(toIndex, 0, item);
      const now = this.nextTime(state);
      sourceItems.forEach((candidate, order) => {
        candidate.order = order;
        candidate.updatedAt = now;
      });
      destinationItems.forEach((candidate, order) => {
        candidate.categoryId = destination._id;
        candidate.order = order;
        candidate.updatedAt = now;
      });
      return undefined;
    }
    if (name === "lists:importList") {
      return this.importList(state, args);
    }
    if (name === "templates:applyTemplate") {
      return this.applyTemplate(state, args);
    }
    if (name === "templates:createTemplateFromList") {
      return this.createTemplateFromList(state, args);
    }
    if (name === "users:updateCurrentUserPreferences") {
      const user = this.requireCurrentUser(state);
      const preferences = getRecord(args.preferences);
      user.preferences = {
        theme: text(preferences, "theme") as TestUser["preferences"]["theme"],
        defaultPriority: text(
          preferences,
          "defaultPriority",
        ) as TestUser["preferences"]["defaultPriority"],
        autoSave: booleanValue(preferences, "autoSave") ?? true,
      };
      user.updatedAt = this.nextTime(state);
      return user._id;
    }
    if (name === "migrations:importLegacyData") {
      return this.importLegacyData(state, args);
    }

    throw new Error(`Unsupported test mutation: ${name}`);
  }

  private importList(state: TestRuntimeState, args: Record<string, unknown>) {
    const user = this.requireCurrentUser(state);
    const listInput = getRecord(args.list);
    const now = this.nextTime(state);
    const listId = this.nextId(state, "list");
    state.lists.push({
      _id: listId,
      _creationTime: now,
      userId: user._id,
      name: text(listInput, "name"),
      description: optionalText(listInput, "description"),
      tags: stringArray(listInput, "tags"),
      isTemplate: false,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });
    const categories = Array.isArray(args.categories) ? args.categories : [];
    categories.forEach((rawCategory, categoryOrder) => {
      const categoryInput = getRecord(rawCategory);
      const categoryId = this.nextId(state, "category");
      state.categories.push({
        _id: categoryId,
        _creationTime: now,
        listId,
        name: text(categoryInput, "name"),
        color: optionalText(categoryInput, "color"),
        icon: optionalText(categoryInput, "icon"),
        order: categoryOrder,
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      });
      const items = Array.isArray(categoryInput.items) ? categoryInput.items : [];
      items.forEach((rawItem, itemOrder) => {
        const itemInput = getRecord(rawItem);
        state.items.push({
          _id: this.nextId(state, "item"),
          _creationTime: now,
          categoryId,
          name: text(itemInput, "name"),
          quantity: numberValue(itemInput, "quantity"),
          packed: booleanValue(itemInput, "packed") ?? false,
          priority: text(itemInput, "priority"),
          description: optionalText(itemInput, "description"),
          notes: optionalText(itemInput, "notes"),
          weight:
            typeof itemInput.weight === "number" ? itemInput.weight : undefined,
          tags: stringArray(itemInput, "tags"),
          order: itemOrder,
          createdAt: now,
          updatedAt: now,
        });
      });
    });
    return listId;
  }

  private applyTemplate(
    state: TestRuntimeState,
    args: Record<string, unknown>,
  ) {
    const user = this.requireCurrentUser(state);
    const template = state.templates.find(
      (candidate) => candidate._id === text(args, "templateId"),
    );
    if (!template) throw createDomainError("NOT_FOUND", "Template was not found");
    if (!template.isPublic && template.createdBy !== user._id) {
      throw createDomainError("FORBIDDEN", "You cannot apply this template");
    }
    const now = this.nextTime(state);
    const listId = this.nextId(state, "list");
    state.lists.push({
      _id: listId,
      _creationTime: now,
      userId: user._id,
      name: text(args, "listName"),
      description:
        optionalText(args, "listDescription") ??
        `Created from template: ${template.name}`,
      isTemplate: false,
      isPublic: false,
      tags: clone(template.tags ?? []),
      createdAt: now,
      updatedAt: now,
    });
    template.categories
      .slice()
      .sort((left, right) => left.order - right.order)
      .forEach((templateCategory, categoryOrder) => {
        const categoryId = this.nextId(state, "category");
        state.categories.push({
          _id: categoryId,
          _creationTime: now,
          listId,
          name: templateCategory.name,
          color: templateCategory.color,
          icon: templateCategory.icon,
          order: categoryOrder,
          collapsed: templateCategory.collapsed,
          createdAt: now,
          updatedAt: now,
        });
        templateCategory.items
          .slice()
          .sort((left, right) => left.order - right.order)
          .forEach((templateEntry, itemOrder) => {
            state.items.push({
              _id: this.nextId(state, "item"),
              _creationTime: now,
              categoryId,
              name: templateEntry.name,
              quantity: templateEntry.quantity,
              packed: false,
              priority: templateEntry.priority,
              notes: templateEntry.notes,
              description: templateEntry.description,
              weight: templateEntry.weight,
              tags: clone(templateEntry.tags),
              order: itemOrder,
              createdAt: now,
              updatedAt: now,
            });
          });
      });
    template.usageCount = (template.usageCount ?? 0) + 1;
    template.updatedAt = now;
    return listId;
  }

  private createTemplateFromList(
    state: TestRuntimeState,
    args: Record<string, unknown>,
  ) {
    const list = this.requireOwnedList(state, text(args, "listId"));
    const now = this.nextTime(state);
    const templateId = this.nextId(state, "template");
    const categories = state.categories
      .filter((category) => category.listId === list._id)
      .sort((left, right) => left.order - right.order)
      .map((category) => ({
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
        collapsed: category.collapsed,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        items: state.items
          .filter((item) => item.categoryId === category._id)
          .sort((left, right) => left.order - right.order)
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            packed: false as const,
            priority: item.priority,
            notes: item.notes,
            description: item.description,
            weight: item.weight,
            tags: clone(item.tags ?? []),
            order: item.order,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
      }));
    state.templates.push({
      _id: templateId,
      _creationTime: now,
      name: text(args, "name"),
      description: text(args, "description"),
      category: optionalText(args, "category") ?? "custom",
      difficulty: "intermediate",
      season: "all",
      duration: "varies",
      tags: clone(list.tags ?? []),
      isPublic: booleanValue(args, "isPublic") ?? false,
      isOfficial: false,
      createdBy: list.userId,
      usageCount: 0,
      rating: 0,
      createdAt: now,
      updatedAt: now,
      categories,
    });
    return templateId;
  }

  private importLegacyData(
    state: TestRuntimeState,
    args: Record<string, unknown>,
  ) {
    const user = this.requireCurrentUser(state);
    void user;
    const sourceKey = text(args, "sourceKey");
    const fingerprint = text(args, "fingerprint");
    const existing = state.legacyImports.find(
      (entry) =>
        entry.sourceKey === sourceKey && entry.fingerprint === fingerprint,
    );
    if (existing) {
      return {
        status: "already_imported" as const,
        listsImported: existing.listsImported,
        templatesImported: existing.templatesImported,
      };
    }

    const lists = Array.isArray(args.lists) ? args.lists : [];
    const templates = Array.isArray(args.templates) ? args.templates : [];
    lists.forEach((rawList) => {
      const listInput = getRecord(rawList);
      this.importList(state, {
        version: 1,
        list: {
          name: text(listInput, "name"),
          description: optionalText(listInput, "description"),
          tags: stringArray(listInput, "tags"),
        },
        categories: Array.isArray(listInput.categories)
          ? listInput.categories
          : [],
      });
    });
    templates.forEach((rawTemplate) => {
      const templateInput = getRecord(rawTemplate);
      const now = this.nextTime(state);
      state.templates.push({
        _id: this.nextId(state, "template"),
        _creationTime: now,
        name: text(templateInput, "name"),
        description: text(templateInput, "description"),
        category: "custom",
        difficulty: optionalText(templateInput, "difficulty") ?? "intermediate",
        season: optionalText(templateInput, "season") ?? "all",
        duration: optionalText(templateInput, "duration") ?? "varies",
        tags: stringArray(templateInput, "tags"),
        isPublic: booleanValue(templateInput, "isPublic") ?? false,
        isOfficial: false,
        createdBy: TEST_USER_ID,
        usageCount:
          typeof templateInput.usageCount === "number"
            ? templateInput.usageCount
            : 0,
        rating: 0,
        createdAt: now,
        updatedAt: now,
        categories: clone(
          (Array.isArray(templateInput.categories)
            ? templateInput.categories
            : []) as TestTemplateCategory[],
        ),
      });
    });
    if (typeof args.preferences === "object" && args.preferences !== null) {
      const preferences = getRecord(args.preferences);
      const currentUser = this.requireCurrentUser(state);
      currentUser.preferences = {
        ...currentUser.preferences,
        ...(typeof preferences.theme === "string"
          ? { theme: preferences.theme as TestUser["preferences"]["theme"] }
          : {}),
        ...(typeof preferences.defaultPriority === "string"
          ? {
              defaultPriority:
                preferences.defaultPriority as TestUser["preferences"]["defaultPriority"],
            }
          : {}),
        ...(typeof preferences.autoSave === "boolean"
          ? { autoSave: preferences.autoSave }
          : {}),
      };
    }
    const result = {
      sourceKey,
      fingerprint,
      listsImported: lists.length,
      templatesImported: templates.length,
    };
    state.legacyImports.push(result);
    return {
      status: "imported" as const,
      listsImported: result.listsImported,
      templatesImported: result.templatesImported,
    };
  }

  private commit() {
    this.version += 1;
    this.queryCache.clear();
    this.persist();
    this.listeners.forEach((listener) => listener());
  }

  private persist() {
    if (!this.storage) return;
    try {
      const value: PersistedRuntime = {
        scenarioId: this.scenarioId,
        state: this.state,
        loadingQueries: [...this.loadingQueries],
        queryErrors: this.queryErrors,
        mutationErrors: this.mutationErrors,
        adminFixtures: this.adminFixtures,
      };
      this.storage.setItem(TEST_RUNTIME_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Storage is optional in unit tests and privacy-restricted browsers.
    }
  }
}

let activeRuntime: TestRuntime | null = null;

function globalScenario(): TestScenario | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__ROUTE_LEDGER_TEST_SEED__;
}

export function createTestRuntime(
  scenario?: TestScenario,
  options: TestRuntimeOptions = {},
): TestRuntime {
  const storage = options.storage;
  const initial = scenario ?? readPersisted(storage);
  if (!initial) {
    throw new Error(
      "The deterministic test runtime requires an explicit scenario seed or persisted state",
    );
  }
  return new InMemoryTestRuntime(initial, storage);
}

export function resetTestRuntime(scenario: TestScenario = regularUserScenario()) {
  activeRuntime = createTestRuntime(scenario, { storage: browserStorage() });
  return activeRuntime;
}

export function clearTestRuntime() {
  activeRuntime = null;
  if (typeof window !== "undefined") {
    delete window.__ROUTE_LEDGER_TEST_CONTROL__;
    delete window.__ROUTE_LEDGER_TEST_BOUNDARY__;
  }
}

function exposeBrowserRuntime(runtime: TestRuntime) {
  if (typeof window === "undefined") return;
  const scenarioId = runtime.getScenarioId();
  if (!scenarioId) {
    throw new Error(
      "The deterministic browser runtime requires a per-test scenario ID",
    );
  }
  window.__ROUTE_LEDGER_TEST_CONTROL__ = {
    getScenarioId: runtime.getScenarioId,
    resolveQuery: runtime.resolveQuery,
    setAuth: runtime.setAuth,
  };
  window.__ROUTE_LEDGER_TEST_BOUNDARY__ = scenarioId;
}

export function getTestRuntime(): TestRuntime {
  if (!activeRuntime) {
    const storage = browserStorage();
    const initial = readPersisted(storage) ?? globalScenario();
    if (!initial) {
      throw new Error(
        "The deterministic browser runtime requires an explicit scenario seed or persisted state",
      );
    }
    activeRuntime = createTestRuntime(initial, { storage });
    exposeBrowserRuntime(activeRuntime);
  }
  return activeRuntime;
}

declare global {
  interface Window {
    __ROUTE_LEDGER_TEST_SEED__?: TestScenario;
    __ROUTE_LEDGER_TEST_BOUNDARY__?: false | string;
    __ROUTE_LEDGER_TEST_CONTROL__?: TestRuntimeControl;
  }
}
