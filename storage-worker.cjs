// Daymark shared core SHA256: 56feffb5b7dab9b3e4991f8dc53e54096159d3427ca3cadabcb07c9cb8f1c624
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// ui/core.js
var require_core = __commonJS({
  "ui/core.js"(exports2, module2) {
    (function(root) {
      const defaults = { ms: ["MS Work", "#527d68", "#e2eee5"], character: ["Character", "#9671a8", "#eee6f3"], break: ["Break", "#ab8a77", "#f1e9e2"], gym: ["Gym", "#4b91bb", "#e5eff8"] };
      const legacy = { focus: ["Focused work", "#527d68", "#e2eee5"], meeting: ["Meetings", "#9671a8", "#eee6f3"], admin: ["Admin", "#6e93b4", "#e5eff8"], learning: ["Learning", "#bc963f", "#faf0d5"], other: ["Other", "#899096", "#edf0f2"] };
      const clone = (x) => JSON.parse(JSON.stringify(x));
      function dateKey(d = /* @__PURE__ */ new Date()) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      function shift(date, n) {
        let d = /* @__PURE__ */ new Date(date + "T12:00:00");
        d.setDate(d.getDate() + n);
        return dateKey(d);
      }
      function isDate(s) {
        return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && dateKey(/* @__PURE__ */ new Date(s + "T12:00:00")) === s;
      }
      function* dates(from, to, maxSpan = 3660) {
        if (!isDate(from) || !isDate(to) || from > to) throw Error("Choose a valid date range.");
        if (/* @__PURE__ */ new Date(to + "T12:00:00") - /* @__PURE__ */ new Date(from + "T12:00:00") > maxSpan * 864e5 + 36e5) throw Error("Choose a date range of up to " + Math.floor(maxSpan / 366) + " years.");
        for (let date = from; isDate(date) && date <= to; date = shift(date, 1)) yield date;
      }
      function emptyDay() {
        return { blocks: [], dailyNotes: [], priorities: ["", "", ""], reflection: "", omitted: [], outcomeDone: [false, false, false], outcomeHandled: [false, false, false], outcomeIds: ["", "", ""], carriedTo: ["", "", ""] };
      }
      function fresh() {
        return { version: 8, start: 8, end: 18, categories: clone(defaults), taskSettings: {}, recurrences: [], backlog: {}, daysOff: [], dayTemplates: {}, yearlyDaysOff: [], holidayNames: { dates: {}, yearly: {} }, completionLog: {}, workingDays: [1, 2, 3, 4, 5], days: {} };
      }
      function timing(b) {
        return Number.isInteger(b.start) && Number.isInteger(b.end) && b.start >= 0 && b.end <= 1440 && (b.imported === true || b.start % 10 === 0 && b.end % 10 === 0) && b.end > b.start;
      }
      function normalizeUnsafe(input) {
        if (!input) return fresh();
        let v = clone(input);
        if (Number.isInteger(v.version) && v.version > 8) throw Object.assign(Error("This planner needs a newer version of Daymark (schema " + v.version + "). Update Daymark before opening or saving it."), { code: "NEWER_VERSION" });
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(v.version) || !v.days || Array.isArray(v.days) || !Number.isInteger(v.start) || !Number.isInteger(v.end) || v.start < 0 || v.end > 24 || v.end <= v.start) throw Error("This is not a valid Daymark backup.");
        let categories = v.categories || { ...defaults, ...legacy };
        if (!Object.keys(categories).length) throw Error("No tasks found.");
        for (let [k, c] of Object.entries(categories)) {
          if (["__proto__", "constructor", "prototype"].includes(k) || !Array.isArray(c) || c.length !== 3 || typeof c[0] !== "string" || !c[0].trim() || c[0].length > 60 || !/^#[a-f\d]{6}$/i.test(c[1]) || !/^#[a-f\d]{6}$/i.test(c[2])) throw Error("Invalid task in backup.");
          if (k === "break" && c[0] === "Breaks") c[0] = "Break";
        }
        let out = { version: 8, start: v.start, end: v.end, categories, taskSettings: {}, recurrences: [], backlog: {}, workingDays: Array.isArray(v.workingDays) && v.workingDays.length ? v.workingDays.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [1, 2, 3, 4, 5], days: {}, migrationIssues: v.migrationIssues || 0 };
        out.holidayNames = { dates: {}, yearly: {} };
        for (let kind of ["dates", "yearly"]) for (let [date, name] of Object.entries(v.holidayNames?.[kind] || {})) {
          if (!isDate(kind === "yearly" ? "2000-" + date : date) || typeof name !== "string" || name.length > 1e3) continue;
          out.holidayNames[kind][date] = name;
        }
        out.dayTemplates = {};
        out.completionLog = {};
        for (let [id, t] of Object.entries(v.completionLog || {})) {
          if (["__proto__", "constructor", "prototype"].includes(id) || !isDate(t.completedDate) && !(t.completedDate === null && t.dateUnknown === true) || typeof t.title !== "string") throw Error("Invalid completion history.");
          out.completionLog[id] = { ...t };
        }
        out.yearlyDaysOff = [...new Set(v.yearlyDaysOff || [])];
        if (out.yearlyDaysOff.some((d) => !isDate("2000-" + d))) throw Error("Invalid yearly holiday.");
        if (v.daysOff !== void 0 && (!Array.isArray(v.daysOff) || v.daysOff.some((d) => !isDate(d)))) throw Error("Invalid days-off list.");
        out.daysOff = [...new Set(v.daysOff || [])].sort();
        for (let [id, t] of Object.entries(v.dayTemplates || {})) {
          if (["__proto__", "constructor", "prototype"].includes(id) || !t || typeof t.name !== "string" || !t.name.trim() || t.name.length > 80 || !Array.isArray(t.blocks)) throw Error("Invalid day template.");
          out.dayTemplates[id] = { name: t.name, blocks: t.blocks.map((b) => {
            if (!Object.hasOwn(categories, b.cat)) throw Error("Template " + t.name + " uses missing task category " + b.cat + ". Reassign its blocks before removing that task.");
            if (!timing(b) || typeof (b.details ?? "") !== "string" || typeof (b.notes ?? "") !== "string") throw Error("Invalid template block.");
            return { cat: b.cat, details: b.details || "", notes: b.notes || "", start: b.start, end: b.end, ...b.imported === true ? { imported: true } : {}, ...b.allowOverlap === true ? { allowOverlap: true } : {} };
          }) };
        }
        for (let [id, t] of Object.entries(v.backlog || {})) {
          if (["__proto__", "constructor", "prototype"].includes(id) || typeof t.title !== "string" || !t.title.trim() || !Object.hasOwn(categories, t.cat) || typeof (t.notes ?? "") !== "string" || t.dueDate && !isDate(t.dueDate)) throw Error("Invalid backlog item.");
          out.backlog[id] = { ...t, id, notes: t.notes || "", done: !!t.done };
        }
        for (let k of Object.keys(categories)) {
          let s = v.taskSettings?.[k] || {};
          out.taskSettings[k] = { archived: !!s.archived, duration: Number.isInteger(s.duration) && s.duration >= 10 && s.duration <= 1440 && s.duration % 10 === 0 ? s.duration : 30 };
        }
        for (let [date, d] of Object.entries(v.days)) {
          if (!isDate(date) || !d || !Array.isArray(d.blocks) || !Array.isArray(d.priorities) || d.priorities.length !== 3 || !d.priorities.every((p) => typeof p === "string") || typeof d.reflection !== "string") throw Error("Invalid day in backup.");
          let day = { ...emptyDay(), priorities: d.priorities, reflection: d.reflection, outcomeDone: [0, 1, 2].map((i) => !!d.outcomeDone?.[i]), outcomeHandled: [0, 1, 2].map((i) => v.version < 3 || !!d.outcomeHandled?.[i]), outcomeIds: [0, 1, 2].map((i) => d.outcomeIds?.[i] || date + ":" + i), carriedTo: [0, 1, 2].map((i) => d.carriedTo?.[i] || ""), omitted: Array.isArray(d.omitted) ? d.omitted.filter((x) => typeof x === "string") : [] };
          let legacyCandidates = Array.isArray(d.legacyActual) ? [...d.legacyActual] : d.legacyActual ? [d.legacyActual] : [];
          let seen = /* @__PURE__ */ new Set();
          for (let b of d.blocks) {
            if (v.version === 1 && b?.lane === "actual") {
              legacyCandidates.push(b);
              continue;
            }
            if (typeof b.id !== "string" || !b.id || seen.has(b.id) || !Object.hasOwn(categories, b.cat) || !timing(b) || typeof (b.notes ?? "") !== "string") throw Error("Invalid calendar entry in backup.");
            seen.add(b.id);
            let name = categories[b.cat][0], details = b.details ?? (b.title === name || b.cat === "break" && b.title === "Breaks" ? "" : b.title || "");
            if (typeof details !== "string") throw Error("Invalid entry details.");
            day.blocks.push({ id: b.id, cat: b.cat, details, notes: b.notes || "", start: b.start, end: b.end, ...b.imported === true ? { imported: true } : {}, ...b.allowOverlap === true ? { allowOverlap: true } : {}, ...b.seriesId ? { seriesId: b.seriesId } : {}, ...b.backlogId ? { backlogId: b.backlogId } : {}, ...typeof b.taskDone === "boolean" ? { taskDone: b.taskDone } : {} });
          }
          if (legacyCandidates.length || d.legacyActual) day.legacyActual = [];
          let quarantine = Array.isArray(d.legacyQuarantine) ? clone(d.legacyQuarantine) : [];
          for (let record of legacyCandidates) {
            let reason = !record || !Object.hasOwn(categories, record.cat) ? "Missing task category" : !timing(record) ? "Invalid legacy time" : typeof (record.notes ?? "") !== "string" ? "Invalid legacy notes" : null;
            if (reason) quarantine.push({ record, reason });
            else day.legacyActual.push(record);
          }
          if (quarantine.length) day.legacyQuarantine = quarantine;
          let noteIds = /* @__PURE__ */ new Set(), badNotes = Array.isArray(d.noteQuarantine) ? clone(d.noteQuarantine) : [];
          day.dailyNotes = [];
          for (let note of Array.isArray(d.dailyNotes) ? d.dailyNotes : d.dailyNotes ? [d.dailyNotes] : []) {
            let reason = !note || typeof note.id !== "string" || !note.id ? "Missing note ID" : noteIds.has(note.id) ? "Duplicate note ID" : typeof note.text !== "string" ? "Invalid note text" : !isDate(note.originDate) ? "Invalid origin date" : typeof note.done !== "boolean" ? "Invalid completion flag" : !Array.isArray(note.links) || note.links.some((l) => !l || !isDate(l.date) || typeof l.id !== "string") ? "Invalid event link" : null;
            if (reason) {
              badNotes.push({ record: note, reason });
              continue;
            }
            noteIds.add(note.id);
            day.dailyNotes.push({ id: note.id, text: note.text, originDate: note.originDate, done: note.done, links: note.links.map((l) => ({ date: l.date, id: l.id })) });
          }
          if (v.version < 7) {
            d.priorities.forEach((text, i) => {
              let id2 = "legacy-outcome:" + date + ":" + i;
              if (text.trim() && !noteIds.has(id2)) {
                day.dailyNotes.push({ id: id2, text, originDate: date, done: !!d.outcomeDone?.[i], links: [] });
                noteIds.add(id2);
              }
            });
            let id = "legacy-notes:" + date;
            if (d.reflection.trim() && !noteIds.has(id)) day.dailyNotes.push({ id, text: d.reflection, originDate: date, done: false, links: [] });
            day.priorities = ["", "", ""];
            day.reflection = "";
          }
          if (badNotes.length) day.noteQuarantine = badNotes;
          out.days[date] = day;
        }
        for (let r of v.recurrences || []) {
          if (typeof r.id !== "string" || out.recurrences.some((x) => x.id === r.id) || !Object.hasOwn(categories, r.cat) || !timing(r) || !isDate(r.startDate) || r.endDate && (!isDate(r.endDate) || r.endDate < r.startDate) || !Array.isArray(r.weekdays) || !r.weekdays.length || r.weekdays.some((w) => !Number.isInteger(w) || w < 0 || w > 6) || typeof (r.details ?? "") !== "string" || typeof (r.notes ?? "") !== "string") throw Error("Invalid recurring schedule.");
          if (r.allowOverlap !== true) delete r.allowOverlap;
          out.recurrences.push({ ...r, skipDaysOff: r.skipDaysOff !== false, details: r.details || "", notes: r.notes || "", weekdays: [...new Set(r.weekdays)] });
        }
        let affected = new Set(Array.isArray(v.holidayMigrationSeriesIds) ? v.holidayMigrationSeriesIds.filter((id) => out.recurrences.some((r) => r.id === id && r.skipDaysOff)) : []);
        for (let r of v.recurrences || []) if (r.skipDaysOff === void 0 && seriesHitsHoliday(out, r)) affected.add(r.id);
        if (affected.size) out.holidayMigrationSeriesIds = [...affected];
        return out;
      }
      function normalize(input) {
        try {
          return normalizeUnsafe(input);
        } catch (e) {
          e.code ??= "VALIDATION";
          throw e;
        }
      }
      function label(data, b) {
        let name = data.categories[b.cat]?.[0] || "Unknown task";
        return b.imported && b.details ? b.details : name + (b.details ? " \xB7 " + b.details : "");
      }
      function occurrenceId(id, date) {
        return `repeat:${id}:${date}`;
      }
      function seriesHitsHoliday(data, r) {
        if ((data.daysOff || []).some((date) => applies(r, date))) return true;
        if (!data.yearlyDaysOff?.length) return false;
        let first = +r.startDate.slice(0, 4), last = Math.min(9999, +(r.endDate || "9999").slice(0, 4), first + 400);
        for (let year = first; year <= last; year++) for (let md of data.yearlyDaysOff) {
          let date = String(year).padStart(4, "0") + "-" + md;
          if (isDate(date) && applies(r, date)) return true;
        }
        return false;
      }
      function applies(r, date) {
        return date >= r.startDate && (!r.endDate || date <= r.endDate) && r.weekdays.includes((/* @__PURE__ */ new Date(date + "T12:00:00")).getDay());
      }
      function blocks(data, date, off) {
        let d = data.days[date] || emptyDay(), result = d.blocks.slice();
        for (let r of data.recurrences) {
          let id = occurrenceId(r.id, date);
          if (applies(r, date) && !(r.skipDaysOff && isDayOff(data, date, off)) && !d.omitted.includes(id) && !result.some((b) => b.id === id)) result.push({ id, cat: r.cat, details: r.details, notes: r.notes, start: r.start, end: r.end, seriesId: r.id, ...r.imported ? { imported: true } : {}, ...r.allowOverlap === true ? { allowOverlap: true } : {}, generated: true });
        }
        return result.sort((a, b) => a.start - b.start);
      }
      function overlaps(data, date, b, ignore = []) {
        return blocks(data, date).some((x) => x.id !== b.id && !ignore.includes(x.id) && b.start < x.end && b.end > x.start);
      }
      function removeOccurrence(data, date, b) {
        let d = data.days[date] ??= emptyDay();
        d.blocks = d.blocks.filter((x) => x.id !== b.id);
        if (b.seriesId && !d.omitted.includes(b.id)) d.omitted.push(b.id);
      }
      function put(data, date, b) {
        let d = data.days[date] ??= emptyDay();
        d.blocks = d.blocks.filter((x) => x.id !== b.id);
        let copy = { ...b };
        delete copy.generated;
        d.blocks.push(copy);
      }
      function week(date) {
        let weekday = (/* @__PURE__ */ new Date(date + "T12:00:00")).getDay(), monday = shift(date, -((weekday + 6) % 7));
        return Array.from({ length: 7 }, (_, i) => shift(date, i - (weekday + 6) % 7)).filter(isDate);
      }
      function recurrenceConflict(data, r, ignoreIds = []) {
        for (let date of Object.keys(data.days)) {
          if (applies(r, date) && blocks(data, date).some((b) => b.seriesId !== r.id && !ignoreIds.includes(b.id) && r.start < b.end && r.end > b.start)) return date;
        }
        for (let other of data.recurrences) {
          if (other.id === r.id || r.start >= other.end || r.end <= other.start) continue;
          let common = r.weekdays.filter((w) => other.weekdays.includes(w));
          if (!common.length) continue;
          let start = r.startDate > other.startDate ? r.startDate : other.startDate, end = [r.endDate, other.endDate].filter(Boolean).sort()[0] || "9999-12-31";
          for (let i = 0; i < 7; i++) {
            let date = shift(start, i);
            if (date <= end && common.includes((/* @__PURE__ */ new Date(date + "T12:00:00")).getDay())) return date;
          }
        }
        return null;
      }
      function merge(base, incoming, uuid) {
        let data = clone(base), report2 = { days: 0, blocks: 0, duplicates: 0, conflicts: 0, series: 0 }, mapping = {};
        for (let [k, c] of Object.entries(incoming.categories)) {
          let key = Object.keys(data.categories).find((x) => data.categories[x][0].toLowerCase() === c[0].toLowerCase());
          if (!key) {
            key = Object.hasOwn(data.categories, k) ? "task_" + uuid() : k;
            data.categories[key] = clone(c);
            data.taskSettings[key] = clone(incoming.taskSettings[k]);
          }
          mapping[k] = key;
        }
        for (let r of incoming.recurrences) {
          if (data.recurrences.some((x) => x.id === r.id)) {
            report2.duplicates++;
            continue;
          }
          let copy = { ...r, cat: mapping[r.cat] };
          data.recurrences.push(copy);
          if (incoming.holidayMigrationSeriesIds?.includes(r.id)) data.holidayMigrationSeriesIds = [.../* @__PURE__ */ new Set([...data.holidayMigrationSeriesIds || [], r.id])];
          report2.series++;
        }
        for (let [date, day] of Object.entries(incoming.days)) {
          let existing = data.days[date];
          if (!existing) {
            data.days[date] = { ...clone(day), blocks: [], ...day.legacyActual ? { legacyActual: [] } : {}, ...day.legacyQuarantine ? { legacyQuarantine: [] } : {} };
            report2.days++;
          }
          let target = data.days[date];
          target.dailyNotes ??= [];
          for (let note of day.dailyNotes || []) if (!target.dailyNotes.some((n) => n.id === note.id)) target.dailyNotes.push(clone(note));
          for (let kind of ["legacyActual", "legacyQuarantine", "noteQuarantine"]) {
            if (!day[kind]?.length) continue;
            target[kind] ??= [];
            let seenLegacy = new Set(target[kind].map((x) => JSON.stringify(x)));
            for (let record of day[kind]) {
              let copy = clone(record);
              if (kind === "legacyActual") copy.cat = mapping[copy.cat] || copy.cat;
              let key = JSON.stringify(copy);
              if (!seenLegacy.has(key)) {
                target[kind].push(copy);
                seenLegacy.add(key);
              }
            }
          }
          for (let i = 0; i < 3; i++) if (!target.priorities[i].trim() && day.priorities[i].trim()) {
            target.priorities[i] = day.priorities[i];
            target.outcomeDone[i] = day.outcomeDone[i];
            (target.outcomeHandled ??= [false, false, false])[i] = !!day.outcomeHandled?.[i];
            target.outcomeIds[i] = day.outcomeIds[i];
            target.carriedTo ??= ["", "", ""];
            target.carriedTo[i] = day.carriedTo?.[i] || "";
          }
          if (!target.reflection.trim()) target.reflection = day.reflection;
          for (let b of day.blocks) {
            if (target.blocks.some((x) => x.id === b.id) || target.omitted.includes(b.id)) {
              report2.duplicates++;
              continue;
            }
            let copy = { ...b, cat: mapping[b.cat] };
            if (copy.seriesId && !data.recurrences.some((r) => r.id === copy.seriesId)) delete copy.seriesId;
            target.blocks.push(copy);
            report2.blocks++;
          }
        }
        for (let [id, t] of Object.entries(incoming.backlog || {})) if (!data.backlog[id]) data.backlog[id] = { ...t, cat: mapping[t.cat] };
        data.completionLog = { ...incoming.completionLog || {}, ...data.completionLog || {} };
        data.yearlyDaysOff = [.../* @__PURE__ */ new Set([...data.yearlyDaysOff || [], ...incoming.yearlyDaysOff || []])];
        data.daysOff = [.../* @__PURE__ */ new Set([...data.daysOff || [], ...incoming.daysOff || []])].sort();
        data.holidayNames = { dates: { ...incoming.holidayNames?.dates, ...data.holidayNames?.dates }, yearly: { ...incoming.holidayNames?.yearly, ...data.holidayNames?.yearly } };
        data.dayTemplates ??= {};
        for (let [id, t] of Object.entries(incoming.dayTemplates || {})) {
          let key = data.dayTemplates[id] ? uuid() : id;
          data.dayTemplates[key] = { name: t.name, blocks: t.blocks.map((b) => ({ ...b, cat: mapping[b.cat] })) };
        }
        return { data, report: report2 };
      }
      function recoverLegacy(input) {
        let raw = clone(input), issues = [];
        for (let [date, d] of Object.entries(raw.days || {})) {
          if (!isDate(date) || !d || !Array.isArray(d.blocks) || !Array.isArray(d.priorities) || d.priorities.length !== 3 || !d.priorities.every((x) => typeof x === "string") || typeof d.reflection !== "string") {
            issues.push({ date, record: d, reason: "Invalid day structure" });
            delete raw.days[date];
            continue;
          }
          let valid = [], seen = /* @__PURE__ */ new Set();
          for (let b of d.blocks) {
            try {
              normalize({ ...raw, days: { [date]: { ...d, blocks: [b] } }, recurrences: [] });
              if (seen.has(b.id)) throw Error("Duplicate entry ID");
              seen.add(b.id);
              valid.push(b);
            } catch (e) {
              issues.push({ date, record: b, reason: e.message });
            }
          }
          d.blocks = valid;
        }
        let good = normalize(raw);
        good.migrationIssues = issues.length;
        return { data: good, issues };
      }
      function dayOffLookup(data) {
        return { dates: new Set(data.daysOff || []), yearly: new Set(data.yearlyDaysOff || []) };
      }
      function isDayOff(data, date, off) {
        return off ? off.dates.has(date) || off.yearly.has(date.slice(5)) : (data.daysOff || []).includes(date) || (data.yearlyDaysOff || []).includes(date.slice(5));
      }
      function workingDay(data, date, off) {
        return !isDayOff(data, date, off) && (data.workingDays?.length ? data.workingDays : [1, 2, 3, 4, 5]).includes((/* @__PURE__ */ new Date(date + "T12:00:00")).getDay());
      }
      function nextWorkingDay(data, date, direction = 1, off = dayOffLookup(data)) {
        if (!isDate(date) || ![1, -1].includes(direction)) return null;
        let next = date;
        for (let searched = 0; searched < 3660; searched++) {
          next = shift(next, direction);
          if (!isDate(next)) return null;
          if (workingDay(data, next, off)) return next;
        }
        return null;
      }
      function carryOutcomes(data, target, uuid, sourceDate, onlyIndex) {
        if (!isDate(target)) return 0;
        if (!workingDay(data, target)) target = nextWorkingDay(data, target);
        if (!target) return 0;
        let date = sourceDate || Object.keys(data.days).filter((d) => d < target && d >= shift(target, -7) && workingDay(data, d) && data.days[d].priorities.some((x) => x.trim())).sort().at(-1), source = data.days[date];
        if (!source || date >= target) return 0;
        let eligible = (i) => (onlyIndex === void 0 || i === onlyIndex) && source.priorities[i].trim() && !source.outcomeDone[i] && !source.outcomeHandled?.[i] && !source.carriedTo[i];
        if (![0, 1, 2].some(eligible)) return 0;
        let changed = 0, dest = data.days[target] ??= emptyDay(), known = new Set([...Object.values(data.backlog || {}).map((t) => t.originId), ...dest.outcomeIds].filter(Boolean));
        for (let i = 0; i < 3; i++) {
          let title = source.priorities[i].trim(), origin = source.outcomeIds[i] || date + ":" + i;
          if (!eligible(i) || known.has(origin)) continue;
          let slot = dest.priorities.findIndex((x) => !x.trim());
          if (slot >= 0) {
            dest.priorities[slot] = title;
            dest.outcomeIds[slot] = origin;
            dest.outcomeDone[slot] = false;
            (dest.outcomeHandled ??= [false, false, false])[slot] = false;
          } else {
            let id = "outcome-" + origin;
            data.backlog[id] = { id, title, cat: Object.keys(data.categories).find((k) => !data.taskSettings[k]?.archived) || Object.keys(data.categories)[0], notes: "Carried from " + date, dueDate: target, done: false, createdDate: target, originId: origin, autoCarriedFrom: date, originalCarriedTitle: title };
          }
          source.outcomeIds[i] = origin;
          source.carriedTo[i] = target;
          known.add(origin);
          changed++;
        }
        return changed;
      }
      function csvCell(value) {
        let text = String(value ?? "");
        if (/^[=+@\-\t\r\n]/.test(text)) text = "'" + text;
        return '"' + text.replaceAll('"', '""') + '"';
      }
      function datePrefix(query) {
        return [...query.matchAll(/\b\d{4}(?:-\d{2}(?:-\d{2})?)?\b/g)].map((m) => m[0]).find((s) => s.length === 4 ? +s >= 1900 && +s <= 2100 : s.length === 7 ? isDate(s + "-01") : isDate(s));
      }
      function report(data, from, to, today = dateKey()) {
        let off = dayOffLookup(data);
        let byTask = {}, scheduled = 0, completed = 0, tracked = 0, outcomes = 0, outcomesDone = 0, rows = [];
        for (let date of dates(from, to)) {
          let d = data.days[date];
          if (d) {
            for (let i = 0; i < 3; i++) if (d.priorities[i].trim()) {
              outcomes++;
              if (d.outcomeDone[i]) outcomesDone++;
            }
          }
          for (let b of blocks(data, date, off)) {
            let mins = b.end - b.start, t = (b.backlogId ? data.backlog[b.backlogId] : null) || (typeof b.taskDone === "boolean" ? { done: b.taskDone } : null);
            scheduled += mins;
            byTask[b.cat] = (byTask[b.cat] || 0) + mins;
            if (t) {
              tracked += mins;
              if (t.done) completed += mins;
            }
            rows.push({ date, b, status: t ? t.done ? "Linked task marked done" : "Linked task not marked done" : "Not tracked" });
          }
        }
        let completions = { ...data.completionLog || {} };
        for (let [id, t] of Object.entries(data.backlog)) {
          delete completions[id];
          if (t.done && isDate(t.completedDate)) completions[id] = t;
        }
        let backlogDone = Object.values(completions).filter((t) => t.completedDate >= from && t.completedDate <= to).length;
        let allDone = (date) => {
          let d = data.days[date];
          return !!d && d.priorities.some((x) => x.trim()) && d.priorities.every((x, i) => !x.trim() || d.outcomeDone[i]);
        };
        let end = today, streak = 0;
        if (!workingDay(data, end, off) || !allDone(end)) end = nextWorkingDay(data, end, -1, off);
        while (allDone(end)) {
          streak++;
          end = nextWorkingDay(data, end, -1);
        }
        let undatedCompletions = Object.values(completions).filter((t) => t.dateUnknown || !isDate(t.completedDate)).length + Object.values(data.backlog).filter((t) => t.done && !isDate(t.completedDate)).length;
        return { undatedCompletions, byTask, scheduled, completed, tracked, outcomes, outcomesDone, backlogDone, streak, rows, noWorkingDay: end === null };
      }
      function carriedIndex(data) {
        let scheduled = /* @__PURE__ */ new Set(), originals = /* @__PURE__ */ new Map();
        for (let [date, day] of Object.entries(data.days)) {
          for (let b of day.blocks) if (b.backlogId) scheduled.add(b.backlogId);
          day.priorities.forEach((title, i) => {
            let id = day.outcomeIds?.[i];
            if (id && !originals.has(id)) originals.set(id, title);
          });
        }
        return { scheduled, originals };
      }
      function carriedStatus(data, t, index) {
        let source = t.autoCarriedFrom || t.originId && (/^\d{4}-\d{2}-\d{2}/.exec(t.originId)?.[0] || /^Carried from (\d{4}-\d{2}-\d{2})$/.exec(t.notes)?.[1]);
        let scheduled = !!t.everScheduled || (index ? index.scheduled.has(t.id) : Object.values(data.days).some((d) => d.blocks.some((b) => b.backlogId === t.id)));
        let original = t.originalCarriedTitle || (index ? index.originals.get(t.originId) : Object.values(data.days).flatMap((d) => d.priorities.map((title, i) => ({ title, origin: d.outcomeIds?.[i] }))).find((x) => x.origin === t.originId)?.title);
        let edited = !!t.userEdited || t.notes !== "Carried from " + source || !!original && t.title !== original || !original || !!t.createdDate && t.dueDate !== t.createdDate;
        return { source, scheduled, edited, completed: !!t.done, safe: isDate(source) && !t.done && !scheduled && !edited };
      }
      function oldCarriedItems(data, age, today = dateKey()) {
        let cutoff = shift(today, -age), index = carriedIndex(data);
        return Object.values(data.backlog).filter((t) => {
          let status = carriedStatus(data, t, index);
          return status.safe && status.source < cutoff;
        }).map((t) => t.id);
      }
      function unresolvedOutcomes(data, today = dateKey()) {
        let result = [], known = new Set([...Object.values(data.backlog).map((t) => t.originId), ...Object.values(data.completionLog || {}).map((t) => t.originId)].filter(Boolean));
        for (let date of Object.keys(data.days).filter((d) => d < today).sort().reverse()) {
          let day = data.days[date];
          day.priorities.forEach((title, i) => {
            let origin = day.outcomeIds?.[i] || date + ":" + i;
            if (title.trim() && !day.outcomeDone?.[i] && !day.outcomeHandled?.[i] && !day.carriedTo?.[i] && !known.has(origin)) {
              result.push({ date, index: i, title, origin });
              known.add(origin);
            }
          });
        }
        return result;
      }
      function doubleBookings(entries) {
        let result = /* @__PURE__ */ new Set(), busy = entries.filter((b) => !b.allowOverlap).sort((a, b) => a.start - b.start);
        for (let i = 0; i < busy.length; i++) for (let j = i + 1; j < busy.length && busy[j].start < busy[i].end; j++) if (busy[i].start < busy[j].end) {
          result.add(busy[i].id);
          result.add(busy[j].id);
        }
        return result;
      }
      function layoutBlocks(entries) {
        let result = {}, group = [], end = -1;
        function finish() {
          let ends = [], assign = [];
          for (let b of group) {
            let col = ends.findIndex((e) => e <= b.start);
            if (col < 0) col = ends.length;
            ends[col] = b.end;
            assign.push([b.id, col]);
          }
          for (let [id, col] of assign) result[id] = { column: col, columns: ends.length };
          group = [];
        }
        for (let b of [...entries].sort((a, b2) => a.start - b2.start || b2.end - a.end || a.id.localeCompare(b2.id))) {
          if (b.start >= end) {
            finish();
            end = -1;
          }
          group.push(b);
          end = Math.max(end, b.end);
        }
        finish();
        return result;
      }
      function removeBacklog(data, ids) {
        let remove = new Set(ids.filter((id) => data.backlog[id]));
        for (let d of Object.values(data.days)) for (let b of d.blocks) if (remove.has(b.backlogId)) {
          b.taskDone = !!data.backlog[b.backlogId].done;
          delete b.backlogId;
        }
        for (let id of remove) {
          let t = data.backlog[id];
          if (t.done) (data.completionLog ??= {})[id] = { title: t.title, cat: t.cat, completedDate: isDate(t.completedDate) ? t.completedDate : null, ...!isDate(t.completedDate) ? { dateUnknown: true } : {}, originId: t.originId || null };
          delete data.backlog[id];
        }
        return remove.size;
      }
      function captureDayTemplate(data, date, name) {
        return { name, blocks: blocks(data, date).map(({ cat, details, notes, start, end, allowOverlap, imported }) => ({ cat, details, notes, start, end, ...imported ? { imported: true } : {}, ...allowOverlap === true ? { allowOverlap: true } : {} })) };
      }
      function applyDayTemplate(data, id, date, uuid) {
        let template = data.dayTemplates?.[id];
        if (!template || !isDate(date)) throw Error("Choose a template and date.");
        let added = 0, skipped = 0;
        for (let block of template.blocks) {
          let b = { ...block, id: uuid() };
          if (b.start < data.start * 60 || b.end > data.end * 60 || blocks(data, date).some((x) => x.cat === b.cat && x.details === b.details && x.notes === b.notes && x.start === b.start && x.end === b.end)) {
            skipped++;
            continue;
          }
          put(data, date, b);
          added++;
        }
        return { added, skipped };
      }
      function monthDates(date) {
        if (!isDate(date)) throw Error("Choose a valid date.");
        let first = date.slice(0, 7) + "-01", last = new Date(+date.slice(0, 4), +date.slice(5, 7), 0);
        return [...dates(first, dateKey(last), 31)];
      }
      function shiftMonth(date, delta) {
        let [y, m, d] = date.split("-").map(Number), next = new Date(y, m - 1 + delta, 1);
        next.setDate(Math.min(d, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        let result = dateKey(next);
        return isDate(result) ? result : date;
      }
      function copyBlock(data, source, date, start, includeNotes, uuid) {
        if (!isDate(date) || !data.categories[source.cat]) throw Error("Choose a valid date and task.");
        let block = { id: uuid(), cat: source.cat, details: source.details || "", notes: includeNotes ? source.notes || "" : "", start, end: start + source.end - source.start, ...source.imported ? { imported: true } : {}, ...source.allowOverlap ? { allowOverlap: true } : {} };
        if (!timing(block)) throw Error("The copied block must fit within one day. Choose an earlier start time.");
        put(data, date, block);
        data.start = Math.min(data.start, Math.floor(block.start / 60));
        data.end = Math.max(data.end, Math.ceil(block.end / 60));
        return block;
      }
      function carryNotes(data, from, to) {
        if (!isDate(from) || !isDate(to)) throw Error("Choose a supported date.");
        let source = data.days[from]?.dailyNotes || [], target = data.days[to] ??= emptyDay(), count = 0;
        target.dailyNotes ??= [];
        for (let note of source) if (!note.done && !target.dailyNotes.some((n) => n.id === note.id)) {
          target.dailyNotes.push(clone(note));
          count++;
        }
        return count;
      }
      const api = { monthDates, shiftMonth, copyBlock, carryNotes, doubleBookings, carriedIndex, dates, isDayOff, layoutBlocks, carriedStatus, unresolvedOutcomes, oldCarriedItems, removeBacklog, captureDayTemplate, applyDayTemplate, workingDay, nextWorkingDay, csvCell, datePrefix, recoverLegacy, carryOutcomes, report, defaults, clone, dateKey, shift, isDate, emptyDay, fresh, normalize, timing, label, occurrenceId, applies, blocks, overlaps, removeOccurrence, put, week, recurrenceConflict, merge };
      if (typeof module2 !== "undefined") module2.exports = api;
      else root.PlannerCore = api;
    })(globalThis);
  }
});

// external-backup.cjs
var require_external_backup = __commonJS({
  "external-backup.cjs"(exports2, module2) {
    var fs = require("node:fs");
    var path = require("node:path");
    var crypto = require("node:crypto");
    var ExternalBackup = class {
      constructor(profile) {
        this.profile = path.resolve(profile);
        this.file = path.join(profile, "external-backup.json");
        this.config = {};
        try {
          this.config = JSON.parse(fs.readFileSync(this.file, "utf8"));
        } catch (e) {
          if (e.code !== "ENOENT") this.error = "External backup settings are unreadable. Choose the folder again.";
        }
        this.folder = this.config.folder;
        this.lastCopied = /* @__PURE__ */ new Map();
      }
      configure(base) {
        if (typeof base !== "string" || !path.isAbsolute(base)) throw Error("Choose an absolute folder outside the planner profile.");
        if (/^\\\\/.test(base)) throw Error("Network paths are not supported. Choose a local disk, USB drive, or locally synchronized cloud folder.");
        let resolved;
        try {
          resolved = fs.realpathSync(base);
        } catch {
          throw Error("The selected backup folder does not exist or is unavailable. Reconnect the drive or choose an existing folder.");
        }
        let profile = fs.realpathSync(this.profile), relative = path.relative(profile, resolved);
        if (!relative || !relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative)) throw Error("Choose a folder outside the planner profile.");
        let id = this.config.id || crypto.randomUUID(), folder = path.join(resolved, "Daymark-backups-" + id);
        fs.mkdirSync(folder, { recursive: true });
        let probe = path.join(folder, ".write-test");
        fs.writeFileSync(probe, "");
        fs.unlinkSync(probe);
        this.config = { id, base: resolved, folder };
        fs.writeFileSync(this.file + ".tmp", JSON.stringify(this.config));
        fs.renameSync(this.file + ".tmp", this.file);
        this.folder = folder;
        this.error = null;
        this.lastCopied.clear();
        return this.status();
      }
      disable() {
        fs.rmSync(this.file, { force: true });
        this.config = {};
        this.folder = null;
        this.error = null;
        return this.status();
      }
      status() {
        return { folder: this.folder || null, error: this.error || null, lastSuccess: this.lastSuccess || null };
      }
      mirror(local) {
        if (!this.folder) return this.status();
        if (!fs.existsSync(this.config.base) || !fs.existsSync(this.folder)) throw Error("Second backup folder unavailable. Reconnect the drive or choose a folder again.");
        let names = fs.readdirSync(local).filter((n) => /^(daily-|monthly-|intraday-|checkpoint-|recent-|before-).+\.json\.gz$/.test(n));
        for (let name of names) {
          let source = path.join(local, name), stat = fs.statSync(source), stamp = stat.mtimeMs + ":" + stat.size;
          if (this.lastCopied.get(name) === stamp && fs.existsSync(path.join(this.folder, name))) continue;
          let target = path.join(this.folder, name), tmp = target + ".tmp";
          if (!name.startsWith("recent-") && fs.existsSync(target)) {
            this.lastCopied.set(name, stamp);
            continue;
          }
          fs.copyFileSync(source, tmp);
          let fd = fs.openSync(tmp, "r+");
          try {
            fs.fsyncSync(fd);
          } finally {
            fs.closeSync(fd);
          }
          fs.renameSync(tmp, target);
          this.lastCopied.set(name, stamp);
        }
        const now = Date.now(), DAY = 864e5;
        for (let name of fs.readdirSync(this.folder)) {
          let match = /^(intraday|checkpoint|daily|monthly|before-restore)-(\d{4}-\d{2})(?:-(\d{2}))?/.exec(name);
          if (!match || !name.endsWith(".json.gz")) continue;
          let ageLimit = ["intraday", "checkpoint"].includes(match[1]) ? 7 * DAY : match[1] === "daily" ? 30 * DAY : match[1] === "monthly" ? 400 * DAY : 90 * DAY;
          let stamp = Date.parse(match[2] + "-" + (match[3] || "01") + "T00:00:00Z");
          if (Number.isFinite(stamp) && now - stamp > ageLimit + DAY) fs.unlinkSync(path.join(this.folder, name));
        }
        this.lastSuccess = (/* @__PURE__ */ new Date()).toISOString();
        this.error = null;
        return this.status();
      }
    };
    module2.exports = { ExternalBackup };
  }
});

// storage.cjs
var require_storage = __commonJS({
  "storage.cjs"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var zlib = require("zlib");
    var { DatabaseSync } = require("node:sqlite");
    var Core = require_core();
    function snapshotJson(data) {
      return JSON.stringify(Object.fromEntries(Object.keys(data).sort().map((key) => [key, key === "days" ? Object.fromEntries(Object.entries(data.days).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : data[key]])));
    }
    var PlannerStorage2 = class {
      constructor(dir, clock = () => /* @__PURE__ */ new Date(), options = {}) {
        this.backupSetTimeout = options.setTimeout || setTimeout;
        this.backupClearTimeout = options.clearTimeout || clearTimeout;
        this.onBackupStatus = options.onBackupStatus || (() => {
        });
        this.backupQuietMs = 2e3;
        this.backupMaxMs = 3e4;
        this.backupDirty = false;
        this.backupFirstDirty = null;
        this.backupTimer = null;
        this.backupError = null;
        this.dir = dir;
        this.clock = clock;
        fs.mkdirSync(dir, { recursive: true });
        this.backups = path.join(dir, "backups");
        fs.mkdirSync(this.backups, { recursive: true });
        this.db = new DatabaseSync(path.join(dir, "planner.sqlite"));
        this.db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS days (date TEXT PRIMARY KEY, json TEXT NOT NULL); CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(date UNINDEXED, id UNINDEXED, body);");
        this.db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS extra_search USING fts5(date UNINDEXED,id UNINDEXED,kind UNINDEXED,title,body)");
        if (!this.db.prepare("SELECT value FROM meta WHERE key='planner'").get()) {
          let old = path.join(dir, "planner.json");
          let legacyInput = fs.existsSync(old) ? JSON.parse(fs.readFileSync(old, "utf8")) : null;
          this.legacyTheme = ["dark", "light", "system"].includes(legacyInput?.theme) ? legacyInput.theme : void 0;
          let recovery = legacyInput ? Core.recoverLegacy(legacyInput) : { data: Core.fresh(), issues: [] }, initial = recovery.data;
          this.write(initial);
          if (fs.existsSync(old)) this.backupNamed("before-sqlite-migration", JSON.parse(fs.readFileSync(old, "utf8")));
          if (recovery.issues.length) fs.writeFileSync(path.join(this.backups, "migration-quarantine.json"), JSON.stringify(recovery.issues, null, 2));
        }
        this.external = new (require_external_backup()).ExternalBackup(dir);
        this.cache = this.read();
        this.legacyTheme ??= this.cache.version < 4 && ["dark", "light", "system"].includes(this.cache.theme) ? this.cache.theme : this.db.prepare("SELECT value FROM meta WHERE key='legacy-theme'").get()?.value;
        if (this.cache.version > 8) {
          this.db.close();
          throw Error("This planner uses a newer schema. Open it with a newer Daymark version.");
        }
        if (this.legacyTheme) this.db.prepare("INSERT OR IGNORE INTO meta(key,value) VALUES('legacy-theme',?)").run(this.legacyTheme);
        if (this.cache.version < 8) {
          if (this.cache.version < 4) this.backupNamed("before-schema-4", this.cache);
          if (this.cache.version < 5) this.backupNamed("before-schema-5", this.cache);
          if (this.cache.version < 6) this.backupNamed("before-schema-6", this.cache);
          this.backupNamed("before-schema-8", this.cache);
          this.cache = Core.normalize(this.cache);
          this.write(this.cache);
        }
        this.db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS extra_search USING fts5(date UNINDEXED,id UNINDEXED,kind UNINDEXED,title,body)");
        if (!this.db.prepare("SELECT value FROM meta WHERE key='extra-search-version'").get()) {
          this.db.exec("BEGIN IMMEDIATE");
          try {
            for (let [date, day] of Object.entries(this.cache.days)) this.indexExtras(date, day);
            this.indexBacklog(this.cache);
            this.db.prepare("INSERT INTO meta(key,value) VALUES('extra-search-version','1')").run();
            this.db.exec("COMMIT");
          } catch (e) {
            this.db.exec("ROLLBACK");
            throw e;
          }
        }
        this.loadRecent();
        this.protectHistorical();
        this.pruneCheckpoints();
        if (this.hasMeaningfulData(this.cache)) this.queueRecent();
      }
      indexExtras(date, day) {
        this.db.prepare("DELETE FROM extra_search WHERE date=? AND kind!='backlog'").run(date);
        if (!day) return;
        let insert = this.db.prepare("INSERT INTO extra_search(date,id,kind,title,body) VALUES(?,?,?,?,?)");
        for (let note of day.dailyNotes || []) insert.run(date, note.id, "daily-note", note.text, "Origin: " + note.originDate);
        if (day.reflection.trim() && !day.dailyNotes?.some((n) => n.id === "legacy-notes:" + date)) insert.run(date, "daily-notes", "notes", "Daily notes", day.reflection);
        day.priorities.forEach((title, i) => {
          if (title.trim() && !day.dailyNotes?.some((n) => n.id === "legacy-outcome:" + date + ":" + i)) insert.run(date, "outcome:" + i, "outcome", title, "");
        });
      }
      indexBacklog(data) {
        this.db.prepare("DELETE FROM extra_search WHERE kind='backlog'").run();
        let insert = this.db.prepare("INSERT INTO extra_search(date,id,kind,title,body) VALUES(?,?,?,?,?)");
        for (let t of Object.values(data.backlog || {})) insert.run(t.dueDate || t.createdDate || "", t.id, "backlog", t.title, [data.categories[t.cat]?.[0], t.notes].join(" "));
      }
      read() {
        let row = this.db.prepare("SELECT value FROM meta WHERE key='planner'").get();
        let data = JSON.parse(row.value);
        data.days = {};
        for (let d of this.db.prepare("SELECT date,json FROM days").all()) data.days[d.date] = JSON.parse(d.json);
        return data;
      }
      atomicBackup(name, bytes) {
        let file = path.join(this.backups, name + ".json.gz"), tmp = file + ".tmp", fd;
        try {
          fd = fs.openSync(tmp, "w");
          fs.writeFileSync(fd, bytes);
          fs.fsyncSync(fd);
          fs.closeSync(fd);
          fd = void 0;
          fs.renameSync(tmp, file);
        } catch (e) {
          if (fd !== void 0) try {
            fs.closeSync(fd);
          } catch {
          }
          try {
            fs.unlinkSync(tmp);
          } catch {
          }
          throw e;
        }
      }
      backupNamed(name, data = this.cache) {
        let file = path.join(this.backups, name + ".json.gz");
        if (fs.existsSync(file)) return;
        this.atomicBackup(name, zlib.gzipSync(JSON.stringify(data)));
      }
      hasMeaningfulData(data) {
        return Object.keys(data.days || {}).length || data.recurrences?.length || Object.keys(data.backlog || {}).length || Object.keys(data.completionLog || {}).length || Object.keys(data.dayTemplates || {}).length || data.daysOff?.length || data.yearlyDaysOff?.length || data.start !== 8 || data.end !== 18 || JSON.stringify(data.categories) !== JSON.stringify(Core.defaults) || JSON.stringify(data.workingDays) !== JSON.stringify([1, 2, 3, 4, 5]) || Object.values(data.taskSettings || {}).some((t) => t.archived || t.duration !== 30);
      }
      backupStatus(error) {
        this.backupError = error ? error.message : null;
        this.onBackupStatus({ error: this.backupError });
      }
      protectHistorical() {
        try {
          this.dailyBackups(this.cache);
        } catch (e) {
          this.backupStatus(e);
        }
      }
      queueRecent() {
        this.backupDirty = true;
        this.backupFirstDirty ??= this.clock().getTime();
        this.backupClearTimeout(this.backupTimer);
        let remaining = Math.max(0, this.backupMaxMs - (this.clock().getTime() - this.backupFirstDirty));
        this.backupTimer = this.backupSetTimeout(() => {
          this.backupTimer = null;
          try {
            this.flushRecent();
          } catch {
          }
        }, Math.min(this.backupQuietMs, remaining));
        this.backupTimer?.unref?.();
      }
      afterCommit() {
        this.protectHistorical();
        this.queueRecent();
      }
      loadRecent() {
        this.recentValid = false;
        this.recentHash = null;
        this.recentBytes = null;
        try {
          let bytes = fs.readFileSync(path.join(this.backups, "recent-current.json.gz")), json = zlib.gunzipSync(bytes).toString("utf8");
          let restored = JSON.parse(json);
          Core.normalize(restored);
          json = snapshotJson(restored);
          this.recentBytes = bytes;
          this.recentHash = require("node:crypto").createHash("sha256").update(json).digest("hex");
          this.recentValid = true;
        } catch {
        }
      }
      flushRecent() {
        this.backupClearTimeout(this.backupTimer);
        this.backupTimer = null;
        if (!this.backupDirty && !this.backupError) return { ok: true };
        try {
          this.dailyBackups(this.cache);
          let json = snapshotJson(this.cache), hash = require("node:crypto").createHash("sha256").update(json).digest("hex");
          if (!this.recentValid || hash !== this.recentHash) {
            let bytes = zlib.gzipSync(json, { level: 1 });
            if (this.recentValid) this.atomicBackup("recent-previous", this.recentBytes);
            this.atomicBackup("recent-current", bytes);
            this.recentBytes = bytes;
            this.recentHash = hash;
            this.recentValid = true;
          }
          this.backupDirty = false;
          this.backupFirstDirty = null;
          try {
            this.external.mirror(this.backups);
            this.backupStatus(this.external.error ? Error(this.external.error) : null);
          } catch (e) {
            this.external.error = e.message;
            this.backupStatus(e);
            this.backupTimer = this.backupSetTimeout(() => {
              try {
                this.flushRecent();
              } catch {
              }
            }, 6e4);
            this.backupTimer?.unref?.();
          }
          return { ok: true };
        } catch (e) {
          this.backupStatus(e);
          this.backupTimer = this.backupSetTimeout(() => {
            this.backupTimer = null;
            try {
              this.flushRecent();
            } catch {
            }
          }, this.backupMaxMs);
          this.backupTimer?.unref?.();
          throw e;
        }
      }
      dailyBackups(data) {
        if (!this.hasMeaningfulData(data)) return;
        let now = this.clock(), quarter = new Date(Math.floor(now.getTime() / 9e5) * 9e5).toISOString().slice(0, 16).replaceAll(":", "-");
        this.backupNamed("intraday-" + quarter, data);
        let recent = fs.readdirSync(this.backups).filter((f) => /^intraday-.*\.json\.gz$/.test(f)).sort().reverse();
        for (let [index, name] of recent.entries()) {
          let match = /^intraday-(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})\.json\.gz$/.exec(name);
          if (index >= 20 && match && Date.parse(match[1] + ":" + match[2] + ":00Z") + 9e5 < now.getTime() - 24 * 60 * 60 * 1e3) fs.unlinkSync(path.join(this.backups, name));
        }
        let date = Core.dateKey(now);
        this.backupNamed("daily-" + date, data);
        this.backupNamed("monthly-" + date.slice(0, 7), data);
        let files = fs.readdirSync(this.backups).filter((f) => /^daily-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f)).sort().reverse();
        for (let name of files.slice(14)) fs.unlinkSync(path.join(this.backups, name));
      }
      write(data) {
        let { days, ...meta } = data;
        let oldMeta = this.db.prepare("SELECT value FROM meta WHERE key='planner'").get()?.value;
        let oldCats = oldMeta ? JSON.parse(oldMeta).categories : null, rename = JSON.stringify(oldCats) !== JSON.stringify(meta.categories);
        let changed = 0;
        this.db.exec("BEGIN IMMEDIATE");
        try {
          this.db.prepare("INSERT INTO meta(key,value) VALUES('planner',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(meta));
          let oldDates = this.db.prepare("SELECT date,json FROM days").all(), oldMap = new Map(oldDates.map((r) => [r.date, r.json]));
          for (let [date, day] of Object.entries(days)) {
            let json = JSON.stringify(day);
            if (oldMap.get(date) !== json) {
              this.db.prepare("INSERT INTO days(date,json) VALUES(?,?) ON CONFLICT(date) DO UPDATE SET json=excluded.json").run(date, json);
              changed++;
            }
            if (oldMap.get(date) !== json || rename) {
              this.indexExtras(date, day);
              this.db.prepare("DELETE FROM search WHERE date=?").run(date);
              for (let b of day.blocks) this.db.prepare("INSERT INTO search(date,id,body) VALUES(?,?,?)").run(date, b.id, [Core.label(data, b), b.notes].join(" "));
            }
            oldMap.delete(date);
          }
          for (let date of oldMap.keys()) {
            this.indexExtras(date, null);
            this.db.prepare("DELETE FROM days WHERE date=?").run(date);
            this.db.prepare("DELETE FROM search WHERE date=?").run(date);
          }
          this.indexBacklog(data);
          this.db.exec("COMMIT");
          return changed;
        } catch (e) {
          this.db.exec("ROLLBACK");
          throw e;
        }
      }
      save(value) {
        let data = Core.normalize(typeof value === "string" ? JSON.parse(value) : value);
        this.protectHistorical();
        let changed = this.write(data);
        this.cache = data;
        this.afterCommit();
        return { ok: true, changedDays: changed, appliedState: data, backupWarning: this.backupError };
      }
      patch(payload) {
        let nextMeta = payload.meta || (({ days, ...meta2 }) => meta2)(this.cache), validated = Core.normalize({ ...nextMeta, days: Object.fromEntries(Object.entries(payload.days || {}).filter(([k, v]) => v !== null)) }), { days: changes, ...meta } = validated;
        if (Object.keys(this.cache.categories).some((key) => !Object.hasOwn(meta.categories, key))) {
          let finalDays = { ...this.cache.days };
          for (let [date, value] of Object.entries(payload.days || {})) {
            if (value === null) delete finalDays[date];
            else finalDays[date] = changes[date];
          }
          for (let [date, day] of Object.entries(finalDays)) for (let block of [...day.blocks, ...day.legacyActual || []]) if (!Object.hasOwn(meta.categories, block.cat)) throw Object.assign(Error("Task category " + block.cat + " is still referenced by a calendar entry on " + date + ". Reassign or remove that entry first."), { code: "VALIDATION" });
        }
        this.protectHistorical();
        let rename = JSON.stringify(meta.categories) !== JSON.stringify(this.cache.categories), cacheDays = { ...this.cache.days };
        this.db.exec("BEGIN IMMEDIATE");
        try {
          if (payload.meta || JSON.stringify(meta.holidayNames) !== JSON.stringify(this.cache.holidayNames)) this.db.prepare("UPDATE meta SET value=? WHERE key='planner'").run(JSON.stringify(meta));
          for (let [date, value] of Object.entries(payload.days || {})) {
            this.indexExtras(date, changes[date]);
            if (!Core.isDate(date)) throw Error("Invalid day");
            this.db.prepare("DELETE FROM search WHERE date=?").run(date);
            if (value === null) {
              this.db.prepare("DELETE FROM days WHERE date=?").run(date);
              delete cacheDays[date];
            } else {
              let day = changes[date];
              cacheDays[date] = day;
              this.db.prepare("INSERT INTO days(date,json) VALUES(?,?) ON CONFLICT(date) DO UPDATE SET json=excluded.json").run(date, JSON.stringify(day));
              if (!rename) for (let b of day.blocks) this.db.prepare("INSERT INTO search(date,id,body) VALUES(?,?,?)").run(date, b.id, [Core.label(validated, b), b.notes].join(" "));
            }
          }
          if (rename) {
            this.db.exec("DELETE FROM search");
            for (let [date, day] of Object.entries(cacheDays)) for (let b of day.blocks) this.db.prepare("INSERT INTO search(date,id,body) VALUES(?,?,?)").run(date, b.id, [Core.label(validated, b), b.notes].join(" "));
          }
          if (payload.meta) this.indexBacklog(validated);
          this.db.exec("COMMIT");
          this.cache = { ...meta, days: cacheDays };
          this.afterCommit();
          return { ok: true, changedDays: Object.keys(payload.days || {}).length, applied: { ...payload.meta ? { meta } : {}, days: Object.fromEntries(Object.entries(payload.days || {}).map(([date, value]) => [date, value === null ? null : changes[date]])) }, backupWarning: this.backupError };
        } catch (e) {
          this.db.exec("ROLLBACK");
          throw e;
        }
      }
      search(value) {
        let structured = typeof value === "object", query = structured ? value.query : value, prefix = Core.datePrefix(query);
        if (!prefix || prefix.length !== 4) return this.searchBranch(value);
        let options = structured ? value : { query };
        let a = this.searchBranch({ ...options, all: true, offset: 0 }), b = this.searchBranch({ ...options, all: true, offset: 0 }, true), unique = /* @__PURE__ */ new Map();
        for (let x of [...b.items, ...a.items]) {
          let key = JSON.stringify([x.kind || "block", x.date, x.id]);
          if (!unique.has(key)) unique.set(key, x);
        }
        let matches = [...unique.values()].sort((a2, b2) => a2.rank - b2.rank || b2.date.localeCompare(a2.date) || (a2.b?.start || 0) - (b2.b?.start || 0) || a2.id.localeCompare(b2.id));
        if (!structured) return matches;
        let offset = Math.max(0, +value.offset || 0);
        return { items: matches.slice(offset, offset + 100), total: matches.length, virtualTo: a.virtualTo > b.virtualTo ? a.virtualTo : b.virtualTo };
      }
      searchBranch(value, textOnly = false) {
        let entriesByDate = /* @__PURE__ */ new Map();
        const entries = (date) => {
          if (!entriesByDate.has(date)) entriesByDate.set(date, new Map(Core.blocks(this.cache, date).map((b) => [b.id, b])));
          return entriesByDate.get(date);
        };
        let structured = typeof value === "object", query = structured ? value.query : value, from = structured ? value.from : "", to = structured ? value.to : "", prefix = textOnly ? null : Core.datePrefix(query);
        let terms = (prefix ? query.replace(prefix, "") : query).match(/[\p{L}\p{N}]+/gu) || [], params = [], clauses = [];
        if (terms.length) {
          clauses.push("search MATCH ?");
          params.push(terms.map((w) => '"' + w + '"*').join(" AND "));
        }
        if (prefix) {
          clauses.push("date LIKE ?");
          params.push(prefix + "%");
        }
        if (from) {
          clauses.push("date>=?");
          params.push(from);
        }
        if (to) {
          clauses.push("date<=?");
          params.push(to);
        }
        if (!clauses.length && structured && (value.type || value.task)) clauses.push("1=1");
        if (!clauses.length) return structured ? { items: [], total: 0 } : [];
        let matches = this.db.prepare("SELECT date,id," + (terms.length ? "bm25(search)" : "0") + " AS rank FROM search WHERE " + clauses.join(" AND ") + " ORDER BY " + (terms.length ? "rank," : "") + "date DESC").all(...params).map((x) => ({ ...x, b: entries(x.date).get(x.id) })).filter((x) => x.b), seen = new Set(matches.map((x) => x.date + x.id));
        let extraClauses = clauses.map((c) => c.replace("search MATCH", "extra_search MATCH"));
        let extras = this.db.prepare("SELECT date,id,kind,title,body," + (terms.length ? "bm25(extra_search)" : "0") + " AS rank FROM extra_search WHERE " + extraClauses.join(" AND ")).all(...params);
        matches.push(...extras);
        let virtualFrom = from || this.cache.recurrences.map((r) => r.startDate).sort()[0] || Core.dateKey(), virtualTo = to || Core.shift(Core.dateKey(), 365);
        if (prefix) {
          if (prefix.length === 4) {
            virtualFrom = prefix + "-01-01";
            virtualTo = prefix + "-12-31";
          } else if (prefix.length === 7) {
            virtualFrom = prefix + "-01";
            let next = /* @__PURE__ */ new Date(virtualFrom + "T12:00:00");
            next.setMonth(next.getMonth() + 1, 0);
            virtualTo = Core.dateKey(next);
          } else {
            virtualFrom = prefix;
            virtualTo = prefix;
          }
          if (from && from > virtualFrom) virtualFrom = from;
          if (to && to < virtualTo) virtualTo = to;
        }
        if (Core.isDate(virtualFrom) && Core.isDate(virtualTo)) {
          let count = 0;
          for (let date = virtualFrom; Core.isDate(date) && date <= virtualTo && count < 36600; date = Core.shift(date, 1), count++) for (let b of entries(date).values()) {
            if (!b.seriesId || seen.has(date + b.id)) continue;
            let body = (Core.label(this.cache, b) + " " + b.notes).toLowerCase();
            if (terms.every((t) => body.includes(t.toLowerCase()))) {
              matches.push({ date, id: b.id, b, rank: 0 });
              seen.add(date + b.id);
            }
          }
        }
        if (structured && (value.type || value.task)) matches = matches.filter((x) => {
          let kind = x.kind || "block";
          if (value.type && kind !== value.type) return false;
          if (!value.task) return true;
          if (x.b) return x.b.cat === value.task;
          if (kind === "backlog") return this.cache.backlog[x.id]?.cat === value.task;
          if (kind === "daily-note") {
            let note = this.cache.days[x.date]?.dailyNotes?.find((n) => n.id === x.id);
            return note?.links.some((l) => entries(l.date).get(l.id)?.cat === value.task);
          }
          return false;
        });
        matches.sort((a, b) => a.rank - b.rank || b.date.localeCompare(a.date) || (a.b?.start || 0) - (b.b?.start || 0));
        if (!structured) return matches;
        let offset = Math.max(0, +value.offset || 0);
        return { items: value.all ? matches : matches.slice(offset, offset + 100), total: matches.length, virtualTo };
      }
      pruneCheckpoints() {
        let files = fs.readdirSync(this.backups).filter((f) => /^before-restore-.*\.json\.gz$/.test(f)).sort().reverse();
        for (let name of files.slice(20)) fs.unlinkSync(path.join(this.backups, name));
      }
      checkpoint() {
        this.backupNamed("before-restore-" + this.clock().toISOString().replace(/[:.]/g, "-"), this.cache);
        this.pruneCheckpoints();
        return { ok: true };
      }
      close() {
        try {
          this.flushRecent();
        } finally {
          this.backupClearTimeout(this.backupTimer);
          this.backupTimer = null;
          this.db.close();
        }
      }
    };
    module2.exports = { PlannerStorage: PlannerStorage2 };
  }
});

