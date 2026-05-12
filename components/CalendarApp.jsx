"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  combineDateAndTime,
  formatDateInput,
  formatDayKey,
  formatMonthLabel,
  formatTime,
  formatTimeInput,
  formatWeekday,
  isSameDay,
  monthGrid,
  startOfDay,
  startOfWeek,
  weekDays
} from "../lib/date-utils.js";
import {
  calendarForEvent,
  createEvent,
  createReminder,
  dueReminders,
  eventsForDate,
  eventsForMonth,
  eventsForRange,
  seedSnapshot,
  visibleEvents
} from "../lib/calendar.js";
import { exportSnapshot, importSnapshot, loadSnapshot, resetSnapshot, saveSnapshot } from "../lib/storage.js";

const viewLabels = [
  ["day", "Day"],
  ["week", "Week"],
  ["month", "Month"],
  ["agenda", "Agenda"],
  ["year", "Year"]
];

const emptyEventForm = {
  id: "",
  title: "",
  calendarId: "work",
  location: "",
  notes: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  status: "scheduled",
  recurrence: "none"
};

const emptyReminderForm = {
  id: "",
  title: "",
  date: "",
  time: "09:00",
  priority: "medium"
};

export default function CalendarApp() {
  const [snapshot, setSnapshot] = useState(null);
  const [query, setQuery] = useState("");
  const [activeEvent, setActiveEvent] = useState(null);
  const [showEvent, setShowEvent] = useState(false);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [reminderForm, setReminderForm] = useState(emptyReminderForm);
  const [showSettings, setShowSettings] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSnapshot(loadSnapshot(new Date().toISOString()));
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    saveSnapshot(snapshot);
  }, [snapshot]);

  const selectedDate = useMemo(
    () => (snapshot ? new Date(snapshot.selectedDate) : startOfDay(new Date())),
    [snapshot]
  );

  const visible = useMemo(() => {
    if (!snapshot) return [];
    const base = visibleEvents(snapshot.events, snapshot.calendars);
    if (!query.trim()) return base;
    const term = query.toLowerCase();
    return base.filter((event) =>
      [event.title, event.location, event.notes].some((value) => value.toLowerCase().includes(term))
    );
  }, [snapshot, query]);

  if (!snapshot) {
    return <main className="boot-screen">Preparing your calendar...</main>;
  }

  function update(next) {
    setSnapshot((current) => {
      const value = typeof next === "function" ? next(current) : next;
      return value;
    });
  }

  function selectDate(date) {
    update((current) => ({ ...current, selectedDate: startOfDay(date).toISOString() }));
  }

  function moveDate(amount) {
    if (snapshot.view === "month") selectDate(addMonths(selectedDate, amount));
    else if (snapshot.view === "year") selectDate(addMonths(selectedDate, amount * 12));
    else selectDate(addDays(selectedDate, amount * (snapshot.view === "week" ? 7 : 1)));
  }

  function openEvent(event = null, date = selectedDate) {
    const fallbackCalendar = snapshot.calendars.find((calendar) => calendar.visible) ?? snapshot.calendars[0];
    const start = event ? new Date(event.start) : new Date(date);
    if (!event) start.setHours(9, 0, 0, 0);
    const end = event ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

    setActiveEvent(event);
    setShowEvent(true);
    setEventForm({
      id: event?.id ?? "",
      title: event?.title ?? "",
      calendarId: event?.calendarId ?? fallbackCalendar.id,
      location: event?.location ?? "",
      notes: event?.notes ?? "",
      date: formatDateInput(start),
      startTime: formatTimeInput(start),
      endTime: formatTimeInput(end),
      allDay: event?.allDay ?? false,
      status: event?.status ?? "scheduled",
      recurrence: event?.recurrence ?? "none"
    });
  }

  function saveEvent() {
    if (!eventForm.title.trim()) return;
    const start = eventForm.allDay
      ? combineDateAndTime(eventForm.date, "00:00")
      : combineDateAndTime(eventForm.date, eventForm.startTime);
    const end = eventForm.allDay
      ? combineDateAndTime(eventForm.date, "23:59")
      : combineDateAndTime(eventForm.date, eventForm.endTime);

    const nextEvent = createEvent({
      id: eventForm.id || undefined,
      calendarId: eventForm.calendarId,
      title: eventForm.title.trim(),
      location: eventForm.location.trim(),
      notes: eventForm.notes.trim(),
      start,
      end,
      allDay: eventForm.allDay,
      status: eventForm.status,
      recurrence: eventForm.recurrence
    });

    update((current) => ({
      ...current,
      events: eventForm.id
        ? current.events.map((event) => (event.id === eventForm.id ? nextEvent : event))
        : [...current.events, nextEvent]
    }));
    setShowEvent(false);
    setActiveEvent(null);
    setToast(eventForm.id ? "Event updated" : "Event created");
  }

  function deleteEvent(id) {
    update((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }));
    setShowEvent(false);
    setActiveEvent(null);
    setToast("Event deleted");
  }

  function duplicateEvent(event) {
    const copy = createEvent({
      ...event,
      id: undefined,
      title: `${event.title} copy`,
      start: addDays(event.start, 1).toISOString(),
      end: addDays(event.end, 1).toISOString()
    });
    update((current) => ({ ...current, events: [...current.events, copy] }));
    setToast("Event duplicated");
  }

  function saveReminder() {
    if (!reminderForm.title.trim()) return;
    const due = combineDateAndTime(reminderForm.date || formatDateInput(selectedDate), reminderForm.time);
    const reminder = createReminder({
      id: reminderForm.id || undefined,
      title: reminderForm.title.trim(),
      due,
      priority: reminderForm.priority
    });
    update((current) => ({
      ...current,
      reminders: reminderForm.id
        ? current.reminders.map((item) => (item.id === reminder.id ? reminder : item))
        : [...current.reminders, reminder]
    }));
    setShowReminder(false);
    setReminderForm(emptyReminderForm);
  }

  function toggleReminder(id) {
    update((current) => ({
      ...current,
      reminders: current.reminders.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  }

  function toggleCalendar(id) {
    update((current) => ({
      ...current,
      calendars: current.calendars.map((calendar) =>
        calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar
      )
    }));
  }

  function updateCalendar(id, field, value) {
    update((current) => ({
      ...current,
      calendars: current.calendars.map((calendar) =>
        calendar.id === id ? { ...calendar, [field]: value } : calendar
      )
    }));
  }

  function updateSetting(field, value) {
    update((current) => ({ ...current, settings: { ...current.settings, [field]: value } }));
  }

  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        setSnapshot(importSnapshot(text));
        setToast("Backup imported");
      } catch (error) {
        setToast(error.message);
      }
    });
  }

  function downloadBackup() {
    const blob = new Blob([exportSnapshot(snapshot)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clendr-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const todayEvents = eventsForDate(visible, selectedDate);
  const todayReminders = dueReminders(snapshot.reminders, selectedDate);

  return (
    <main className={`calendar-app density-${snapshot.settings.density}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">C</div>
          <div>
            <p className="eyebrow">Local calendar</p>
            <h1>Clendr</h1>
          </div>
        </div>

        <button className="primary-action" onClick={() => openEvent()}>
          <span>+</span> New Event
        </button>

        <MiniMonth
          selectedDate={selectedDate}
          settings={snapshot.settings}
          events={visible}
          onSelect={selectDate}
        />

        <section className="sidebar-section">
          <div className="section-title">Calendars</div>
          {snapshot.calendars.map((calendar) => (
            <label className="calendar-toggle" key={calendar.id}>
              <input
                type="checkbox"
                checked={calendar.visible}
                onChange={() => toggleCalendar(calendar.id)}
              />
              <span className="color-dot" style={{ background: calendar.color }} />
              <span>{calendar.name}</span>
            </label>
          ))}
        </section>

        <section className="sidebar-section">
          <div className="section-title">Today</div>
          <div className="today-stack">
            {todayEvents.slice(0, 3).map((event) => (
              <button className="today-item" key={event.id} onClick={() => openEvent(event)}>
                <span>{formatTime(event.start, snapshot.settings.timeFormat)}</span>
                {event.title}
              </button>
            ))}
            {todayEvents.length === 0 && <p className="muted">No visible events.</p>}
          </div>
        </section>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="date-nav">
            <button className="icon-button" onClick={() => moveDate(-1)} aria-label="Previous">
              ‹
            </button>
            <button className="today-button" onClick={() => selectDate(new Date())}>
              Today
            </button>
            <button className="icon-button" onClick={() => moveDate(1)} aria-label="Next">
              ›
            </button>
            <div>
              <p className="eyebrow">{formatWeekday(selectedDate, "long")}</p>
              <h2>{formatMonthLabel(selectedDate)}</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
            />
            <div className="segmented">
              {viewLabels.map(([value, label]) => (
                <button
                  key={value}
                  className={snapshot.view === value ? "active" : ""}
                  onClick={() => update((current) => ({ ...current, view: value }))}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="ghost-button" onClick={() => setShowSettings(true)}>
              Settings
            </button>
          </div>
        </header>

        <div className="workspace">
          <section className="calendar-surface">
            <CalendarView
              snapshot={snapshot}
              events={visible}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onOpenEvent={openEvent}
            />
          </section>

          <aside className="inspector">
            <div className="inspector-card focus-card">
              <p className="eyebrow">Selected day</p>
              <h3>{selectedDate.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</h3>
              <p>{todayEvents.length} events · {todayReminders.length} reminders</p>
            </div>

            <div className="inspector-card">
              <div className="section-row">
                <h3>Reminders</h3>
                <button
                  className="small-button"
                  onClick={() => {
                    setReminderForm({ ...emptyReminderForm, date: formatDateInput(selectedDate) });
                    setShowReminder(true);
                  }}
                >
                  Add
                </button>
              </div>
              <div className="reminder-list">
                {snapshot.reminders.slice(0, 8).map((reminder) => (
                  <label className={`reminder-item priority-${reminder.priority}`} key={reminder.id}>
                    <input
                      type="checkbox"
                      checked={reminder.completed}
                      onChange={() => toggleReminder(reminder.id)}
                    />
                    <span>
                      <strong>{reminder.title}</strong>
                      <small>{formatTime(reminder.due, snapshot.settings.timeFormat)} · {reminder.priority}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="inspector-card">
              <h3>Local Data</h3>
              <p className="muted">Your calendar lives in this browser until a backend is added.</p>
              <div className="button-row">
                <button className="ghost-button" onClick={downloadBackup}>Export</button>
                <label className="ghost-button file-button">
                  Import
                  <input type="file" accept="application/json" onChange={handleImport} />
                </label>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {showEvent && (
        <EventDialog
          calendars={snapshot.calendars}
          form={eventForm}
          setForm={setEventForm}
          activeEvent={activeEvent}
          onClose={() => {
            setShowEvent(false);
            setActiveEvent(null);
          }}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onDuplicate={duplicateEvent}
        />
      )}

      {showReminder && (
        <ReminderDialog
          form={reminderForm}
          setForm={setReminderForm}
          onClose={() => setShowReminder(false)}
          onSave={saveReminder}
        />
      )}

      {showSettings && (
        <SettingsDialog
          snapshot={snapshot}
          updateSetting={updateSetting}
          updateCalendar={updateCalendar}
          onClose={() => setShowSettings(false)}
          onReset={() => {
            setSnapshot(resetSnapshot(new Date().toISOString()));
            setShowSettings(false);
          }}
        />
      )}

      {toast && (
        <button className="toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </main>
  );
}

function MiniMonth({ selectedDate, settings, events, onSelect }) {
  const days = monthGrid(selectedDate, settings.weekStartsOn);
  const month = selectedDate.getMonth();
  return (
    <section className="mini-month">
      <div className="section-title">{formatMonthLabel(selectedDate)}</div>
      <div className="mini-grid weekdays">
        {weekDays(selectedDate, settings.weekStartsOn).map((day) => (
          <span key={day.toISOString()}>{formatWeekday(day).slice(0, 1)}</span>
        ))}
      </div>
      <div className="mini-grid">
        {days.map((day) => {
          const hasEvents = eventsForDate(events, day).length > 0;
          return (
            <button
              key={day.toISOString()}
              className={`${day.getMonth() !== month ? "muted-day" : ""} ${isSameDay(day, selectedDate) ? "selected" : ""}`}
              onClick={() => onSelect(day)}
            >
              {day.getDate()}
              {hasEvents && <i />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CalendarView({ snapshot, events, selectedDate, onSelectDate, onOpenEvent }) {
  if (snapshot.view === "day") {
    return <DayView snapshot={snapshot} events={eventsForDate(events, selectedDate)} selectedDate={selectedDate} onOpenEvent={onOpenEvent} />;
  }
  if (snapshot.view === "month") {
    return <MonthView snapshot={snapshot} events={events} selectedDate={selectedDate} onSelectDate={onSelectDate} onOpenEvent={onOpenEvent} />;
  }
  if (snapshot.view === "agenda") {
    return <AgendaView snapshot={snapshot} events={events} onOpenEvent={onOpenEvent} />;
  }
  if (snapshot.view === "year") {
    return <YearView snapshot={snapshot} events={events} selectedDate={selectedDate} onSelectDate={onSelectDate} />;
  }
  return <WeekView snapshot={snapshot} events={events} selectedDate={selectedDate} onSelectDate={onSelectDate} onOpenEvent={onOpenEvent} />;
}

function WeekView({ snapshot, events, selectedDate, onSelectDate, onOpenEvent }) {
  const days = weekDays(selectedDate, snapshot.settings.weekStartsOn);
  const hours = Array.from({ length: 13 }, (_, index) => index + 7);
  return (
    <div className="week-view">
      <div className="week-header">
        <span />
        {days.map((day) => (
          <button key={day.toISOString()} className={isSameDay(day, selectedDate) ? "active-day" : ""} onClick={() => onSelectDate(day)}>
            <strong>{formatWeekday(day)}</strong>
            <b>{day.getDate()}</b>
          </button>
        ))}
      </div>
      <div className="week-grid">
        {hours.map((hour) => (
          <div className="hour-row" key={hour}>
            <span className="hour-label">{hour > 12 ? hour - 12 : hour}:00</span>
            {days.map((day) => {
              const slotEvents = eventsForDate(events, day).filter((event) => new Date(event.start).getHours() === hour);
              return (
                  <div className="hour-cell" key={`${day.toISOString()}-${hour}`} onDoubleClick={() => {
                    const slot = new Date(day);
                    slot.setHours(hour, 0, 0, 0);
                    onOpenEvent(null, slot);
                  }}>
                  {slotEvents.map((event) => (
                    <EventPill key={event.id} event={event} calendars={snapshot.calendars} settings={snapshot.settings} onOpenEvent={onOpenEvent} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ snapshot, events, selectedDate, onOpenEvent }) {
  const hours = Array.from({ length: 15 }, (_, index) => index + 6);
  return (
    <div className="day-view">
      <div className="day-hero">
        <p>{formatWeekday(selectedDate, "long")}</p>
        <h3>{selectedDate.getDate()}</h3>
      </div>
      {hours.map((hour) => (
        <div className="day-row" key={hour}>
          <span>{hour > 12 ? hour - 12 : hour}:00</span>
          <div className="day-slot" onDoubleClick={() => {
            const slot = new Date(selectedDate);
            slot.setHours(hour, 0, 0, 0);
            onOpenEvent(null, slot);
          }}>
            {events
              .filter((event) => new Date(event.start).getHours() === hour)
              .map((event) => (
                <EventPill key={event.id} event={event} calendars={snapshot.calendars} settings={snapshot.settings} onOpenEvent={onOpenEvent} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({ snapshot, events, selectedDate, onSelectDate, onOpenEvent }) {
  const days = monthGrid(selectedDate, snapshot.settings.weekStartsOn);
  return (
    <div className="month-view">
      <div className="month-weekdays">
        {weekDays(selectedDate, snapshot.settings.weekStartsOn).map((day) => (
          <span key={day.toISOString()}>{formatWeekday(day)}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const dayEvents = eventsForDate(events, day);
          return (
            <button className={`month-cell ${isSameDay(day, selectedDate) ? "selected" : ""}`} key={day.toISOString()} onClick={() => onSelectDate(day)}>
              <strong>{day.getDate()}</strong>
              {dayEvents.slice(0, 4).map((event) => {
                const calendar = calendarForEvent(event, snapshot.calendars);
                return (
                  <span key={event.id} style={{ borderLeftColor: calendar.color }} onDoubleClick={() => onOpenEvent(event)}>
                    {event.title}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ snapshot, events, onOpenEvent }) {
  const grouped = events.reduce((acc, event) => {
    const key = formatDayKey(event.start);
    acc[key] = acc[key] ?? [];
    acc[key].push(event);
    return acc;
  }, {});
  return (
    <div className="agenda-view">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <section className="agenda-day" key={day}>
          <h3>{new Date(day).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</h3>
          {dayEvents.map((event) => (
            <EventPill key={event.id} event={event} calendars={snapshot.calendars} settings={snapshot.settings} onOpenEvent={onOpenEvent} />
          ))}
        </section>
      ))}
    </div>
  );
}

function YearView({ snapshot, events, selectedDate, onSelectDate }) {
  const months = Array.from({ length: 12 }, (_, index) => new Date(selectedDate.getFullYear(), index, 1));
  return (
    <div className="year-view">
      {months.map((month) => (
        <button className="year-month" key={month.toISOString()} onClick={() => onSelectDate(month)}>
          <strong>{month.toLocaleDateString("en", { month: "short" })}</strong>
          <span>{eventsForMonth(events, month).length} events</span>
          <div>
            {monthGrid(month, snapshot.settings.weekStartsOn).slice(0, 35).map((day) => (
              <i key={day.toISOString()} className={eventsForDate(events, day).length ? "has-event" : ""} />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function EventPill({ event, calendars, settings, onOpenEvent }) {
  const calendar = calendarForEvent(event, calendars);
  return (
    <button className={`event-pill status-${event.status}`} style={{ "--event-color": calendar.color }} onClick={() => onOpenEvent(event)}>
      <span>{event.allDay ? "All day" : formatTime(event.start, settings.timeFormat)}</span>
      <strong>{event.title}</strong>
      {event.location && <em>{event.location}</em>}
    </button>
  );
}

function EventDialog({ calendars, form, setForm, activeEvent, onClose, onSave, onDelete, onDuplicate }) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <header>
          <h2>{form.id ? "Edit Event" : "New Event"}</h2>
          <button className="icon-button" onClick={onClose}>×</button>
        </header>
        <div className="form-grid">
          <label className="span-2">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus /></label>
          <label>Calendar<select value={form.calendarId} onChange={(event) => setForm({ ...form, calendarId: event.target.value })}>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="done">Done</option></select></label>
          <label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Starts<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} disabled={form.allDay} /></label>
          <label>Ends<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} disabled={form.allDay} /></label>
          <label>Repeat<select value={form.recurrence} onChange={(event) => setForm({ ...form, recurrence: event.target.value })}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
          <label className="span-2 check-row"><input type="checkbox" checked={form.allDay} onChange={(event) => setForm({ ...form, allDay: event.target.checked })} /> All day</label>
          <label className="span-2">Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
          <label className="span-2">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        </div>
        <footer>
          {form.id && <button className="danger-button" onClick={() => onDelete(form.id)}>Delete</button>}
          {activeEvent && <button className="ghost-button" onClick={() => onDuplicate(activeEvent)}>Duplicate</button>}
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-action compact" onClick={onSave}>Save Event</button>
        </footer>
      </section>
    </div>
  );
}

function ReminderDialog({ form, setForm, onClose, onSave }) {
  return (
    <div className="modal-backdrop">
      <section className="modal compact-modal">
        <header><h2>New Reminder</h2><button className="icon-button" onClick={onClose}>×</button></header>
        <div className="form-grid">
          <label className="span-2">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus /></label>
          <label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Time<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label>
          <label className="span-2">Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </div>
        <footer><button className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-action compact" onClick={onSave}>Save Reminder</button></footer>
      </section>
    </div>
  );
}

function SettingsDialog({ snapshot, updateSetting, updateCalendar, onClose, onReset }) {
  return (
    <div className="modal-backdrop">
      <section className="modal settings-modal">
        <header><h2>Settings</h2><button className="icon-button" onClick={onClose}>×</button></header>
        <div className="settings-grid">
          <section>
            <h3>General</h3>
            <label>Default view<select value={snapshot.settings.defaultView} onChange={(event) => updateSetting("defaultView", event.target.value)}>{viewLabels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Week starts on<select value={snapshot.settings.weekStartsOn} onChange={(event) => updateSetting("weekStartsOn", Number(event.target.value))}><option value="1">Monday</option><option value="0">Sunday</option></select></label>
            <label>Time format<select value={snapshot.settings.timeFormat} onChange={(event) => updateSetting("timeFormat", event.target.value)}><option value="12h">12 hour</option><option value="24h">24 hour</option></select></label>
            <label>Density<select value={snapshot.settings.density} onChange={(event) => updateSetting("density", event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
            <label className="check-row"><input type="checkbox" checked={snapshot.settings.notifications} onChange={(event) => updateSetting("notifications", event.target.checked)} /> Notifications</label>
          </section>
          <section>
            <h3>Calendars</h3>
            {snapshot.calendars.map((calendar) => (
              <div className="calendar-setting" key={calendar.id}>
                <input type="color" value={calendar.color} onChange={(event) => updateCalendar(calendar.id, "color", event.target.value)} />
                <input value={calendar.name} onChange={(event) => updateCalendar(calendar.id, "name", event.target.value)} />
              </div>
            ))}
          </section>
          <section>
            <h3>Storage</h3>
            <p className="muted">Reset clears browser-local data and restores sample calendars, events, reminders, and settings.</p>
            <button className="danger-button" onClick={onReset}>Reset Local Calendar</button>
          </section>
        </div>
      </section>
    </div>
  );
}
