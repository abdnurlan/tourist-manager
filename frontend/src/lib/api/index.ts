/* ─────────────────────────────────────────────────────────────
   API barrel. Import either the namespaced object or named fns:
     import { api, authApi, toursApi } from "@/lib/api";
     import { listTours } from "@/lib/api/tours";
   ───────────────────────────────────────────────────────────── */

export { api, default, ApiClientError, getToken, setToken, clearToken, TOKEN_KEY, USER_KEY } from "./axios";

import * as authApi from "./auth";
import * as dashboardApi from "./dashboard";
import * as toursApi from "./tours";
import * as eventsApi from "./events";
import * as calendarApi from "./calendar";
import * as searchApi from "./search";
import * as aiApi from "./ai";

export { authApi, dashboardApi, toursApi, eventsApi, calendarApi, searchApi, aiApi };

// Flat named re-exports for ergonomic single imports.
export { login, me, logout } from "./auth";
export { getDashboard } from "./dashboard";
export { listTours, getTour, createTour, updateTour, deleteTour } from "./tours";
export { listTourEvents, createEvent, getEvent, updateEvent, deleteEvent } from "./events";
export { listCalendarEvents } from "./calendar";
export { search } from "./search";
export { aiChat, aiHistory } from "./ai";