// backup-import.cjs
var require_backup_import = __commonJS({
  "backup-import.cjs"(exports2, module2) {
    var fs = require("node:fs/promises");
    var { Transform, Writable } = require("node:stream");
    var { pipeline } = require("node:stream/promises");
    var { createGunzip } = require("node:zlib");
    var LIMITS = Object.freeze({ compressed: 32 * 1024 * 1024, expanded: 64 * 1024 * 1024, timeout: 3e4 });
    function limit(bytes, message) {
      let total = 0;
      return new Transform({ transform(chunk, encoding, done) {
        total += chunk.length;
        done(total > bytes ? Object.assign(Error(message), { code: "BACKUP_LIMIT" }) : null, chunk);
      } });
    }
    async function readBackup(file) {
      let handle, source, decoder, timer;
      try {
        handle = await fs.open(file, "r");
        let stat = await handle.stat();
        if (!stat.isFile()) throw Error("Choose a regular backup file.");
        let header = Buffer.alloc(2);
        await handle.read(header, 0, 2, 0);
        let compressed = /\.gz$/i.test(file) || header[0] === 31 && header[1] === 139, max = compressed ? LIMITS.compressed : LIMITS.expanded;
        if (stat.size > max) throw Object.assign(Error("Backup file exceeds the " + max / 1024 / 1024 + " MiB " + (compressed ? "compressed " : "") + "size limit."), { code: "BACKUP_LIMIT" });
        source = handle.createReadStream({ start: 0, autoClose: false });
        let chunks = [], total = 0, sink = new Writable({ write(chunk, encoding, done) {
          chunks.push(chunk);
          total += chunk.length;
          done();
        } }), streams = [source, limit(max, "Backup file grew beyond the size limit.")];
        if (compressed) {
          decoder = createGunzip();
          streams.push(decoder, limit(LIMITS.expanded, "Decompressed backup exceeds the 64 MiB limit."));
        }
        streams.push(sink);
        timer = setTimeout(() => source.destroy(Object.assign(Error("Backup import exceeded the 30-second time limit."), { code: "BACKUP_LIMIT" })), LIMITS.timeout);
        timer.unref?.();
        await pipeline(...streams);
        let json;
        try {
          json = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, total));
        } catch {
          throw Error("Backup contains invalid UTF-8 text.");
        }
        let envelope;
        try {
          envelope = JSON.parse(json);
        } catch {
          throw Error("Backup contains invalid JSON.");
        }
        if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw Error("Backup must contain a valid Daymark planner or recovery export.");
        return { json, envelope };
      } catch (e) {
        if (e.code?.startsWith("Z_")) throw Error("Backup gzip data is malformed or incomplete.");
        throw e;
      } finally {
        clearTimeout(timer);
        source?.destroy();
        decoder?.destroy();
        await handle?.close();
      }
    }
    async function prepareImport(file) {
      const Core = require_core();
      let { envelope } = await readBackup(file);
      if (envelope.format !== "daymark-recovery") return { choices: [{ key: "normal", data: Core.normalize(envelope) }] };
      if (envelope.formatVersion !== 1) throw Error("This recovery export needs a newer version of Daymark. Update Daymark before opening it.");
      let choices = [], versionError;
      for (let [key, label] of [["confirmed", "Last confirmed saved state"], ["pending", "Pending changes (not confirmed saved)"]]) {
        if (!envelope[key]?.state) continue;
        try {
          choices.push({ key, label, data: Core.normalize(envelope[key].state) });
        } catch (e) {
          if (e.code === "NEWER_VERSION") versionError = e;
        }
      }
      if (!choices.length && versionError) throw versionError;
      if (!choices.length) throw Error("This recovery export contains no valid restorable state.");
      return { choices };
    }
    module2.exports = { readBackup, prepareImport, LIMITS };
  }
});

// worker-entry.cjs
var { parentPort, workerData } = require("node:worker_threads");
var { PlannerStorage } = require_storage();
var storage;
var startError;
try {
  storage = new PlannerStorage(workerData.dir, void 0, { onBackupStatus: (status) => parentPort.postMessage({ event: "backup-status", status }) });
} catch (e) {
  startError = e.message;
}
parentPort.on("message", async ({ id, method, value }) => {
  try {
    if (startError) throw Error(startError);
    let result = method === "external-status" ? storage.external.status() : method === "external-configure" ? (storage.external.configure(value), storage.backupDirty = true, storage.flushRecent(), storage.external.status()) : method === "external-disable" ? storage.external.disable() : method === "import-backup" ? await require_backup_import().prepareImport(value) : method === "legacy-theme" ? storage.legacyTheme : method === "read" ? { ...storage.cache, ...storage.legacyTheme ? { theme: storage.legacyTheme } : {} } : method === "save" ? storage.save(value) : method === "patch" ? storage.patch(value) : method === "search" ? storage.search(value) : method === "checkpoint" ? storage.checkpoint() : method === "flush-backups" ? storage.flushRecent() : null;
    parentPort.postMessage({ id, result });
  } catch (e) {
    parentPort.postMessage({ id, error: e.message, code: e.code });
  }
});
